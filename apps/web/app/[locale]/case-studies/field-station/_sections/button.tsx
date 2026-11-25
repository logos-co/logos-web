import { Button as SiteButton, type ButtonProps } from '@/components/ui'

export function Button({
  className = '',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <SiteButton
      {...props}
      variant={variant}
      className={`field-case-button field-case-button-${variant} cursor-pointer ${className}`}
    />
  )
}
