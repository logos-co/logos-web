/**
 * The storage demo, end to end.
 *
 * The CIDs asserted here came from a real Logos Storage node (v0.4.5), not
 * from the code under test, the same fixtures the unit tests use. What this
 * adds is the path a person actually takes: a real file through a real file
 * input, and the address the page works out for it.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { expect, test, type Page } from '@playwright/test'

const FIXTURES = join(import.meta.dirname, 'fixtures')

/** Uploaded as `text/markdown`, which is what a browser reports for a .md. */
const NOTES = {
  name: 'notes.md',
  mimeType: 'text/markdown',
  /**
   * A node refuses `text/markdown`, so the page falls back to no mimetype at
   * all. This is the CID that node returns for the same bytes uploaded with no
   * Content-Type.
   */
  cid: 'zDvZRwzm7QQ22dbaUn7ewnPiMw1vgaRyxZNGUsGJZMyJcwtn7TfF',
}

const TILE = {
  name: 'tile.png',
  mimeType: 'image/png',
  cid: 'zDvZRwzmAMXgt6gr8bn9t9JSpLX3DwLz71sL2ypESNc8rbTUePow',
}

async function drop(page: Page, file: { name: string; mimeType: string }) {
  await page.locator('input[type=file]').setInputFiles({
    name: file.name,
    mimeType: file.mimeType,
    buffer: readFileSync(join(FIXTURES, file.name)),
  })
}

/**
 * Open the demo and wait until its client code is actually running.
 *
 * The markup arrives prerendered, so the file input exists before React has
 * attached anything to it. Setting files in that window dispatches a change
 * event into nothing and the page never reacts, which is exactly how this
 * failed the first time. The roster request is the signal that a client
 * component has mounted.
 */
async function openDemo(page: Page) {
  const hydrated = page.waitForResponse((response) =>
    response.url().includes('/api/storage/fleet')
  )
  await page.goto('/storage')
  await hydrated
}

/**
 * The value shown against one of the panel's labels.
 *
 * The labels are uppercased by CSS, so they read `BLOCKS` on screen but are
 * `Blocks` in the DOM, which is what a locator sees.
 */
function statValue(page: Page, label: string) {
  return page.getByRole('term').filter({ hasText: label }).locator('+ dd')
}

test.describe('storage demo', () => {
  test.beforeEach(async ({ page }) => {
    await openDemo(page)
  })

  test('gives a file the CID a node would', async ({ page }) => {
    await drop(page, TILE)

    await expect(page.getByText(TILE.cid)).toBeVisible()
    await expect(statValue(page, 'Blocks')).toHaveText('1')
    await expect(statValue(page, 'Type')).toHaveText('image/png')
  })

  test('records no type when the browser cannot name one', async ({ page }) => {
    // Same rule as a refused type, so a file with no extension and a file with
    // a refused one are explained the same way rather than diverging.
    //
    // Dropped rather than chosen through the input: Chrome reports an empty
    // type for a name it cannot map, like LICENSE or Dockerfile, but
    // `setInputFiles` substitutes application/octet-stream for an empty
    // mimeType and the case never arises.
    await page.evaluate(() => {
      const file = new File(['Apache License\nVersion 2.0\n'], 'LICENSE', {
        type: '',
      })
      const transfer = new DataTransfer()
      transfer.items.add(file)

      const zone = document.querySelector('[data-dropzone]')
      if (!zone) throw new Error('no dropzone')
      zone.dispatchEvent(
        new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer: transfer,
        })
      )
    })

    await expect(statValue(page, 'Type')).toHaveText('none')
    await expect(
      page.getByText('Your browser could not name a file type')
    ).toBeVisible()
  })

  test('falls back to no mimetype when a node would refuse the type', async ({
    page,
  }) => {
    // The case that sent us here: a README reports as text/markdown, which the
    // node rejects outright, so the CID has to describe an upload with none.
    await drop(page, NOTES)

    await expect(page.getByText(NOTES.cid)).toBeVisible()
    await expect(statValue(page, 'Type')).toHaveText('none')
    await expect(
      page.getByText(/text\/markdown, which a Logos Storage node refuses/)
    ).toBeVisible()
  })

  test('proves one block belongs to the file', async ({ page }) => {
    await drop(page, TILE)

    // The point of the panel: a node proves it still holds a block without
    // producing the rest of the file.
    await expect(page.getByText(/^Block 0 belongs to this file/)).toBeVisible()
  })

  test('proves the odd block of a file with an odd count', async ({ page }) => {
    // Five blocks means a level pairs its last node with zeroes, and the key
    // byte changes with it. Block 4 is the one that walks that path.
    await page.evaluate(() => {
      const bytes = new Uint8Array(294912)
      let state = 5
      for (let i = 0; i < bytes.length; i += 1) {
        state ^= state << 13
        state |= 0
        state ^= state >>> 17
        state ^= state << 5
        state |= 0
        bytes[i] = state & 0xff
      }

      const transfer = new DataTransfer()
      transfer.items.add(
        new File([bytes], 'archive.bin', { type: 'application/octet-stream' })
      )
      document.querySelector('[data-dropzone]')!.dispatchEvent(
        new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer: transfer,
        })
      )
    })

    await expect(statValue(page, 'Blocks')).toHaveText('5')

    await page.getByLabel('Block').selectOption('4')
    await expect(page.getByText(/^Block 4 belongs to this file/)).toBeVisible()
  })
})
