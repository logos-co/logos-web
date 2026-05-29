import { createElement, type ComponentProps } from 'react'
import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

// Lightweight wrappers around Next.js' navigation
// APIs that consider the routing configuration
const navigation = createNavigation(routing)

type LinkProps = ComponentProps<typeof navigation.Link>

export function Link(props: LinkProps) {
  return createElement(navigation.Link, { ...props, prefetch: false })
}

export const { redirect, usePathname, useRouter, getPathname } = navigation
