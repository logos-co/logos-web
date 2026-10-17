import { describe, expect, it } from 'vitest'
import { parseOcrTsv, ocrConfidenceScore } from '../../../scripts/zines/ocr'

const tsv =
  'level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext\n' +
  '5\t1\t1\t1\t1\t1\t30\t150\t90\t30\t96\tShared\n' +
  '5\t1\t1\t1\t1\t2\t126\t150\t75\t30\t94\tstories\n' +
  '5\t1\t2\t1\t1\t1\t30\t240\t30\t30\t92\t05\n'

describe('PDF OCR word positions', () => {
  it('converts pixels to PDF points while preserving searchable folios outside reading blocks', () => {
    const result = parseOcrTsv(tsv, 3)
    expect(result.words.map((word) => word.text)).toEqual([
      'Shared',
      'stories',
      '05',
    ])
    expect(result.blocks).toEqual([
      { x: 10, y: 50, width: 57, height: 10, start: 0, end: 2 },
    ])
  })
  it('scores confidently recognised prose rather than stray punctuation in photographs', () => {
    expect(ocrConfidenceScore(tsv)).toBe(13)
    expect(ocrConfidenceScore(tsv.replace(/96|94/g, '10'))).toBe(0)
  })
})
