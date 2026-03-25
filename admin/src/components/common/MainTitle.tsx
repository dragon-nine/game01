import type { CSSProperties } from 'react'

interface MainTitleProps {
  line1?: string
  line2?: string
  line1Size?: number
  line2Size?: number
  gradientFrom?: string
  gradientTo?: string
  strokeWidth?: number
  strokeColor?: string
  line2Color?: string
  style?: CSSProperties
}

export default function MainTitle({
  line1 = '직장인 잔혹사',
  line2 = '당신의 하루를 견뎌내세요...',
  line1Size = 52,
  line2Size = 22,
  gradientFrom = '#1a6fc4',
  gradientTo = '#7ec8e3',
  strokeWidth = 6,
  strokeColor = '#000000',
  line2Color = '#ffffff',
  style,
}: MainTitleProps) {
  return (
    <div style={{ textAlign: 'center', ...style }}>
      {/* Line 1: gradient text with stroke */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {/* Stroke layer (behind) */}
        <div
          style={{
            fontSize: line1Size,
            fontWeight: 900,
            fontFamily: '"Black Han Sans", "GMarketSans", sans-serif',
            lineHeight: 1.2,
            color: 'transparent',
            WebkitTextStroke: `${strokeWidth}px ${strokeColor}`,
            paintOrder: 'stroke fill',
            letterSpacing: '0.02em',
          }}
        >
          {line1}
        </div>
        {/* Gradient fill layer (on top) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            fontSize: line1Size,
            fontWeight: 900,
            fontFamily: '"Black Han Sans", "GMarketSans", sans-serif',
            lineHeight: 1.2,
            letterSpacing: '0.02em',
            background: `linear-gradient(to bottom, ${gradientFrom}, ${gradientTo})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {line1}
        </div>
      </div>

      {/* Line 2: white text with stroke */}
      <div
        style={{
          fontSize: line2Size,
          fontWeight: 700,
          fontStyle: 'italic',
          fontFamily: '"Black Han Sans", "GMarketSans", sans-serif',
          color: line2Color,
          WebkitTextStroke: `${Math.max(1, strokeWidth * 0.6)}px ${strokeColor}`,
          paintOrder: 'stroke fill',
          lineHeight: 1.3,
          marginTop: 4,
          letterSpacing: '0.01em',
        }}
      >
        {line2}
      </div>
    </div>
  )
}
