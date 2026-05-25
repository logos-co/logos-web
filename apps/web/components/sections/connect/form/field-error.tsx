'use client'

import { AnimatePresence, motion } from 'motion/react'

type Props = {
  visible: boolean
  children: React.ReactNode
}

export function FieldError({ visible, children }: Props) {
  return (
    <AnimatePresence>
      {visible && children ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-2 font-mono text-[10px] leading-[1.3] font-semibold text-red-600"
        >
          {children}
        </motion.p>
      ) : null}
    </AnimatePresence>
  )
}
