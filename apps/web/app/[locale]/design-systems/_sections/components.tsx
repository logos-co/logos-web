/**
 * Component showcase sections for the `/design-systems` page —
 * Cards, Buttons, Tables, Giant Switches, View Toggles, Paginations, Footers.
 * Each render block mirrors a Figma frame and exists only for visual review.
 */
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import {
  Footer,
  GiantSwitch,
  GiantSwitchTag,
  LogosMark,
  Pagination,
  Table,
  TableRow,
  ViewToggle,
} from '@acid-info/logos-ui'
import type { Language } from '@repo/content/schemas'

import { TechStackDiagram } from '@/components/sections/shared/tech-stack-diagram'
import { Button } from '@/components/ui'
import { EXTERNAL_URLS, ROUTES } from '@/constants/routes'
import { getHomeTechStackOverview } from '@/lib/tech-stack-overview'

// --- Cards --------------------------------------------------------------

export async function Cards({ locale }: { locale: Language }) {
  const techStack = await getHomeTechStackOverview(locale)

  return (
    <div className="flex w-full flex-col gap-[32px] bg-white p-[20px]">
      <h2 className="font-display text-[64px] leading-[1] tracking-[-0.03em] text-brand-dark-green">
        Cards
      </h2>
      <TechStackDiagram
        data={techStack}
        networkingHref={ROUTES.networking}
        foundationHref={ROUTES.technologyStack}
      />
    </div>
  )
}

// --- Buttons ------------------------------------------------------------

export function Buttons() {
  return (
    <div className="flex w-full flex-col gap-[32px] bg-white p-[20px]">
      <h2 className="font-display text-[64px] leading-[1] tracking-[-0.03em] text-brand-dark-green">
        Buttons
      </h2>
      <div className="grid grid-cols-1 items-start gap-[32px] sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col items-start gap-[12px]">
          <p className="font-mono text-[10px] leading-[1.3] font-medium text-brand-dark-green uppercase opacity-50">
            Primary
          </p>
          <Button variant="primary" href={EXTERNAL_URLS.docs}>
            View The Docs
          </Button>
        </div>
        <div className="flex flex-col items-start gap-[12px]">
          <p className="font-mono text-[10px] leading-[1.3] font-medium text-brand-dark-green uppercase opacity-50">
            Secondary
          </p>
          <Button variant="secondary" href={EXTERNAL_URLS.docs}>
            View The Docs
          </Button>
        </div>
        <div className="flex flex-col items-start gap-[12px]">
          <p className="font-mono text-[10px] leading-[1.3] font-medium text-brand-dark-green uppercase opacity-50">
            Tertiary
          </p>
          <Button variant="tertiary" href={EXTERNAL_URLS.docs}>
            View The Docs
          </Button>
        </div>
        <div className="flex flex-col items-start gap-[12px]">
          <p className="font-mono text-[10px] leading-[1.3] font-medium text-brand-dark-green uppercase opacity-50">
            Link
          </p>
          <Button variant="link" href={EXTERNAL_URLS.docs}>
            View The Docs
          </Button>
        </div>
      </div>
    </div>
  )
}

// --- Table --------------------------------------------------------------

const createTableRows = (placeholderTitle: string) =>
  [
    { number: '01', title: 'Secure and Decentralised Frontends' },
    { number: '02', title: 'Build a DEX' },
    { number: '03', title: 'Integrate Logos blockchain into Fileverse' },
    { number: '02', title: placeholderTitle },
    { number: '03', title: 'Secure and Decentralised Frontends' },
    { number: '02', title: 'Build a DEX' },
    { number: '03', title: 'Integrate Logos blockchain into Fileverse' },
  ] as const

export async function Tables() {
  const t = await getTranslations('designSystems.components')
  const tableRows = createTableRows(t('table.placeholderTitle'))
  const description = (
    <>
      <p>Quadratic voting platform for DAO members</p>
      <p>Idea by @jonny</p>
    </>
  )
  const reward = (
    <>
      <p>2500 USDC</p>
      <p>+ 1000 XP</p>
    </>
  )

  return (
    <div className="flex w-full flex-col gap-[32px] bg-white p-[20px]">
      <h2 className="font-display text-[64px] leading-[1] tracking-[-0.03em] text-brand-dark-green">
        Table
      </h2>
      <Table
        title="Ideas"
        subtitle="Ideas from our community driving sovereignty forward."
        action={
          <Button variant="link" href={ROUTES.ideas}>
            See all ideas
          </Button>
        }
      >
        {tableRows.map((row, i) => (
          <TableRow
            key={i}
            number={row.number}
            title={row.title}
            description={description}
            reward={reward}
            action={
              <Button variant="link" href={ROUTES.rfps}>
                Apply
              </Button>
            }
          />
        ))}
      </Table>
    </div>
  )
}

// --- Giant Switch -------------------------------------------------------

function TagIcon({ src, alt }: { src: string; alt: string }) {
  // SVGs are rendered as native <img> so their fill uses whatever Figma authored.
  return <img src={src} alt={alt} width={14} height={14} />
}

export async function GiantSwitches() {
  const t = await getTranslations('designSystems.components')
  const installTags = (
    <>
      <GiantSwitchTag
        icon={<TagIcon src="/design-systems/wallet.svg" alt="" />}
      >
        Wallet
      </GiantSwitchTag>
      <GiantSwitchTag icon={<TagIcon src="/design-systems/chat.svg" alt="" />}>
        Chat Interface
      </GiantSwitchTag>
      <GiantSwitchTag icon={<TagIcon src="/design-systems/file.svg" alt="" />}>
        Filesharing Tool
      </GiantSwitchTag>
      <GiantSwitchTag icon={<TagIcon src="/design-systems/globe.svg" alt="" />}>
        Explorer
      </GiantSwitchTag>
    </>
  )

  const heroImage = (
    <Image
      src="/design-systems/giant-switch-hero.jpg"
      alt=""
      fill
      sizes="(max-width: 768px) 100vw, 600px"
    />
  )

  return (
    <div className="flex w-full flex-col gap-[32px] bg-white py-[20px]">
      <h2 className="px-[20px] font-display text-[64px] leading-[1] tracking-[-0.03em] text-brand-dark-green">
        Giant Switch
      </h2>

      <GiantSwitch
        accent="grey"
        imagePosition="left"
        image={heroImage}
        title="Install the Logos app."
        description="The Logos App is a a complete distribution that bundles the kernel, the default modules, and UI packages into a usable product. It provides the primary user interface, hosting “Simple Apps” that let users interact with the various modules:"
        tags={installTags}
        actions={
          <>
            <Button variant="secondary" href={ROUTES.buildersHub}>
              Install
            </Button>
            <Button variant="tertiary" href={ROUTES.technologyStack}>
              Learn more
            </Button>
          </>
        }
      />

      <GiantSwitch
        accent="yellow"
        imagePosition="right"
        image={heroImage}
        title="Download started!"
        description={t('giantSwitch.downloadDescription')}
        actions={
          <>
            <Button variant="secondary" href={ROUTES.buildersHub}>
              Download again
            </Button>
            <Button variant="tertiary" href={ROUTES.technologyStack}>
              Learn more
            </Button>
          </>
        }
      />
    </div>
  )
}

// --- View Toggle --------------------------------------------------------

export function ViewToggles() {
  const options = [
    { id: 'grid', label: 'Grid' },
    { id: 'list', label: 'List' },
  ] as const

  return (
    <div className="flex w-full flex-col gap-8 bg-white p-5">
      <h2 className="font-display text-[64px] leading-none tracking-[-0.03em] text-brand-dark-green">
        View Toggle
      </h2>
      <div className="grid grid-cols-1 items-start gap-8 sm:grid-cols-2">
        <div className="flex flex-col items-start gap-3">
          <p className="font-mono text-[10px] leading-[1.3] font-medium text-brand-dark-green uppercase opacity-50">
            Grid active (default on /rfps)
          </p>
          <ViewToggle
            options={[...options]}
            view="grid"
            getHref={(id) => `#view=${id}`}
          />
        </div>
        <div className="flex flex-col items-start gap-3">
          <p className="font-mono text-[10px] leading-[1.3] font-medium text-brand-dark-green uppercase opacity-50">
            List active (default on /ideas)
          </p>
          <ViewToggle
            options={[...options]}
            view="list"
            getHref={(id) => `#view=${id}`}
          />
        </div>
      </div>
    </div>
  )
}

// --- Pagination ---------------------------------------------------------

export function Paginations() {
  return (
    <div className="flex w-full flex-col gap-8 bg-white p-5">
      <h2 className="font-display text-[64px] leading-none tracking-[-0.03em] text-brand-dark-green">
        Pagination
      </h2>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-start gap-3">
          <p className="font-mono text-[10px] leading-[1.3] font-medium text-brand-dark-green uppercase opacity-50">
            3 pages · current 1
          </p>
          <Pagination
            currentPage={1}
            totalPages={3}
            getHref={(p) => `#page=${p}`}
          />
        </div>
        <div className="flex flex-col items-start gap-3">
          <p className="font-mono text-[10px] leading-[1.3] font-medium text-brand-dark-green uppercase opacity-50">
            5 pages · current 3
          </p>
          <Pagination
            currentPage={3}
            totalPages={5}
            getHref={(p) => `#page=${p}`}
          />
        </div>
        <div className="flex flex-col items-start gap-3">
          <p className="font-mono text-[10px] leading-[1.3] font-medium text-brand-dark-green uppercase opacity-50">
            10 pages · current 5 · ellipsis collapse
          </p>
          <Pagination
            currentPage={5}
            totalPages={10}
            getHref={(p) => `#page=${p}`}
          />
        </div>
      </div>
    </div>
  )
}

// --- Footer -------------------------------------------------------------

function LogosLockup() {
  return (
    <span className="inline-flex items-center gap-2 text-brand-off-white">
      <LogosMark size={15} className="shrink-0" />
      <span className="font-display text-[18px] leading-none">Logos</span>
    </span>
  )
}

export function Footers() {
  const mainLinks = [
    { label: 'Work With Us', href: EXTERNAL_URLS.iftJobs, external: true },
    { label: 'Brand Guidelines', href: ROUTES.brandKit },
  ]
  const socialLinks = [
    { label: 'Twitter', href: EXTERNAL_URLS.twitter },
    { label: 'Discord', href: EXTERNAL_URLS.discord },
    { label: 'YouTube', href: EXTERNAL_URLS.youtube },
    { label: 'Blog', href: ROUTES.blog },
    { label: 'Github', href: EXTERNAL_URLS.github },
  ]
  const researchLinks = [{ label: 'VacP2P', href: EXTERNAL_URLS.vacp2p }]
  const infrastructureLinks = [
    { label: 'Waku', href: EXTERNAL_URLS.waku },
    { label: 'Nimbus', href: EXTERNAL_URLS.nimbus },
    { label: 'Codex', href: EXTERNAL_URLS.codex },
    { label: 'Nomos', href: EXTERNAL_URLS.nomos },
  ]
  const legalLinks = [
    { label: 'Terms & Conditions', href: ROUTES.terms },
    { label: 'Privacy Policy', href: ROUTES.privacy },
    { label: 'Security', href: ROUTES.security },
  ]

  return (
    <div className="flex w-full flex-col gap-8 bg-white p-5">
      <h2 className="font-display text-[64px] leading-none tracking-[-0.03em] text-brand-dark-green">
        Footer
      </h2>
      <Footer
        image={
          <Image
            src="/temp/footer-image.png"
            alt=""
            fill
            sizes="(max-width: 768px) 83px, 226px"
          />
        }
        logo={<LogosLockup />}
        newsletter={{
          title: 'Stay ahead with the latest updates.',
          emailLabel: 'Enter email',
          roleLabel: 'Role',
          cityLabel: 'city',
          submitLabel: 'Submit',
        }}
        tagline="Pioneering a new era of freedom."
        mainLinks={mainLinks}
        socialLinks={socialLinks}
        researchLinks={researchLinks}
        infrastructureLinks={infrastructureLinks}
        legalLinks={legalLinks}
        builtBy={{
          label: 'Built by',
          attribution: 'IFT',
          href: EXTERNAL_URLS.ift,
        }}
      />
    </div>
  )
}
