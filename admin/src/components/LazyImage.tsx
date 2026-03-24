import { useState, useEffect, useRef } from 'react'

interface Props {
  src: string
  alt: string
  style?: React.CSSProperties
  className?: string
}

const MAX_RETRIES = 3
const RETRY_DELAY = 1000

export default function LazyImage({ src, alt, style, className }: Props) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const retryCount = useRef(0)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    setStatus('loading')
    retryCount.current = 0
  }, [src])

  const handleError = () => {
    if (retryCount.current < MAX_RETRIES) {
      retryCount.current++
      setTimeout(() => {
        if (imgRef.current) {
          imgRef.current.src = ''
          imgRef.current.src = src
        }
      }, RETRY_DELAY * retryCount.current)
    } else {
      setStatus('error')
    }
  }

  return (
    <>
      {status === 'loading' && (
        <div className="img-placeholder" style={style} />
      )}
      {status === 'error' && (
        <div className="img-error" style={style}>!</div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={className}
        style={{
          ...style,
          display: status === 'loaded' ? undefined : 'none',
        }}
        onLoad={() => setStatus('loaded')}
        onError={handleError}
      />
    </>
  )
}
