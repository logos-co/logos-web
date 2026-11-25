export function mountCaseStudyReveals(host: HTMLElement) {
  const candidates = Array.from(
    host.querySelectorAll<HTMLElement>(
      'section h2, section h3, section h4, section p, section article, section a[href], [data-case-study-reveal]'
    )
  ).filter(
    (element) =>
      !element.closest(
        '[role="tabpanel"], [data-muster-connections], blockquote'
      ) &&
      !element.parentElement?.closest('section article') &&
      element.getBoundingClientRect().top > window.innerHeight * 0.9
  )
  const animations = new Map<HTMLElement, Animation>()
  const observer = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        .forEach(({ target }, index) => {
          const element = target as HTMLElement
          element.style.removeProperty('opacity')
          const opacity = getComputedStyle(element).opacity
          const card = element.matches('article')
          const animation = element.animate(
            [
              { opacity: 0, transform: `translateY(${card ? 28 : 18}px)` },
              { opacity, offset: 0.7 },
              { opacity, transform: 'translateY(0)' },
            ],
            {
              duration: card ? 1000 : 900,
              delay: Math.min(index * 80, 560),
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
              fill: 'backwards',
            }
          )
          animations.set(element, animation)
          animation.onfinish = () => animations.delete(element)
          observer.unobserve(element)
        })
    },
    { rootMargin: '0px 0px -10% 0px' }
  )
  candidates.forEach((element) => {
    element.style.opacity = '0'
    observer.observe(element)
  })
  function onFocus(event: FocusEvent) {
    if (!(event.target instanceof HTMLElement)) return
    candidates.forEach((element) => {
      if (!element.contains(event.target as Node)) return
      element.style.removeProperty('opacity')
      observer.unobserve(element)
      animations.get(element)?.cancel()
      animations.delete(element)
    })
  }
  host.addEventListener('focusin', onFocus)
  return () => {
    observer.disconnect()
    host.removeEventListener('focusin', onFocus)
    animations.forEach((animation) => animation.cancel())
    candidates.forEach((element) => element.style.removeProperty('opacity'))
  }
}
