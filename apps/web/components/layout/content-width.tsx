export default function ContentWidth({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <div id={id} className={`mx-auto p-3 max-w-[1440px] ${className}`}>
      {children}
    </div>
  )
}
