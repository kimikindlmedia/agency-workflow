import React from 'react'

const STATUS_CONFIG = {
  new:         { label: 'Nové',       classes: 'bg-gray-100 text-gray-700 border-gray-200' },
  in_progress: { label: 'Probíhá',    classes: 'bg-blue-100 text-blue-700 border-blue-200' },
  review:      { label: 'Ke kontrole', classes: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  done:        { label: 'Hotovo',     classes: 'bg-green-100 text-green-700 border-green-200' },
  pending:     { label: 'Čeká',       classes: 'bg-orange-100 text-orange-700 border-orange-200' },
  accepted:    { label: 'Přijato',    classes: 'bg-green-100 text-green-700 border-green-200' },
  rejected:    { label: 'Zamítnuto',  classes: 'bg-red-100 text-red-700 border-red-200' },
}

const CONTENT_TYPE_CONFIG = {
  carousel: { label: 'Carousel', classes: 'bg-purple-100 text-purple-700 border-purple-200' },
  reel:     { label: 'Reel',     classes: 'bg-pink-100 text-pink-700 border-pink-200' },
  story:    { label: 'Story',    classes: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  post:     { label: 'Post',     classes: 'bg-teal-100 text-teal-700 border-teal-200' },
  other:    { label: 'Jiné',     classes: 'bg-gray-100 text-gray-600 border-gray-200' },
  scenario: { label: 'Scénář',   classes: 'bg-amber-100 text-amber-700 border-amber-200' },
}

export function StatusBadge({ status, className = '' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.new
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classes} ${className}`}>
      {config.label}
    </span>
  )
}

export function ContentTypeBadge({ type, className = '' }) {
  const config = CONTENT_TYPE_CONFIG[type] || CONTENT_TYPE_CONFIG.other
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classes} ${className}`}>
      {config.label}
    </span>
  )
}

export function TagBadge({ tag, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-100 ${className}`}>
      #{tag}
    </span>
  )
}

export default function Badge({ variant = 'default', children, className = '' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700 border-gray-200',
    primary: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    danger:  'bg-red-100 text-red-700 border-red-200',
    info:    'bg-blue-100 text-blue-700 border-blue-200',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  )
}
