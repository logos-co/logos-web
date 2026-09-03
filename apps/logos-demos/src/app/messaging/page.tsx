import { ChatRoom } from '@/components/chat-room'
import { findDemo } from '@/demos/registry'

const DEMO_HREF = '/messaging'

export default function Page() {
  const demo = findDemo(DEMO_HREF)
  if (!demo) throw new Error(`No demo registered for ${DEMO_HREF}`)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 md:py-16">
      <header className="flex flex-col gap-4">
        <p className="text-eyebrow text-gray-05">Demo · {demo.stack}</p>
        <h1 className="text-h3-sans max-w-[24ch] text-brand-dark-green">
          {demo.label}
        </h1>
        <p className="text-body-sans max-w-[62ch] text-gray-06">
          {demo.summary}
        </p>
      </header>

      <ChatRoom />

      <footer className="flex flex-col gap-2 border-t border-gray-01 pt-6">
        <p className="text-caption-sans text-gray-05">
          Open this page in a second tab, or send the link to someone else, and
          watch messages cross the network between them. A tab that joins later
          asks store nodes for the recent backlog, so it does not start empty.
        </p>
        <p className="text-caption-sans text-gray-05">
          This is a public topic on a public fleet — anyone running the same
          demo can read it, and no one, including us, can delete what has been
          published. Encrypted rooms are the next step, not a missing one.
        </p>
      </footer>
    </div>
  )
}
