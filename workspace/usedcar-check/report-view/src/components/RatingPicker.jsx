import { RATINGS, RATING_BG, RATING_COLORS } from '../constants'

// 评级选择器：优 / 良 / 中 / 差 / 未评
export default function RatingPicker({ value, onChange }) {
  return (
    <div className="rating-picker">
      {RATINGS.map((r) => (
        <button
          type="button"
          key={r}
          className={`rating-opt ${value === r ? 'active' : ''}`}
          style={
            value === r
              ? { background: RATING_COLORS[r], borderColor: RATING_COLORS[r] }
              : { color: RATING_COLORS[r], background: RATING_BG[r] }
          }
          onClick={() => onChange(value === r ? '' : r)}
        >
          {r}
        </button>
      ))}
      {value && (
        <button
          type="button"
          className="rating-clear"
          onClick={() => onChange('')}
          title="清除评级"
        >
          未评
        </button>
      )}
    </div>
  )
}
