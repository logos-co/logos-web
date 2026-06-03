import { describe, expect, it } from 'vitest'

import {
  ABOUT_CAROUSEL_SCROLL_DISTANCE,
  getAboutCarouselProgressForIndex,
  getAboutCarouselState,
} from '../../components/sections/home/about-carousel-motion'

describe('about carousel motion', () => {
  it('maps section scroll progress to horizontal card rail offset', () => {
    expect(
      getAboutCarouselState({
        sectionTop: 0,
        cardCount: 4,
      })
    ).toEqual({
      activeIndex: 0,
      carouselOpacity: 0,
      introOpacity: 1,
      offset: 0,
    })

    const midState = getAboutCarouselState({
      sectionTop: -1200,
      cardCount: 4,
    })
    expect(midState.activeIndex).toBe(1)
    expect(midState.carouselOpacity).toBe(1)
    expect(midState.introOpacity).toBe(0)
    expect(midState.offset).toBeCloseTo(1105.17)

    expect(
      getAboutCarouselState({
        sectionTop: -2400,
        cardCount: 4,
      })
    ).toEqual({
      activeIndex: 3,
      carouselOpacity: 1,
      introOpacity: 0,
      offset: 2832,
    })
  })

  it('maps card navigation targets back to centred rail positions', () => {
    const sectionTopForLastCard =
      -getAboutCarouselProgressForIndex({
        cardCount: 4,
        index: 3,
      }) * ABOUT_CAROUSEL_SCROLL_DISTANCE

    expect(
      getAboutCarouselState({
        sectionTop: sectionTopForLastCard,
        cardCount: 4,
      })
    ).toMatchObject({
      activeIndex: 3,
      offset: 2832,
    })
  })
})
