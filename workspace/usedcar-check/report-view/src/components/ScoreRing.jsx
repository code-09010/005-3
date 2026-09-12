import { scoreLevel } from '../constants'

// 圆环综合评分
export default function ScoreRing({ score, size = 120 }) {
  const level = scoreLevel(score)
  const pct = score === null || score === undefined ? 0 : score
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#eee"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={level.color}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="score-ring-inner">
        <div className="score-ring-value">
          {score === null || score === undefined ? '--' : score}
        </div>
        <div className="score-ring-label" style={{ color: level.color }}>
          {level.label}
        </div>
      </div>
    </div>
  )
}
