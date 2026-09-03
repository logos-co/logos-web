import { ChatRoom } from '@/components/chat-room'

export default function Page() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-5 py-12 md:py-16">
      <header className="flex flex-col gap-4">
        <p className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.18em] text-[var(--color-gray-05)]">
          Logos stack · web demo
        </p>
        <h1 className="max-w-[20ch] font-[family-name:var(--font-display)] text-4xl leading-[1.1] md:text-5xl">
          This page has no backend.
        </h1>
        <p className="max-w-[60ch] text-[17px] leading-relaxed text-[var(--color-gray-06)]">
          Opening it turns your browser into a node on Waku, the peer-to-peer
          messaging network behind Logos. Messages travel between browsers over
          that network. Nothing is stored on, or routed through, a server we
          operate.
        </p>
      </header>

      <ChatRoom />

      <footer className="flex flex-col gap-2 border-t border-[var(--color-gray-01)] pt-6 text-[13px] leading-relaxed text-[var(--color-gray-05)]">
        <p>
          Open this page in a second tab, or send the link to someone else, and
          watch messages cross the network between them.
        </p>
        <p>
          This is a public topic on a public fleet — anyone running the same
          demo can read it. Encrypted rooms are the next step, not a missing
          one.
        </p>
      </footer>
    </main>
  )
}
