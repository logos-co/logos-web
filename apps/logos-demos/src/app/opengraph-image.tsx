import { ImageResponse } from 'next/og'

import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/site'

/**
 * The card shown when a link to this app is pasted somewhere.
 *
 * Drawn here rather than checked in as a picture, so it cannot drift from the
 * name and description the pages use. Rendered at build time.
 */

export const alt = `${SITE_NAME}. ${SITE_DESCRIPTION}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const DARK_GREEN = '#152521'
const OFF_WHITE = '#f5f5ef'

export default async function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: DARK_GREEN,
        color: OFF_WHITE,
        padding: 80,
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {/* The Logos lambda, the same path the favicon uses. */}
        <svg width="72" height="72" viewBox="0 0 32 32" fill="none">
          <path
            transform="translate(6 3)"
            d="M14.6386 26C13.728 26 12.945 25.7854 12.2881 25.3549C11.6312 24.9244 11.1344 24.2467 10.7962 23.3233C10.5841 22.7003 10.4359 21.9368 10.3513 21.0328C10.2668 20.1302 10.2134 19.1833 10.1926 18.1948C10.1718 17.1842 10.1497 16.2061 10.1289 15.2592C10.1289 15.0017 10.0651 14.8716 9.93897 14.8716C9.83361 14.8716 9.72695 14.9575 9.62159 15.1292C9.21967 15.8822 8.74359 16.742 8.19208 17.7097C7.66268 18.6773 7.13328 19.645 6.60388 20.6127C6.07447 21.5804 5.5984 22.4518 5.17436 23.2257C4.77243 23.9788 4.48627 24.5264 4.31717 24.871C4.10515 25.3445 3.76696 25.6449 3.3013 25.7737C2.85644 25.9246 2.29582 25.9571 1.61814 25.8699C0.940452 25.7841 0.464381 25.5149 0.188624 25.0635C-0.107945 24.5901 -0.0546142 24.0958 0.347315 23.5795C0.623072 23.2348 1.01459 22.7198 1.52188 22.0317C2.03047 21.3216 2.6015 20.5269 3.23626 19.645C3.87102 18.7424 4.51749 17.8176 5.17306 16.8707C5.85075 15.9031 6.48551 14.9783 7.07865 14.0964C7.67178 13.1938 8.16867 12.4082 8.5706 11.7423C8.99464 11.0542 9.26909 10.5483 9.39657 10.2257C9.52404 9.92526 9.66062 9.591 9.8089 9.22551C9.95719 8.86003 10.0313 8.48414 10.0313 8.09655C10.0313 6.67754 9.89345 5.61231 9.61899 4.90345C9.36535 4.17249 9.01545 3.68864 8.5706 3.45193C8.14655 3.1944 7.68089 3.06433 7.1736 3.06433C6.79248 3.06433 6.38015 3.13977 5.9353 3.29065C5.51125 3.44152 5.2368 3.58069 5.10933 3.70945C4.87649 3.94617 4.65407 3.98909 4.44205 3.83822C4.23002 3.68734 4.16629 3.44022 4.25214 3.09685C4.48497 2.30085 4.90901 1.592 5.52296 0.967684C6.13951 0.322561 6.9967 0 8.09713 0C9.26129 0 10.1822 0.332967 10.8599 1.0002C11.5376 1.66743 12.0241 2.73137 12.3206 4.1933C12.6172 5.65523 12.7655 7.5906 12.7655 9.9994C12.7655 12.8374 12.8084 15.1071 12.893 16.8057C12.9775 18.5044 13.1154 19.7842 13.3053 20.6439C13.4952 21.4828 13.7606 22.0421 14.0987 22.3218C14.459 22.6014 14.9026 22.7406 15.432 22.7406C15.9614 22.7406 16.4167 22.6326 16.8615 22.418C17.3272 22.2034 17.7291 21.9238 18.0686 21.5791C18.2169 21.4074 18.386 21.3424 18.5772 21.3853C18.7671 21.4282 18.9154 21.5466 19.022 21.7404C19.1495 21.9121 19.1495 22.1384 19.022 22.418C18.5772 23.4078 17.9841 24.2571 17.2439 24.966C16.5246 25.654 15.6557 25.9987 14.6399 25.9987L14.6386 26Z"
            fill={OFF_WHITE}
          />
        </svg>
        <span style={{ fontSize: 40, letterSpacing: -0.5 }}>{SITE_NAME}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <span style={{ fontSize: 76, lineHeight: 1.1, letterSpacing: -1.5 }}>
          Try the Logos stack from a browser
        </span>
        <span style={{ fontSize: 34, opacity: 0.7 }}>
          Messaging · Blockchain · Storage
        </span>
      </div>
    </div>,
    size
  )
}
