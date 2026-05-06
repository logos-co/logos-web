/**
 * Component showcase sections for the `/design-systems` page —
 * Cards, Buttons, Tables, Giant Switches, View Toggles, Paginations, Footers.
 * Each render block mirrors a Figma frame and exists only for visual review.
 */
import Image from 'next/image'

import {
  CardInfo,
  Footer,
  GiantSwitch,
  GiantSwitchTag,
  LogosMark,
  Pagination,
  Table,
  TableRow,
  ViewToggle,
} from '@repo/ui'
import { Button, Card } from '@/components/ui'

const cardImages = {
  storage: '/design-systems/storage.png',
  messaging: '/design-systems/messaging.png',
  blockchain: '/design-systems/blockchain.png',
  userModules: '/design-systems/user-modules.png',
  networking: '/design-systems/networking.png',
  kernel: '/design-systems/kernel.png',
} as const

function Thumb({ src, alt }: { src: string; alt: string }) {
  return <Image src={src} alt={alt} width={46} height={57} />
}

// --- Cards --------------------------------------------------------------

function CardGrid({ state }: { state: 'default' | 'hover' }) {
  const isHover = state === 'hover'
  const networkingTitle = (
    <>
      <span className="block">The Networking Stack:</span>
      <span className="block">Discovery, Peering, and Mix-Net</span>
    </>
  )

  return (
    <div className="flex flex-col gap-[12px]">
      {/* Row 1: four small cards */}
      <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2 lg:grid-cols-4">
        <Card
          height={366}
          forceHover={isHover}
          staticDefault={!isHover}
          image={isHover && <Thumb src={cardImages.storage} alt="" />}
          title="Storage"
          description={
            isHover
              ? 'Decentralized file storage and retrieval, using content-addressed (CID-based) data'
              : undefined
          }
          ctaHref={isHover ? '#' : undefined}
        />
        <Card
          height={366}
          forceHover={isHover}
          staticDefault={!isHover}
          image={isHover && <Thumb src={cardImages.messaging} alt="" />}
          title="Messaging"
          description={
            isHover
              ? 'Private, censorship-resistant communication between parties.'
              : undefined
          }
          ctaHref={isHover ? '#' : undefined}
        />
        <Card
          height={366}
          forceHover={isHover}
          staticDefault={!isHover}
          image={isHover && <Thumb src={cardImages.blockchain} alt="" />}
          title="Blockchain"
          description={
            isHover ? 'Decentralized compute and consensus.' : undefined
          }
          ctaHref={isHover ? '#' : undefined}
        >
          {isHover && (
            <>
              <CardInfo
                height={78}
                label="Logos Execution Zone (LEZ)"
                description="Developers can deploy programs, run AMMs, transfer tokens, and build financial primitives with built-in privacy."
              />
              <CardInfo
                height={78}
                label="Data Availability and Consensus: Cryptarchia"
                description="A private proof-of-stake consensus mechanism where validator identities and stake amounts remain hidden."
              />
            </>
          )}
        </Card>
        <Card
          height={366}
          forceHover={isHover}
          staticDefault={!isHover}
          image={isHover && <Thumb src={cardImages.userModules} alt="" />}
          title="User Modules"
          description={
            isHover
              ? 'Anyone can build modules that plug into the same IPC infrastructure.'
              : undefined
          }
          ctaHref={isHover ? '#' : undefined}
        />
      </div>

      {/* Row 2: wide band — Networking Stack (no Lambda icon glyph in Figma) */}
      <Card
        height={196}
        forceHover={isHover}
        staticDefault={!isHover}
        showIcon={false}
        image={isHover && <Thumb src={cardImages.networking} alt="" />}
        title={networkingTitle}
        description={
          isHover
            ? 'This layer handles how Logos nodes find each other, establish connections, and communicate.'
            : undefined
        }
        ctaHref={isHover ? '#' : undefined}
      />

      {/* Row 3: wide band — Foundation Kernel (no Lambda icon glyph in Figma) */}
      <Card
        height={196}
        forceHover={isHover}
        staticDefault={!isHover}
        showIcon={false}
        image={isHover && <Thumb src={cardImages.kernel} alt="" />}
        title="The Foundation: Logos Kernel"
        description={
          isHover
            ? 'A microkernel that handles the essential primitives every decentralized application needs.'
            : undefined
        }
        ctaHref={isHover ? '#' : undefined}
      />
    </div>
  )
}

export function Cards() {
  return (
    <div className="flex w-full flex-col gap-[80px] bg-white p-[20px]">
      <div className="flex flex-col gap-[32px]">
        <h2 className="font-display text-[64px] leading-[1] tracking-[-0.03em] text-brand-dark-green">
          Default
        </h2>
        <CardGrid state="default" />
      </div>

      <div className="flex flex-col gap-[32px]">
        <h2 className="font-display text-[64px] leading-[1] tracking-[-0.03em] text-brand-dark-green">
          Hover
        </h2>
        <CardGrid state="hover" />
      </div>
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
          <Button variant="primary" href="#">
            View The Docs
          </Button>
        </div>
        <div className="flex flex-col items-start gap-[12px]">
          <p className="font-mono text-[10px] leading-[1.3] font-medium text-brand-dark-green uppercase opacity-50">
            Secondary
          </p>
          <Button variant="secondary" href="#">
            View The Docs
          </Button>
        </div>
        <div className="flex flex-col items-start gap-[12px]">
          <p className="font-mono text-[10px] leading-[1.3] font-medium text-brand-dark-green uppercase opacity-50">
            Tertiary
          </p>
          <Button variant="tertiary" href="#">
            View The Docs
          </Button>
        </div>
        <div className="flex flex-col items-start gap-[12px]">
          <p className="font-mono text-[10px] leading-[1.3] font-medium text-brand-dark-green uppercase opacity-50">
            Link
          </p>
          <Button variant="link" href="#">
            View The Docs
          </Button>
        </div>
      </div>
    </div>
  )
}

// --- Table --------------------------------------------------------------

const tableRows = [
  { number: '01', title: 'Secure and Decentralized Frontends' },
  { number: '02', title: 'Build a DEX' },
  { number: '03', title: 'Integrate Logos blockchain into Fileverse' },
  { number: '02', title: 'Lorem Ipsum Dolor Si Amet' },
  { number: '03', title: 'Secure and Decentralized Frontends' },
  { number: '02', title: 'Build a DEX' },
  { number: '03', title: 'Integrate Logos blockchain into Fileverse' },
] as const

export function Tables() {
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
          <Button variant="link" href="#">
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
              <Button variant="link" href="#">
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
  // SVGs are rendered as <img> so their fill uses whatever Figma authored.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} width={14} height={14} />
}

export function GiantSwitches() {
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
            <Button variant="secondary" href="#">
              Install
            </Button>
            <Button variant="tertiary" href="#">
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
        description="If you don’t immediately see lorem ipsum dolor si amet consectetur in your browser downloads, click Download Again below."
        actions={
          <>
            <Button variant="secondary" href="#">
              Download again
            </Button>
            <Button variant="tertiary" href="#">
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
    { label: 'Work With Us', href: '#' },
    { label: 'Brand Kit', href: '#' },
  ]
  const socialLinks = [
    { label: 'Twitter', href: '#' },
    { label: 'Discord', href: '#' },
    { label: 'YouTube', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Github', href: '#' },
  ]
  const researchLinks = [{ label: 'VacP2P', href: '#' }]
  const infrastructureLinks = [
    { label: 'Waku', href: '#' },
    { label: 'Nimbus', href: '#' },
    { label: 'Codex', href: '#' },
    { label: 'Nomos', href: '#' },
  ]
  const legalLinks = [
    { label: 'Terms & Conditions', href: '#' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Security', href: '#' },
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
        tagline="Pioneering a new era of freedom."
        mainLinks={mainLinks}
        socialLinks={socialLinks}
        researchLinks={researchLinks}
        infrastructureLinks={infrastructureLinks}
        legalLinks={legalLinks}
        builtBy={{ label: 'Built by', attribution: 'IFT', href: '#' }}
      />
    </div>
  )
}
