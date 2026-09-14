// The demo catalogue: one entry per demo, and the single source of truth for
// the sidebar, the overview list, and each demo's own heading. Adding a demo
// means adding an entry here and a route at its `href`.

export type Demo = {
  /** Route for the demo. */
  href: string
  /** Sidebar label. Short, the name of the thing being demonstrated. */
  label: string
  /** Which part of the Logos stack this exercises. */
  stack: string
  /**
   * One line, shown on the overview.
   *
   * Say what a visitor does here, in words they already know. Not what the
   * technology is called.
   */
  summary: string
}

export const DEMOS: readonly Demo[] = [
  {
    href: '/messaging',
    label: 'Logos Messaging',
    stack: 'Delivery',
    summary:
      'Send a message from this tab to any other tab, with no server in between.',
  },
  {
    href: '/blockchain',
    label: 'Logos Blockchain',
    stack: 'Cryptarchia',
    summary:
      'Watch blocks arrive on the live test network, and open any one of them.',
  },
  {
    href: '/storage',
    label: 'Logos Storage',
    stack: 'Network',
    summary:
      'Drop in a file and see the address the network would give it.',
  },
]

export function findDemo(href: string): Demo | undefined {
  return DEMOS.find((demo) => demo.href === href)
}
