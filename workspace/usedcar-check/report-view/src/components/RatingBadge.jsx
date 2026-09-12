import { RATING_BG, RATING_COLORS } from '../constants'

export default function RatingBadge({ rating }) {
  if (!rating) {
    return <span className="rating-badge rating-none">未评</span>
  }
  return (
    <span
      className="rating-badge"
      style={{ color: RATING_COLORS[rating], background: RATING_BG[rating] }}
    >
      {rating}
    </span>
  )
}
