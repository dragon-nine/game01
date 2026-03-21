import { useEffect } from 'react'

interface Props {
  type: 'success' | 'error'
  message: string
  onDismiss: () => void
}

export default function Banner({ type, message, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div className={`banner ${type}`} onClick={onDismiss}>
      {type === 'success' ? '\u2713' : '\u2717'} {message}
    </div>
  )
}
