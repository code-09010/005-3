// 评级常量与分数（与后端 inspect/scoring.py 保持一致）
export const RATINGS = ['优', '良', '中', '差']

export const RATING_SCORES = { 优: 100, 良: 80, 中: 60, 差: 30 }

export const RATING_COLORS = {
  优: '#1a9850',
  良: '#66bd63',
  中: '#fdae61',
  差: '#d73027',
}

export const RATING_BG = {
  优: '#e6f6ec',
  良: '#eef9ee',
  中: '#fff3e3',
  差: '#fdecea',
}

// 对比时分数差 >= 20 视为差异较大，高亮整行
export const BIG_DIFF_THRESHOLD = 20

export function scoreLevel(score) {
  if (score === null || score === undefined) return { label: '暂无', color: '#999' }
  if (score >= 90) return { label: '极优车况', color: '#1a9850' }
  if (score >= 80) return { label: '车况良好', color: '#66bd63' }
  if (score >= 65) return { label: '车况一般', color: '#fdae61' }
  return { label: '车况较差', color: '#d73027' }
}
