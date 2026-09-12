import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import PhotoGrid from '../components/PhotoGrid'
import RatingPicker from '../components/RatingPicker'
import { ErrorBox, Spinner } from '../components/States'
import { RATING_SCORES } from '../constants'

function emptyRow() {
  return { rating: '', description: '', photos: [], pending: [], removedPhotoIds: [] }
}

export default function ReportFormPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()

  const [items, setItems] = useState(null)
  const [header, setHeader] = useState({
    brand: '',
    model: '',
    year: String(new Date().getFullYear()),
    mileage: '',
    inspector: '',
  })
  // itemId -> { rating, description, photos(已上传), pending(File[]), removedPhotoIds }
  const [rows, setRows] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [saveError, setSaveError] = useState('')
  const fileInputs = useRef({})

  useEffect(() => {
    Promise.all([api.listItems(), editing ? api.getReport(id) : Promise.resolve(null)])
      .then(([catalog, report]) => {
        setItems(catalog)
        const nextRows = {}
        for (const item of catalog) nextRows[item.id] = emptyRow()
        if (report) {
          setHeader({
            brand: report.brand,
            model: report.model,
            year: String(report.year),
            mileage: String(report.mileage),
            inspector: report.inspector || '',
          })
          for (const ri of report.items) {
            nextRows[ri.item.id] = {
              rating: ri.rating || '',
              description: ri.description || '',
              photos: ri.photos || [],
              pending: [],
              removedPhotoIds: [],
            }
          }
        }
        setRows(nextRows)
      })
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false))
  }, [id, editing])

  const groups = useMemo(() => {
    if (!items) return []
    const map = new Map()
    for (const item of items) {
      if (!map.has(item.category)) map.set(item.category, [])
      map.get(item.category).push(item)
    }
    return Array.from(map.entries())
  }, [items])

  const ratedCount = useMemo(
    () => Object.values(rows).filter((r) => r.rating).length,
    [rows],
  )

  // 本地预估综合评分（保存后以后端重算为准）
  const previewScore = useMemo(() => {
    if (!items) return null
    let weighted = 0
    let totalWeight = 0
    for (const item of items) {
      const row = rows[item.id]
      if (row?.rating) {
        weighted += RATING_SCORES[row.rating] * item.weight
        totalWeight += item.weight
      }
    }
    return totalWeight ? Math.round((weighted / totalWeight) * 10) / 10 : null
  }, [items, rows])

  const setRow = (itemId, patch) =>
    setRows((prev) => ({ ...prev, [itemId]: { ...prev[itemId], ...patch } }))

  const onPickFiles = (itemId, fileList) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
    if (!files.length) return
    const row = rows[itemId]
    setRow(itemId, { pending: [...row.pending, ...files] })
  }

  const removeExistingPhoto = (itemId, photoId) => {
    const row = rows[itemId]
    setRow(itemId, {
      photos: row.photos.filter((p) => p.id !== photoId),
      removedPhotoIds: [...row.removedPhotoIds, photoId],
    })
  }

  const submit = async () => {
    setSaveError('')
    if (!header.brand.trim()) return setSaveError('请填写车辆品牌')
    if (!header.model.trim()) return setSaveError('请填写车辆型号')
    const year = Number(header.year)
    const mileage = Number(header.mileage)
    if (!year || year < 1950) return setSaveError('请填写有效年份')
    if (header.mileage === '' || Number.isNaN(mileage) || mileage < 0)
      return setSaveError('请填写有效里程')

    setSaving(true)
    try {
      const payload = {
        brand: header.brand.trim(),
        model: header.model.trim(),
        year,
        mileage,
        inspector: header.inspector.trim(),
        items: items.map((item) => ({
          item: item.id,
          rating: rows[item.id]?.rating || '',
          description: rows[item.id]?.description || '',
        })),
      }

      setSaveStatus('正在保存检测项…')
      const saved = editing
        ? await api.updateReport(id, payload)
        : await api.createReport(payload)

      // 删除编辑中被移除的已有照片
      const removedIds = Object.values(rows).flatMap((r) => r.removedPhotoIds)
      for (const photoId of removedIds) {
        await api.deletePhoto(photoId)
      }

      // 上传待传照片：按检测项找到保存后的 ReportItem id
      const resultIdByItem = Object.fromEntries(saved.items.map((ri) => [ri.item.id, ri.id]))
      const groupsToUpload = Object.entries(rows).filter(([, r]) => r.pending.length)
      let done = 0
      const total = groupsToUpload.reduce((n, [, r]) => n + r.pending.length, 0)
      for (const [itemId, row] of groupsToUpload) {
        const reportItemId = resultIdByItem[Number(itemId)]
        for (const file of row.pending) {
          done += 1
          setSaveStatus(`正在上传照片 ${done}/${total}…`)
          await api.uploadPhoto(reportItemId, file)
        }
      }

      navigate(`/reports/${saved.id}`)
    } catch (e) {
      setSaveError(e.message)
      setSaving(false)
    }
  }

  if (loading) return <Spinner text="正在载入检测项目录…" />
  if (loadError) return <ErrorBox message={loadError} />

  return (
    <div className="form-page">
      <div className="page-head">
        <div>
          <h1>{editing ? '编辑检测报告' : '新建检测报告'}</h1>
          <p className="muted">
            逐项选择评级并填写状况描述，可附照片；未评级的项目不计入综合评分
          </p>
        </div>
        <Link to="/" className="btn">
          ← 返回列表
        </Link>
      </div>

      <section className="card vehicle-card">
        <h2>车辆信息</h2>
        <div className="vehicle-grid">
          <label>
            品牌 <span className="req">*</span>
            <input
              value={header.brand}
              onChange={(e) => setHeader({ ...header, brand: e.target.value })}
              placeholder="如 丰田"
            />
          </label>
          <label>
            型号 <span className="req">*</span>
            <input
              value={header.model}
              onChange={(e) => setHeader({ ...header, model: e.target.value })}
              placeholder="如 凯美瑞 2.5G"
            />
          </label>
          <label>
            年份 <span className="req">*</span>
            <input
              type="number"
              value={header.year}
              onChange={(e) => setHeader({ ...header, year: e.target.value })}
            />
          </label>
          <label>
            里程（km） <span className="req">*</span>
            <input
              type="number"
              min="0"
              value={header.mileage}
              onChange={(e) => setHeader({ ...header, mileage: e.target.value })}
              placeholder="如 52000"
            />
          </label>
          <label>
            检测员
            <input
              value={header.inspector}
              onChange={(e) => setHeader({ ...header, inspector: e.target.value })}
              placeholder="选填"
            />
          </label>
        </div>
      </section>

      <div className="form-progress">
        <div>
          <strong>录入进度</strong>：已评级 {ratedCount} / {items.length} 项
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${(ratedCount / items.length) * 100}%` }}
          />
        </div>
        <div className="preview-score">
          预估综合评分：
          <strong>{previewScore === null ? '未评级' : previewScore}</strong>
        </div>
      </div>

      {groups.map(([category, catItems]) => (
        <section key={category} className="item-group">
          <h2 className="group-title">
            {category}
            <span className="muted small">
              {' '}
              {catItems.filter((it) => rows[it.id]?.rating).length}/{catItems.length} 项已评
            </span>
          </h2>
          {catItems.map((item) => {
            const row = rows[item.id] || emptyRow()
            return (
              <div className="card item-card" key={item.id}>
                <div className="item-head">
                  <h3>
                    {item.name}
                    <span className="weight-tag">权重 {item.weight}</span>
                  </h3>
                  <RatingPicker
                    value={row.rating}
                    onChange={(rating) => setRow(item.id, { rating })}
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="描述该项目的实际状况，如：油底壳轻微渗油，机脚垫老化…"
                  value={row.description}
                  onChange={(e) => setRow(item.id, { description: e.target.value })}
                />
                <div className="item-photos">
                  <PhotoGrid
                    photos={row.photos}
                    pending={row.pending}
                    onRemove={(photoId) => removeExistingPhoto(item.id, photoId)}
                    onDropPending={(idx) =>
                      setRow(item.id, {
                        pending: row.pending.filter((_, i) => i !== idx),
                      })
                    }
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => fileInputs.current[item.id]?.click()}
                  >
                    📷 添加照片
                  </button>
                  <input
                    ref={(el) => (fileInputs.current[item.id] = el)}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => {
                      onPickFiles(item.id, e.target.files)
                      e.target.value = ''
                    }}
                  />
                </div>
              </div>
            )
          })}
        </section>
      ))}

      {saveError && <div className="form-error">⚠️ {saveError}</div>}

      <div className="form-actions">
        <Link to="/" className="btn">
          取消
        </Link>
        <button className="btn btn-primary" disabled={saving} onClick={submit}>
          {saving ? saveStatus || '保存中…' : editing ? '保存修改' : '生成报告'}
        </button>
      </div>
    </div>
  )
}
