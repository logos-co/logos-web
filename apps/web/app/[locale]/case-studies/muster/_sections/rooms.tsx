import Image from 'next/image'
import type { MusterCopySection } from '@repo/content/schemas'

import { Paragraphs } from './shared'

export function Rooms({ copy }: { copy: MusterCopySection['rooms'] }) {
  return (
    <section
      className="muster-section muster-dark muster-rooms"
      data-header-tone="dark"
    >
      <div className="muster-container">
        <div className="muster-split muster-section-intro">
          <h2 className="muster-heading">{copy.title}</h2>
          <Paragraphs body={copy.body} />
        </div>
        <div className="muster-room-list">
          {copy.entries.map((room) => (
            <section key={room.index} className="muster-split muster-room">
              <div className="muster-room-copy">
                <p className="muster-mono">{room.index}</p>
                <h3 className="muster-subheading">{room.title}</h3>
                <Paragraphs body={room.body} />
              </div>
              {'image' in room ? (
                <Image
                  {...room.image}
                  className="muster-photo muster-room-image"
                  sizes="(min-width: 768px) 50vw, 100vw"
                  data-muster-reveal
                />
              ) : (
                <p className="muster-room-placeholder muster-mono">
                  {room.placeholder}
                </p>
              )}
            </section>
          ))}
        </div>
      </div>
    </section>
  )
}
