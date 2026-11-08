import type { CSSProperties } from 'react'
import Image from 'next/image'
import { ButtonArrowIcon } from '@acid-info/logos-ui'
import type { RailgunCopySection } from '@repo/content/schemas'

import { railgunAnchors } from '../anchors'
import { railgunImage } from '../assets'
import { BrandLockup } from './shared'

export function Navigation({
  copy,
}: {
  copy: RailgunCopySection['navigation']
}) {
  const sections = [
    [railgunAnchors.basics, copy.basics, copy.theBasics, copy.label01, 120],
    [
      railgunAnchors.privacy,
      copy.privacy,
      copy.privacyThroughDecentralisation,
      copy.label02,
      170,
    ],
    [railgunAnchors.how, copy.howItWorks, copy.howItWorks, copy.label03, 210],
    [railgunAnchors.fig, copy.theStack, copy.insideTheStack, copy.label04, 240],
    [
      railgunAnchors.numbers,
      copy.inProduction,
      copy.inProduction,
      copy.label05,
      265,
    ],
    [railgunAnchors.prifi, copy.prifi, copy.privateFinance, copy.label06, 285],
    [railgunAnchors.build, copy.build, copy.buildOnLogos, copy.label07, 300],
  ] as const
  const lockup = (
    <>
      <span className="lg">
        <BrandLockup markSize={13} />
      </span>
      <span className="x" aria-hidden="true">
        ×
      </span>
      <Image
        className="railgun-wordmark"
        src={railgunImage('wordmark-light.svg')}
        width={139}
        height={24}
        alt="RAILGUN"
      />
    </>
  )

  return (
    <>
      <header
        className="topnav wrap"
        id="topnav"
        aria-label={copy.caseStudyNavigation}
        inert
      >
        <a
          className="lockup sm cursor-pointer"
          href={railgunAnchors.top}
          aria-label={copy.logosRailgunBackTo}
        >
          {lockup}
        </a>
        <ul className="index mono" id="index">
          {sections.map(([href, short]) => (
            <li key={href}>
              <a className="cursor-pointer" href={href}>
                {short}
              </a>
            </li>
          ))}
          <li className="ind" id="ind" aria-hidden="true" />
        </ul>
        <button
          className="menubtn mono cursor-pointer"
          id="menubtn"
          type="button"
          aria-controls="menu"
          aria-expanded="false"
        >
          {copy.menu}
          <span className="bars" aria-hidden="true">
            <i />
            <i />
          </span>
        </button>
      </header>
      <div
        className="menu wrap"
        id="menu"
        inert
        role="dialog"
        aria-label={copy.sections}
        aria-hidden="true"
        aria-modal="true"
      >
        <div className="bar">
          <span className="lockup sm">{lockup}</span>
          <button
            className="close mono cursor-pointer"
            id="menuclose"
            type="button"
          >
            {copy.close}
          </button>
        </div>
        <ol>
          {sections.map(([href, , label, number, delay]) => (
            <li key={href}>
              <button
                type="button"
                className="cursor-pointer"
                data-target={href}
                style={{ '--d': `${delay}ms` } as CSSProperties}
              >
                <span className="n in">{number}</span>
                <span className="t in">{label}</span>
                <span className="arr mono in">
                  <ButtonArrowIcon className="railgun-arrow" />
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </>
  )
}
