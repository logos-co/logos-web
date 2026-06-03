export const ABOUT_CAROUSEL_CARD_WIDTH = 932
export const ABOUT_CAROUSEL_CARD_GAP = 12
export const ABOUT_CAROUSEL_CARD_STEP =
  ABOUT_CAROUSEL_CARD_WIDTH + ABOUT_CAROUSEL_CARD_GAP
export const ABOUT_CAROUSEL_SCROLL_DISTANCE = 2400
const INTRO_FADE_END = 0.18
const CAROUSEL_FADE_START = 0.12
const CAROUSEL_FADE_END = 0.24
export const CAROUSEL_MOTION_START = 0.18

interface AboutCarouselStateInput {
  sectionTop: number
  cardCount: number
}

interface AboutCarouselState {
  activeIndex: number
  carouselOpacity: number
  introOpacity: number
  offset: number
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function getAboutCarouselProgressForIndex({
  cardCount,
  index,
}: {
  cardCount: number
  index: number
}): number {
  const maxIndex = Math.max(0, cardCount - 1)
  const targetIndex = clamp(index, 0, maxIndex)
  const carouselProgress = maxIndex === 0 ? 0 : targetIndex / maxIndex

  return (
    CAROUSEL_MOTION_START + carouselProgress * (1 - CAROUSEL_MOTION_START)
  )
}

export function getAboutCarouselState({
  sectionTop,
  cardCount,
}: AboutCarouselStateInput): AboutCarouselState {
  const maxIndex = Math.max(0, cardCount - 1)
  const progress = clamp(-sectionTop / ABOUT_CAROUSEL_SCROLL_DISTANCE, 0, 1)
  const carouselProgress = clamp(
    (progress - CAROUSEL_MOTION_START) / (1 - CAROUSEL_MOTION_START),
    0,
    1
  )
  const maxOffset = maxIndex * ABOUT_CAROUSEL_CARD_STEP
  const offset = carouselProgress * maxOffset
  const activeIndex = clamp(
    Math.round(offset / ABOUT_CAROUSEL_CARD_STEP),
    0,
    maxIndex
  )
  const introOpacity = clamp(1 - progress / INTRO_FADE_END, 0, 1)
  const carouselOpacity = clamp(
    (progress - CAROUSEL_FADE_START) / (CAROUSEL_FADE_END - CAROUSEL_FADE_START),
    0,
    1
  )

  return { activeIndex, carouselOpacity, introOpacity, offset }
}
