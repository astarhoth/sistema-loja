import React, { useEffect, useRef } from 'react'
import { statuses } from './data.js'

const paths = {
  sparkle: 'M12 2 14.7 9.3 22 12l-7.3 2.7L12 22l-2.7-7.3L2 12l7.3-2.7L12 2Z',
  home: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  clipboard: 'M9 5H6a2 2 0 0 0-2 2v13h16V7a2 2 0 0 0-2-2h-3M9 3h6v4H9zM8 12h8m-8 4h6',
  calendar: 'M3 5h18v16H3zM3 10h18M8 3v4m8-4v4M8 14h2m4 0h2m-8 3h2',
  box: 'm12 3 9 5v8l-9 5-9-5V8l9-5Zm0 9v9M3 8l9 4 9-4m-13-3 9 5',
  users: 'M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-4M12 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm5-3a3.5 3.5 0 0 1 0 7',
  wallet: 'M20 9V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v13h17v-4m1-6h-6a3 3 0 0 0 0 6h6V9Zm-6 3h.01',
  plus: 'M12 5v14M5 12h14',
  search: 'm21 21-4.6-4.6M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z',
  left: 'm15 18-6-6 6-6',
  right: 'm9 18 6-6-6-6',
  down: 'm6 9 6 6 6-6',
  close: 'm6 6 12 12M6 18 18 6',
  clock: 'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  package: 'M3 8h18v13H3zM2 3h20v5H2zM9 12h6',
  check: 'm5 12 4 4L19 6',
  menu: 'M4 6h16M4 12h16M4 18h16',
  print: 'M6 8V3h12v5M6 17H3V8h18v9h-3M6 14h12v7H6zm11-3h1',
  trash: 'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15m-8 4v7m4-7v7',
  truck: 'M2 5h13v12H2zM15 9h4l3 4v4h-7M8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm12 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
  file: 'M5 3h10l4 4v14H5zM14 3v5h5M8 12h8m-8 4h8',
  download: 'M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5',
  building: 'M4 21V8h7V3h9v18H4Zm7-13v13m4-14h1m-1 4h1m-1 4h1m-9-3h1m-1 4h1',
  message: 'M21 4H3v13h4v4l5-4h9V4ZM7 9h10m-10 4h7',
  edit: 'm14 5 5 5M4 20l5-1L21 7l-4-4L5 15l-1 5Z',
  filter: 'M3 6h18M6 12h12m-9 6h6',
  info: 'M12 11v5m0-8h.01m9 4a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
}

export function Icon({ name, size = 20, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name]} /></svg>
}

export function Badge({ status }) {
  const { label, color } = statuses[status]
  return <span className={'badge ' + color}><i />{label}</span>
}

export function Empty({ title, description, icon = 'box' }) {
  return <div className="empty"><span className="icon-tile purple"><Icon name={icon} /></span><strong>{title}</strong>{description && <span>{description}</span>}</div>
}

export function Dialog({ title, onClose, children, wide = false, className = '' }) {
  const dialog = useRef(null)
  useEffect(() => {
    const element = dialog.current
    element.showModal()
    return () => element.close()
  }, [])
  return (
    <dialog ref={dialog} className={['dialog', wide && 'wide', className].filter(Boolean).join(' ')} aria-labelledby="dialog-title" onCancel={(event) => { event.preventDefault(); onClose() }}>
      <header className="dialog-header">
        <h2 id="dialog-title">{title}</h2>
        <button className="icon-button" type="button" aria-label="Fechar" onClick={onClose}><Icon name="close" /></button>
      </header>
      {children}
    </dialog>
  )
}

export function Search({ value, onChange, placeholder }) {
  return <label className="search"><Icon name="search" size={18} /><input type="search" aria-label={placeholder} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} /></label>
}

export function Stat({ icon, color, label, value, detail, href }) {
  const Element = href ? 'a' : 'article'
  return (
    <Element className={'stat card' + (href ? ' stat-link' : '')} href={href}>
      <span className={'icon-tile ' + color}><Icon name={icon} size={21} /></span>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{detail}</small>
    </Element>
  )
}
