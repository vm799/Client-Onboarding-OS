'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConfettiPiece {
  id: number
  x: number
  color: string
  delay: number
  rotation: number
}

export function Confetti({ trigger }: { trigger: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    if (trigger) {
      const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
        '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
      ]

      const newPieces: ConfettiPiece[] = []
      for (let i = 0; i < 50; i++) {
        newPieces.push({
          id: i,
          x: Math.random() * 100,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 0.5,
          rotation: Math.random() * 360,
        })
      }
      setPieces(newPieces)

      const timeout = setTimeout(() => {
        setPieces([])
      }, 3000)

      return () => clearTimeout(timeout)
    }
  }, [trigger])

  return (
    <AnimatePresence>
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{
            opacity: 1,
            x: `${piece.x}vw`,
            y: -20,
            rotate: 0,
            scale: 1,
          }}
          animate={{
            opacity: 0,
            y: '100vh',
            rotate: piece.rotation + 720,
            scale: 0.5,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 2.5,
            delay: piece.delay,
            ease: 'easeOut',
          }}
          className="fixed top-0 pointer-events-none z-[100]"
          style={{
            width: '10px',
            height: '10px',
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </AnimatePresence>
  )
}

export function useConfetti() {
  const [show, setShow] = useState(false)

  const trigger = () => {
    setShow(true)
    setTimeout(() => setShow(false), 100)
  }

  return { show, trigger }
}
