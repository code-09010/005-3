import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import RatingBadge from '../components/RatingBadge'
import PhotoGrid from '../components/PhotoGrid'
import ScoreRing from '../components/ScoreRing'
import { EmptyBox, ErrorBox, Spinner } from '../components/States'
import { formatDate, formatMileage } from '../utils'

export default function ReportDetailPage() {
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')

  const load = () => {
    setReport(null)
    setError('')
    api
      .getReport(id)
      .then(setReport)
      .catch((e) => setError(e.message))
  }
  useEffect(load, [id])

  if (report === null && !error) return <Spinner />
  if (error) return <ErrorBox message={error} onRetry={load} />
  if (!report) return <EmptyBox />

  return (
    <div className="detail-page">
      <div className="page-head">
        <div>
          <Link to="/" className="back-link">
            ← 报告列表
          </Link>
          <h1>
            {report.brand} {report.model}
          </h1>
          <p className="muted">
            {report.year} 年 · {formatMileage(report.mileage)}
            {report.inspector ? ` · 检测员：${report.inspector}` : ''} ·{' '}
            {formatDate(report.created_at)}
          </p>
        </div>
        <div className="page-actions no-print">
          <Link to={`/reports/${report.id}/edit`} className="btn">
            编辑
          </Link>
          <button className="btn" onClick={() => window.print()}>
            打印 / 导出 PDF
          </button>
        </div>
      </div>

      <section className="card detail-summary">
        <ScoreRing score={report.overall_score ? Number(report.overall_score) : null} />
        <div className="detail-summary-text">
          <h2>车况综合评分</h2>
          <p className="muted">
            按 {report.items.filter((i) => i.rating).length} 个已评级检测项的权重加权计算
          </p>
        </div>
      </section>

      {report.items.map((ri) => (
        <section className="card detail-item" key={ri.id}>
          <div className="detail-item-head">
            <h3>
              {ri.item.name}
              <span className="weight-tag">权重 {ri.item.weight}</span>
              <span className="muted small">{ri.item.category}</span>
            </h3>
            <RatingBadge rating={ri.rating} />
          </div>
          {ri.description ? (
            <p className="detail-desc">{ri.description}</p>
          ) : (
            <p className="muted small">（无描述）</p>
          )}
          <PhotoGrid photos={ri.photos} />
        </section>
      ))}
    </div>
  )
}
