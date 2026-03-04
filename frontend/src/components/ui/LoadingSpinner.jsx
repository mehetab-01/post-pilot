import { useRef, useEffect } from 'react'
import gsap from 'gsap'

export function LoadingSpinner({ size = 24, color = '#8b5cf6', className = '' }) {
  const arcRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!arcRef.current || !containerRef.current) return

    // Rotate the whole container
    const rotTween = gsap.to(containerRef.current, {
      rotation: 360,
      duration: 1.0,
      repeat: -1,
      ease: 'none',
      transformOrigin: '50% 50%',
    })

    // Pulse the stroke opacity for a shimmer effect
    const pulseTween = gsap.to(arcRef.current, {
      opacity: 0.5,
      duration: 0.6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })

    return () => {
      rotTween.kill()
      pulseTween.kill()
    }
  }, [])

  const radius = (size - 4) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
    >
      <svg
        ref={containerRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeOpacity="0.15"
          strokeWidth="2"
        />
        {/* Arc */}
        <circle
          ref={arcRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.72}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
    </span>
  )
}
