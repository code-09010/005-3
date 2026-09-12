export function Spinner({ text = '加载中…' }) {
  return (
    <div className="state-box">
      <div className="spinner" />
      <p>{text}</p>
    </div>
  )
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="state-box error">
      <p>⚠️ {message}</p>
      {onRetry && (
        <button className="btn" onClick={onRetry}>
          重试
        </button>
      )}
    </div>
  )
}

export function EmptyBox({ text = '暂无数据' }) {
  return (
    <div className="state-box empty">
      <p>{text}</p>
    </div>
  )
}
