import { Button, type ButtonProps } from '@/components/ui'

export function ProgrammeButton(props: ButtonProps) {
  return (
    <Button
      {...props}
      data-programme-variant={props.variant ?? 'primary'}
      className={`programme-cta cursor-pointer ${props.className ?? ''}`}
    />
  )
}
