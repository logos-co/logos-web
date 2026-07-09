import type { BlogTocItem } from '@/lib/blog-content'

interface ArticleSidebarProps {
  contentsLabel: string
  toc: BlogTocItem[]
}

export function ArticleSidebar({ contentsLabel, toc }: ArticleSidebarProps) {
  if (toc.length === 0) return null

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-20 flex max-h-[calc(100vh-96px)] flex-col gap-6 overflow-y-auto pb-12 text-brand-dark-green">
        <p className="px-3 font-mono text-[10px] font-medium uppercase leading-[1.3]">
          {contentsLabel}
        </p>
        <nav aria-label={contentsLabel} className="flex flex-col gap-2">
          {toc.map((item, index) => (
            <a
              key={`${item.href}-${index}`}
              href={index === 0 ? '#' : item.href}
              className="cursor-pointer px-3 py-1 font-sans text-[12px] font-medium leading-[1.2] transition-colors hover:bg-brand-dark-green/10"
            >
              {item.title}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  )
}
