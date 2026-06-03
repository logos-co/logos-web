import { describe, expect, it } from 'vitest'

import {
  ABOUT_CAROUSEL_EXIT_DISTANCE,
  ABOUT_CAROUSEL_SCROLL_DISTANCE,
  ABOUT_CAROUSEL_TOTAL_SCROLL_DISTANCE,
  ABOUT_CAROUSEL_VISUAL_TRANSITION_MS,
  getAboutCarouselOffsetForIndex,
  getAboutCarouselState,
} from '../../components/sections/home/about-carousel-motion'

describe('about carousel motion', () => {
  it('keeps horizontal card position controlled by the selected card index', () => {
    expect(
      getAboutCarouselState({
        sectionTop: 0,
        cardCount: 4,
        activeIndex: 0,
      })
    ).toMatchObject({
      activeIndex: 0,
      carouselBlur: 0,
      carouselOpacity: 0,
      carouselTranslateY: 0,
      closingOpacity: 0,
      introOpacity: 1,
      offset: 0,
    })

    const scrolledState = getAboutCarouselState({
      sectionTop: -(ABOUT_CAROUSEL_SCROLL_DISTANCE / 2),
      cardCount: 4,
      activeIndex: 0,
    })
    expect(scrolledState.activeIndex).toBe(0)
    expect(scrolledState.carouselOpacity).toBe(1)
    expect(scrolledState.introOpacity).toBe(0)
    expect(scrolledState.offset).toBe(0)

    expect(
      getAboutCarouselState({
        sectionTop: -ABOUT_CAROUSEL_SCROLL_DISTANCE,
        cardCount: 4,
        activeIndex: 3,
      })
    ).toMatchObject({
      activeIndex: 3,
      carouselOpacity: 1,
      carouselBlur: 0,
      carouselTranslateY: 0,
      closingOpacity: 0,
      introOpacity: 0,
      offset: 2832,
    })
  })

  it('maps button-selected cards to centred rail positions', () => {
    expect(getAboutCarouselOffsetForIndex({ cardCount: 4, index: 0 })).toBe(0)
    expect(getAboutCarouselOffsetForIndex({ cardCount: 4, index: 3 })).toBe(
      2832
    )
  })

  it('fades and lifts carousel content during the exit transition', () => {
    const state = getAboutCarouselState({
      sectionTop: -(ABOUT_CAROUSEL_SCROLL_DISTANCE + ABOUT_CAROUSEL_EXIT_DISTANCE / 2),
      cardCount: 4,
      activeIndex: 3,
    })

    expect(state.activeIndex).toBe(3)
    expect(state.offset).toBe(2832)
    expect(state.carouselOpacity).toBeCloseTo(0.5)
    expect(state.carouselBlur).toBeCloseTo(10)
    expect(state.carouselTranslateY).toBeCloseTo(-32)
    expect(state.closingOpacity).toBeCloseTo(1)
    expect(state.closingTranslateY).toBeCloseTo(0)
  })

  it('uses a time-based visual transition to damp fast scroll changes', () => {
    expect(ABOUT_CAROUSEL_VISUAL_TRANSITION_MS).toBeGreaterThanOrEqual(600)
  })

  it('keeps the intro fade range short so the section remains skippable', () => {
    const state = getAboutCarouselState({
      sectionTop: -(ABOUT_CAROUSEL_SCROLL_DISTANCE / 4),
      cardCount: 4,
      activeIndex: 0,
    })

    expect(state.introOpacity).toBe(0)
    expect(state.carouselOpacity).toBeGreaterThan(0)
  })

  it('keeps the total sticky distance explicit for the closing transition', () => {
    expect(ABOUT_CAROUSEL_TOTAL_SCROLL_DISTANCE).toBe(
      ABOUT_CAROUSEL_SCROLL_DISTANCE + ABOUT_CAROUSEL_EXIT_DISTANCE
    )
  })
})
