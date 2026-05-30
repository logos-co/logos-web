export default function ContentWidth({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`mx-auto max-w-[1440px] ${className}`}>{children}</div>
  )
}
