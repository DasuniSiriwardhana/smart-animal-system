// components/ui/3d-card.tsx
"use client"

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion"
import { ReactNode } from "react"

interface Card3DProps {
  children: ReactNode
  className?: string
  glare?: boolean
}

export function Card3D({ children, className = "", glare = false }: Card3DProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x)
  const mouseYSpring = useSpring(y)

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`relative ${className}`}
    >
      <div
        style={{
          transform: "translateZ(50px)",
          transformStyle: "preserve-3d",
        }}
        className="relative z-10"
      >
        {children}
      </div>
      {glare && (
        <motion.div
          className="absolute inset-0 z-20 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.8), transparent 70%)",
            mixBlendMode: "overlay",
          }}
        />
      )}
    </motion.div>
  )
}

export function FloatingElement({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      animate={{
        y: [0, -20, 0],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  )
}

export function GlowingOrb({ color = "primary", size = "lg" }: { color?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-32 h-32",
    md: "w-64 h-64",
    lg: "w-96 h-96"
  }

  const colorClasses = {
    primary: "bg-gradient-to-r from-blue-600/30 to-purple-600/30",
    secondary: "bg-gradient-to-r from-green-600/30 to-teal-600/30",
    accent: "bg-gradient-to-r from-orange-600/30 to-red-600/30"
  }

  return (
    <motion.div
      className={`absolute rounded-full blur-3xl ${sizeClasses[size]} ${colorClasses[color as keyof typeof colorClasses] || colorClasses.primary}`}
      animate={{
        scale: [1, 1.2, 1],
        x: [0, 50, 0],
        y: [0, -50, 0],
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  )
}



