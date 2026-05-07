/**
 * Conventional Tailwind className composer.
 *
 * Pipes `clsx` (conditional / falsy-aware joining) into `tailwind-merge`
 * (resolves Tailwind class conflicts deterministically), so callers don't have
 * to worry about precedence when overriding utility classes:
 *
 *   cn('p-4 text-sm', condition && 'text-base', userClassName)
 *
 * Prefer this over template-literal interpolation everywhere a component
 * accepts an external `className` prop or composes utility classes.
 */
import clsx, { type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
