import ContentWidth from '@/components/layout/content-width'
import CivilSocietyAccordion from '@/components/sections/home/civil-society-accordion'
import { Link } from '@/i18n/navigation'

import { EVENT_NAMES, FAQ, type FaqBlock, type FaqLink } from '../_content'
import { SectionHeading } from './atoms'

const TOGGLE_CLASSNAME = 'text-eyebrow text-black'
const LINK_CLASSNAME = 'cursor-pointer underline underline-offset-2'

/** External links open in a new tab; site routes stay locale-aware. */
function AnswerLink({ link }: { link: FaqLink }) {
  const eventName = EVENT_NAMES.faqLink(link.label)

  if (/^https?:\/\//.test(link.href)) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        data-umami-event-name={eventName}
        className={LINK_CLASSNAME}
      >
        {link.label}
      </a>
    )
  }

  return (
    <Link
      href={link.href}
      data-umami-event-name={eventName}
      className={LINK_CLASSNAME}
    >
      {link.label}
    </Link>
  )
}

function AnswerBlock({ block }: { block: FaqBlock }) {
  if ('links' in block) {
    return (
      <ul>
        {block.links.map((link) => (
          <li key={link.href}>
            <AnswerLink link={link} />
          </li>
        ))}
      </ul>
    )
  }

  const at = block.link ? block.text.indexOf(block.link.label) : -1
  if (!block.link || at < 0) {
    return <p>{block.text}</p>
  }

  return (
    <p>
      {block.text.slice(0, at)}
      <AnswerLink link={block.link} />
      {block.text.slice(at + block.link.label.length)}
    </p>
  )
}

function Answer({ blocks }: { blocks: FaqBlock[] }) {
  return blocks.map((block, index) => <AnswerBlock key={index} block={block} />)
}

/**
 * The homepage accordion, restyled as Figma's grey question cards. Questions
 * and answers run at the site's 12px rather than the page's 10px, and the
 * answer column is sized in em so it keeps Figma's line breaks.
 */
export function Faq() {
  return (
    <section className="text-small-default mt-28">
      <ContentWidth>
        <SectionHeading>{FAQ.heading}</SectionHeading>
        <div className="mt-6">
          <CivilSocietyAccordion
            items={FAQ.items.map(({ answer, ...item }) => ({
              ...item,
              content: <Answer blocks={answer} />,
            }))}
            classNames={{
              root: 'flex w-full flex-col gap-3',
              item: 'rounded-xl bg-gray-01 p-3',
              row: 'flex w-full items-center justify-between gap-6 text-left',
              title: 'text-eyebrow text-black',
              aside: 'flex items-center',
              panel: 'pt-3',
              body: 'text-mono-s max-w-[42.2em] text-black [&>*+*]:mt-[1.3em]',
            }}
            icons={{
              open: <span className={TOGGLE_CLASSNAME}>-</span>,
              closed: <span className={TOGGLE_CLASSNAME}>+</span>,
            }}
          />
        </div>
      </ContentWidth>
    </section>
  )
}
