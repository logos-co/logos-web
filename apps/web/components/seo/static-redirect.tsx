interface StaticRedirectProps {
  target: string
}

export function StaticRedirect({ target }: StaticRedirectProps) {
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${target}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.replace(${JSON.stringify(target)})`,
        }}
      />
    </>
  )
}
