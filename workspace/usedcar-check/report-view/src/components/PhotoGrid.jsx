import { useState } from 'react'

// 照片缩略图网格；可删除（编辑模式）、点击查看大图
export default function PhotoGrid({ photos = [], pending = [], onRemove, onDropPending }) {
  const [lightbox, setLightbox] = useState(null)
  if (!photos.length && !pending.length) return null

  return (
    <div className="photo-grid">
      {photos.map((p) => (
        <div className="photo-thumb" key={p.id}>
          <img src={p.url} alt={p.caption || '检测照片'} onClick={() => setLightbox(p.url)} />
          {onRemove && (
            <button
              type="button"
              className="photo-del"
              title="删除照片"
              onClick={() => onRemove(p.id)}
            >
              ×
            </button>
          )}
          {p.caption && <span className="photo-caption">{p.caption}</span>}
        </div>
      ))}
      {pending.map((f, idx) => (
        <div className="photo-thumb pending" key={`pending-${idx}`}>
          <img src={URL.createObjectURL(f)} alt={f.name} />
          <span className="photo-pending-tag">待上传</span>
          {onDropPending && (
            <button
              type="button"
              className="photo-del"
              onClick={() => onDropPending(idx)}
            >
              ×
            </button>
          )}
        </div>
      ))}
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="大图" />
        </div>
      )}
    </div>
  )
}
