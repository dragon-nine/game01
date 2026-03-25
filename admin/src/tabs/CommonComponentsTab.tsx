import { useState } from 'react'
import GameButton from '../components/common/GameButton'
import ChallengeModal from '../components/common/ChallengeModal'
import MainTitle from '../components/common/MainTitle'

export default function CommonComponentsTab() {
  // GameButton state
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

  // MainTitle state
  const [titleLine1, setTitleLine1] = useState('직장인 잔혹사')
  const [titleLine2, setTitleLine2] = useState('당신의 하루를 견뎌내세요...')
  const [titleLine1Size, setTitleLine1Size] = useState(52)
  const [titleLine2Size, setTitleLine2Size] = useState(22)
  const [titleGradFrom, setTitleGradFrom] = useState('#1a6fc4')
  const [titleGradTo, setTitleGradTo] = useState('#7ec8e3')
  const [titleStrokeW, setTitleStrokeW] = useState(6)
  const [titleStrokeColor, setTitleStrokeColor] = useState('#000000')
  const [titleLine2Color, setTitleLine2Color] = useState('#ffffff')

  // ChallengeModal state
  const [modalScore, setModalScore] = useState(1000)
  const [modalImage, setModalImage] = useState('')
  const [modalMessage, setModalMessage] = useState('퇴근 직전 1000에서 \'잠깐만\' 당했다.\n분하면 도전해봐')
  const [modalCTA, setModalCTA] = useState('카카오톡으로 도전장 보내기')
  const [modalRefresh, setModalRefresh] = useState('다른 멘트로 바꾸기')

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 600 }}>Common Components</h2>

      {/* ── MainTitle Section ── */}
      <section style={{ marginBottom: 48 }}>
        <h3 style={sectionTitle}>MainTitle (메인 타이틀)</h3>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 400px' }}>
            <div style={{
              background: 'linear-gradient(to bottom, #2a0c10, #000)',
              borderRadius: 12,
              padding: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 200,
            }}>
              <MainTitle
                line1={titleLine1}
                line2={titleLine2}
                line1Size={titleLine1Size}
                line2Size={titleLine2Size}
                gradientFrom={titleGradFrom}
                gradientTo={titleGradTo}
                strokeWidth={titleStrokeW}
                strokeColor={titleStrokeColor}
                line2Color={titleLine2Color}
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <span style={{ fontSize: 13, color: '#666' }}>Original (main-text.png)</span>
              <div style={{ background: 'linear-gradient(to bottom, #2a0c10, #000)', borderRadius: 12, padding: 24, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/game01/main-screen/main-text.png" alt="main-text original" style={{ maxWidth: '100%', height: 'auto' }} />
              </div>
            </div>
          </div>

          <div style={controlsBox}>
            <label style={labelStyle}>
              <span>Line 1 (타이틀)</span>
              <input type="text" value={titleLine1} onChange={(e) => setTitleLine1(e.target.value)} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              <span>Line 2 (서브타이틀)</span>
              <input type="text" value={titleLine2} onChange={(e) => setTitleLine2(e.target.value)} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              <span>Line 1 Size: {titleLine1Size}px</span>
              <input type="range" min={24} max={80} value={titleLine1Size} onChange={(e) => setTitleLine1Size(+e.target.value)} />
            </label>
            <label style={labelStyle}>
              <span>Line 2 Size: {titleLine2Size}px</span>
              <input type="range" min={12} max={40} value={titleLine2Size} onChange={(e) => setTitleLine2Size(+e.target.value)} />
            </label>
            <label style={labelStyle}>
              <span>Stroke Width: {titleStrokeW}px</span>
              <input type="range" min={0} max={12} value={titleStrokeW} onChange={(e) => setTitleStrokeW(+e.target.value)} />
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <label style={{ ...labelStyle, flex: 1 }}><span>Grad From</span><input type="color" value={titleGradFrom} onChange={(e) => setTitleGradFrom(e.target.value)} /></label>
              <label style={{ ...labelStyle, flex: 1 }}><span>Grad To</span><input type="color" value={titleGradTo} onChange={(e) => setTitleGradTo(e.target.value)} /></label>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <label style={{ ...labelStyle, flex: 1 }}><span>Stroke</span><input type="color" value={titleStrokeColor} onChange={(e) => setTitleStrokeColor(e.target.value)} /></label>
              <label style={{ ...labelStyle, flex: 1 }}><span>Line 2</span><input type="color" value={titleLine2Color} onChange={(e) => setTitleLine2Color(e.target.value)} /></label>
            </div>
          </div>
        </div>
      </section>

      {/* ── GameButton Section ── */}
      <section style={{ marginBottom: 48 }}>
        <h3 style={sectionTitle}>GameButton</h3>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 400px' }}>
            <div style={previewBox}>
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
            <div style={{ marginTop: 16 }}>
              <span style={{ fontSize: 13, color: '#666' }}>Original (btn-home.png)</span>
              <div style={{ ...previewBox, background: '#111', padding: 24, marginTop: 8 }}>
                <img
                  src="/game01/game-over-screen/btn-home.png"
                  alt="btn-home original"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </div>
            </div>
          </div>

          <div style={controlsBox}>
            <label style={labelStyle}>
              <span>Text</span>
              <input type="text" value={text} onChange={(e) => setText(e.target.value)} style={inputStyle} placeholder="버튼 텍스트" />
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
              <label style={{ ...labelStyle, flex: 1 }}><span>BG</span><input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} /></label>
              <label style={{ ...labelStyle, flex: 1 }}><span>Text</span><input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} /></label>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <label style={{ ...labelStyle, flex: 1 }}><span>Border</span><input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} /></label>
              <label style={{ ...labelStyle, flex: 1 }}><span>Stroke</span><input type="color" value={textStrokeColor} onChange={(e) => setTextStrokeColor(e.target.value)} /></label>
            </div>
          </div>
        </div>
      </section>

      {/* ── ChallengeModal Section ── */}
      <section>
        <h3 style={sectionTitle}>ChallengeModal (도전장 보내기)</h3>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          {/* Modal preview */}
          <div style={{ flex: '1 1 400px' }}>
            <div style={{
              background: 'rgba(0,0,0,0.7)',
              borderRadius: 12,
              padding: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 500,
            }}>
              <ChallengeModal
                score={modalScore}
                imageSrc={modalImage || undefined}
                message={modalMessage}
                ctaText={modalCTA}
                refreshText={modalRefresh}
                onClose={() => alert('닫기')}
                onRefresh={() => alert('멘트 변경')}
                onCTA={() => alert('도전장 보내기')}
              />
            </div>

            {/* Original screenshot */}
            <div style={{ marginTop: 16 }}>
              <span style={{ fontSize: 13, color: '#666' }}>Original (스크린샷)</span>
              <div style={{ ...previewBox, background: '#111', padding: 24, marginTop: 8 }}>
                <img
                  src="https://pub-a6e8e0aec44d4a69ae3ed4e096c5acc5.r2.dev/shared/%EC%8A%A4%ED%81%AC%EB%A6%B0%EC%83%B7%202026-03-25%20%EC%98%A4%ED%9B%84%207.58.30.png"
                  alt="challenge modal original"
                  style={{ maxWidth: 340, height: 'auto' }}
                />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={controlsBox}>
            <label style={labelStyle}>
              <span>Score</span>
              <input type="text" value={modalScore} onChange={(e) => setModalScore(Number(e.target.value) || 0)} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              <span>Image URL (비워두면 이미지 없음)</span>
              <input type="text" value={modalImage} onChange={(e) => setModalImage(e.target.value)} style={inputStyle} placeholder="https://..." />
            </label>
            <label style={labelStyle}>
              <span>Message</span>
              <textarea
                value={modalMessage}
                onChange={(e) => setModalMessage(e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </label>
            <label style={labelStyle}>
              <span>CTA Button Text</span>
              <input type="text" value={modalCTA} onChange={(e) => setModalCTA(e.target.value)} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              <span>Refresh Button Text</span>
              <input type="text" value={modalRefresh} onChange={(e) => setModalRefresh(e.target.value)} style={inputStyle} />
            </label>
          </div>
        </div>
      </section>
    </div>
  )
}

const sectionTitle: React.CSSProperties = {
  marginBottom: 16,
  fontSize: 17,
  fontWeight: 600,
  color: '#aaa',
  borderBottom: '1px solid #333',
  paddingBottom: 8,
}

const previewBox: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 12,
  padding: 48,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 200,
}

const controlsBox: React.CSSProperties = {
  flex: '0 0 280px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
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
