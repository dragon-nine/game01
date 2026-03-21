interface Props {
  width: number
  height: number
  format: string
  maxSize?: number
  className?: string
}

export default function SpecBadge({ width, height, format, maxSize, className }: Props) {
  const sizeText = maxSize
    ? maxSize >= 1024 * 1024
      ? `${(maxSize / (1024 * 1024)).toFixed(0)}MB`
      : `${(maxSize / 1024).toFixed(0)}KB`
    : null

  return (
    <span className={`spec-badge ${className || ''}`}>
      {width}x{height} {format}
      {sizeText && ` / max ${sizeText}`}
    </span>
  )
}
