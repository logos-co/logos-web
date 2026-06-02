export function Video() {
  return (
    <section className="border-t border-brand-dark-green/10 px-3 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="relative aspect-video overflow-hidden rounded bg-brand-dark-green">
          <iframe
            src="https://www.youtube.com/embed/T0kNpazXeWU"
            title="Farewell to Westphalia video"
            className="absolute inset-0 size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  )
}
