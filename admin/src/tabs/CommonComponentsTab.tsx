import { useState } from 'react'
import GameButton from '../components/common/GameButton'

export default function CommonComponentsTab() {
  const [text, setText] = useState('홈으로 가기')
  const [fontSize, setFontSize] = useState(32)
  const [fontWeight, setFontWeight] = useState(900)
  const [borderRadius, setBorderRadius] = useState(16)
  const [borderWidth, setBorderWidth] = useState(3)
  const [borderColor, setBorderColor] = useState('#1a1a1a')
  const [bgColor, setBgColor] = useState('#2d2d2d')
  const [textColor, setTextColor] = useState('#ffffff')
  const [textStroke, setTextStroke] = useState(2)
  const [textStrokeColor, setTextStrokeColor] = useState('#000000')
  const [paddingX, setPaddingX] = useState(48)
  const [paddingY, setPaddingY] = useState(16)

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 600 }}>Common Components</h2>

      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        {/* Preview */}
        <div style={{ flex: '1 1 400px' }}>
          <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600, color: '#888' }}>GameButton Preview</h3>
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 200,
          }}>
            <GameButton
              fontSize={fontSize}
              fontWeight={fontWeight}
              borderRadius={borderRadius}
              borderWidth={borderWidth}
              borderColor={borderColor}
              bgColor={bgColor}
              textColor={textColor}
              textStroke={textStroke}
              textStrokeColor={textStrokeColor}
              paddingX={paddingX}
              paddingY={paddingY}
            >
              {text || '텍스트를 입력하세요'}
            </GameButton>
          </div>

          {/* Original image for comparison */}
          <div style={{ marginTop: 16 }}>
            <h3 style={{ marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#888' }}>Original (btn-home.png)</h3>
            <div style={{
              background: '#111',
              borderRadius: 12,
              padding: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img
                src="/game01/game-over-screen/btn-home.png"
                alt="btn-home original"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#888' }}>Settings</h3>

          <label style={labelStyle}>
            <span>Text</span>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={inputStyle}
              placeholder="버튼 텍스트"
            />
          </label>

          <label style={labelStyle}>
            <span>Font Size: {fontSize}px</span>
            <input type="range" min={12} max={64} value={fontSize} onChange={(e) => setFontSize(+e.target.value)} />
          </label>

          <label style={labelStyle}>
            <span>Font Weight: {fontWeight}</span>
            <input type="range" min={100} max={900} step={100} value={fontWeight} onChange={(e) => setFontWeight(+e.target.value)} />
          </label>

          <label style={labelStyle}>
            <span>Text Stroke: {textStroke}px</span>
            <input type="range" min={0} max={6} step={0.5} value={textStroke} onChange={(e) => setTextStroke(+e.target.value)} />
          </label>

          <label style={labelStyle}>
            <span>Border Radius: {borderRadius}px</span>
            <input type="range" min={0} max={40} value={borderRadius} onChange={(e) => setBorderRadius(+e.target.value)} />
          </label>

          <label style={labelStyle}>
            <span>Border Width: {borderWidth}px</span>
            <input type="range" min={0} max={10} value={borderWidth} onChange={(e) => setBorderWidth(+e.target.value)} />
          </label>

          <label style={labelStyle}>
            <span>Padding X: {paddingX}px</span>
            <input type="range" min={8} max={80} value={paddingX} onChange={(e) => setPaddingX(+e.target.value)} />
          </label>

          <label style={labelStyle}>
            <span>Padding Y: {paddingY}px</span>
            <input type="range" min={4} max={40} value={paddingY} onChange={(e) => setPaddingY(+e.target.value)} />
          </label>

          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{ ...labelStyle, flex: 1 }}>
              <span>BG</span>
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
            </label>
            <label style={{ ...labelStyle, flex: 1 }}>
              <span>Text</span>
              <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
            </label>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{ ...labelStyle, flex: 1 }}>
              <span>Border</span>
              <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} />
            </label>
            <label style={{ ...labelStyle, flex: 1 }}>
              <span>Stroke</span>
              <input type="color" value={textStrokeColor} onChange={(e) => setTextStrokeColor(e.target.value)} />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 13,
  color: '#ccc',
}

const inputStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid #444',
  background: '#1a1a1a',
  color: '#fff',
  fontSize: 14,
}
