import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import RatingBadge from '../components/RatingBadge'
import { EmptyBox, ErrorBox, Spinner } from '../components/States'
import {
  BIG_DIFF_THRESHOLD,
  RATING_COLORS,
  RATING_SCORES,
  scoreLevel,
} from '../constants'
import { formatMileage } from '../utils'

export default function ComparePage() {
  const [params] = useSearchParams()
  const ids = useMemo(
    () =>
      (params.get('ids') || '')
        .split(',')
        .filter(Boolean)
        .map(Number),
    [params],
  )

  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [showPhoto, setShowPhoto] = useState(false)

  useEffect(() => {
    if (ids.length < 2) {
      setError('请先在报告列表勾选至少 2 份报告')
      return
    }
    setData(null)
    setError('')
    api
      .compareReports(ids)
      .then(setData)
      .catch((e) => setError(e.message))
  }, [ids.join(',')])

  // 每行：是否差异较大、是否有未评列、最优/最差列索引
  const annotatedRows = useMemo(() => {
    if (!data) return []
    return data.rows.map((row) => {
      const scores = row.cells.map((c) => c.score)
      const present = scores.filter((s) => s !== null)
      // 「有评级 vs 未评」也算差异
      const mixed = present.length > 0 && present.length < scores.length
      let scoreDiff = false
      let bestIdx = null
      let worstIdx = null
      if (present.length >= 2) {
        const max = Math.max(...present)
        const min = Math.min(...present)
        scoreDiff = max - min >= BIG_DIFF_THRESHOLD
        if (scoreDiff) {
          bestIdx = scores.indexOf(max)
          worstIdx = scores.lastIndexOf(min)
        }
      }
      return {
        ...row,
        bigDiff: scoreDiff || mixed,
        scoreDiff,
        mixed,
        bestIdx,
        worstIdx,
        scores,
      }
    })
  }, [data])

  const bestReport = useMemo(() => {
    if (!data) return null
    const scored = data.reports
      .filter((r) => r.overall_score !== null)
      .sort((a, b) => Number(b.overall_score) - Number(a.overall_score))
    return scored[0] || null
  }, [data])

  if (error) return <ErrorBox message={error} />
  if (!data) return <Spinner text="正在生成对比…" />
  if (!data.reports.length) return <EmptyBox text="没有可对比的报告" />

  return (
    <div className="compare-page">
      <div className="page-head">
        <div>
          <Link to="/" className="back-link">
            ← 报告列表
          </Link>
          <h1>多车并排对比</h1>
          <p className="muted">
            同一检测项评级分差 ≥ {BIG_DIFF_THRESHOLD} 分，或「有评级 vs 未评」时整行高亮；
            <span className="legend-best">绿色</span>为该项最优，
            <span className="legend-worst">红色</span>为该项最差
          </p>
        </div>
        <label className="photo-toggle no-print">
          <input
            type="checkbox"
            checked={showPhoto}
            onChange={(e) => setShowPhoto(e.target.checked)}
          />
          展开照片
        </label>
      </div>

      {bestReport && (
        <div className="card recommend-banner">
          🏆 综合评分最高：
          <strong>
            {bestReport.brand} {bestReport.model}（{bestReport.year}）
          </strong>
          ，综合评分
          <strong style={{ color: scoreLevel(Number(bestReport.overall_score)).color }}>
            {' '}
            {bestReport.overall_score}{' '}
          </strong>
          分 — <Link to={`/reports/${bestReport.id}`}>查看完整报告</Link>
        </div>
      )}

      <div className="table-scroll">
        <table className="compare-table">
          <thead>
            <tr>
              <th className="col-item">检测项</th>
              {data.reports.map((r) => (
                <th key={r.id} className="col-report">
                  <Link to={`/reports/${r.id}`} className="compare-car-name">
                    {r.brand} {r.model}
                  </Link>
                  <div className="muted small">
                    {r.year} · {formatMileage(r.mileage)}
                  </div>
                  <div
                    className="compare-score"
                    style={{
                      color:
                        r.overall_score === null
                          ? '#999'
                          : scoreLevel(Number(r.overall_score)).color,
                    }}
                  >
                    {r.overall_score === null ? '未评分' : `${r.overall_score} 分`}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {annotatedRows.map((row) => {
              const item = row.item
              return (
                <tr key={item.id} className={row.bigDiff ? 'big-diff' : ''}>
                  <td className="col-item">
                    <div className="compare-item-name">{item.name}</div>
                    <span className="weight-tag">权重 {item.weight}</span>
                    {row.scoreDiff && <span className="diff-flag">差异较大</span>}
                    {row.mixed && <span className="diff-flag">有未评项</span>}
                  </td>
                  {row.cells.map((cell, idx) => {
                    const isBest = idx === row.bestIdx && row.bigDiff
                    const isWorst = idx === row.worstIdx && row.bigDiff
                    return (
                      <td
                        key={cell.report}
                        className={[
                          'compare-cell',
                          isBest ? 'cell-best' : '',
                          isWorst ? 'cell-worst' : '',
                        ].join(' ')}
                      >
                        <div className="cell-rating">
                          <RatingBadge rating={cell.rating} />
                          {cell.score !== null && (
                            <span
                              className="muted small"
                              style={{
                                color: RATING_COLORS[cell.rating],
                              }}
                            >
                              {cell.score}
                              {isBest && ' ✓'}
                            </span>
                          )}
                        </div>
                        <p className="cell-desc">{cell.description || ''}</p>
                        {showPhoto && cell.photos.length > 0 && (
                          <div className="cell-photos">
                            {cell.photos.map((p) => (
                              <a key={p.id} href={p.url} target="_blank" rel="noreferrer">
                                <img src={p.url} alt={p.caption || '检测照片'} />
                              </a>
                            ))}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="compare-actions no-print">
        <Link to="/" className="btn">
          重新选择
        </Link>
      </div>
    </div>
  )
}
