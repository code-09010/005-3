import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import ScoreRing from '../components/ScoreRing'
import { EmptyBox, ErrorBox, Spinner } from '../components/States'
import { formatDate, formatMileage } from '../utils'

export default function ReportListPage() {
  const [reports, setReports] = useState(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(() => new Set())
  const navigate = useNavigate()

  const load = () => {
    setReports(null)
    setError('')
    api
      .listReports()
      .then(setReports)
      .catch((e) => setError(e.message))
  }

  useEffect(load, [])

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else {
        if (next.size >= 4) {
          alert('最多同时对比 4 份报告')
          return prev
        }
        next.add(id)
      }
      return next
    })
  }

  const remove = async (id) => {
    if (!confirm('确定删除这份检测报告？删除后不可恢复。')) return
    await api.deleteReport(id)
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    load()
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>检测报告</h1>
          <p className="muted">勾选 2–4 份报告进行并排对比，快速判断哪辆更值</p>
        </div>
        <div className="page-actions">
          <Link to="/reports/new" className="btn btn-primary">
            + 新建检测
          </Link>
        </div>
      </div>

      {reports === null && !error && <Spinner />}
      {error && <ErrorBox message={error} onRetry={load} />}
      {reports && reports.length === 0 && (
        <EmptyBox text="还没有检测报告，点击右上角「新建检测」开始录入第一辆车" />
      )}

      {reports && reports.length > 0 && (
        <>
          <div className="compare-bar">
            <span>
              已选 <strong>{selected.size}</strong> / 4 份
              {selected.size > 0 && (
                <button className="link-btn" onClick={() => setSelected(new Set())}>
                  清空
                </button>
              )}
            </span>
            <button
              className="btn btn-primary"
              disabled={selected.size < 2}
              onClick={() =>
                navigate(`/compare?ids=${Array.from(selected).join(',')}`)
              }
            >
              并排对比 →
            </button>
          </div>

          <div className="report-grid">
            {reports.map((r) => (
              <div
                key={r.id}
                className={`report-card ${selected.has(r.id) ? 'selected' : ''}`}
              >
                <label className="report-check">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggle(r.id)}
                  />
                  对比
                </label>
                <Link to={`/reports/${r.id}`} className="report-card-body">
                  <div className="report-card-info">
                    <h3>
                      {r.brand} {r.model}
                    </h3>
                    <p className="muted">
                      {r.year} 年 · {formatMileage(r.mileage)}
                    </p>
                    <p className="muted small">
                      {r.inspector ? `检测员：${r.inspector} · ` : ''}
                      {formatDate(r.created_at)}
                    </p>
                  </div>
                  <ScoreRing score={r.overall_score ? Number(r.overall_score) : null} size={96} />
                </Link>
                <div className="report-card-foot">
                  <Link to={`/reports/${r.id}/edit`} className="link-btn">
                    编辑
                  </Link>
                  <button className="link-btn danger" onClick={() => remove(r.id)}>
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
