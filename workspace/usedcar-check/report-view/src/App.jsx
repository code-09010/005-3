import { Link, Route, Routes } from 'react-router-dom'
import ReportListPage from './pages/ReportListPage.jsx'
import ReportFormPage from './pages/ReportFormPage.jsx'
import ReportDetailPage from './pages/ReportDetailPage.jsx'
import ComparePage from './pages/ComparePage.jsx'

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark">🚗</span> 二手车检测报告
        </Link>
        <nav>
          <Link to="/">报告列表</Link>
          <Link to="/reports/new" className="nav-primary">
            + 新建检测
          </Link>
        </nav>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<ReportListPage />} />
          <Route path="/reports/new" element={<ReportFormPage />} />
          <Route path="/reports/:id" element={<ReportDetailPage />} />
          <Route path="/reports/:id/edit" element={<ReportFormPage />} />
          <Route path="/compare" element={<ComparePage />} />
        </Routes>
      </main>
      <footer className="footer">
        评分规则：优 100 / 良 80 / 中 60 / 差 30，按检测项权重加权平均
      </footer>
    </div>
  )
}
