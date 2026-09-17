/** Opens every link in a CMS or forum HTML fragment in a new tab. */
export function addTargetBlank(html: string): string {
  return html.replace(
    /<a\b(?![^>]*\btarget=)([^>]*?)>/gi,
    '<a target="_blank" rel="noopener noreferrer"$1>'
  )
}
