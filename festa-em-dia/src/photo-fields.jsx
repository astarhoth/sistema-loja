import React, { useEffect, useState } from 'react'
import { readPhoto } from './photos.js'
import { Icon } from './ui.jsx'

export function Photo({ id, file, icon = 'box', label = '', className = '' }) {
  const [source, setSource] = useState(null)
  const key = file || id
  useEffect(() => {
    let active = true
    let url
    if (key) {
      const load = file ? Promise.resolve(file) : readPhoto(id)
      load.then((blob) => {
        if (!active || !blob) return
        url = URL.createObjectURL(blob)
        setSource({ key, url })
      }).catch(() => {})
    }
    return () => { active = false; if (url) URL.revokeObjectURL(url) }
  }, [key, file, id])

  return <span className={['record-photo', className].join(' ')}>
    {source?.key === key && source?.url ? <img src={source.url} alt={label} /> : <Icon name={icon} size={21} />}
  </span>
}

export function PhotoField({ record, icon }) {
  const [file, setFile] = useState(null)
  const [remove, setRemove] = useState(false)
  return <div className="photo-field span-two">
    <Photo id={remove ? '' : record?.photoId} file={file} icon={icon} label="Prévia da foto" />
    <div>
      <label>Foto<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
        setFile(event.target.files[0] ?? null)
        setRemove(false)
      }} /></label>
      {record?.photoId && !file && <label className="checkbox-label"><input name="removePhoto" type="checkbox" checked={remove} onChange={(event) => setRemove(event.target.checked)} /> Remover foto atual</label>}
    </div>
  </div>
}
