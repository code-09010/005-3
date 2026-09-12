# usedcar-check 二手车车况检测与对比系统

检测员按统一检测项逐项录入车辆状况（优/良/中/差）、描述和照片，系统按权重
自动计算车况综合评分；买家可同时调出多份报告并排对比，自动高亮评分差异较大
的检测项，快速判断哪辆车更值。

## 架构

```
usedcar-check/
├── docker-compose.yml        # 编排 postgres / inspect-svc / report-view
├── inspect-svc/              # 后端：Python + Django + DRF
│   ├── Dockerfile
│   ├── entrypoint.sh         # 等待 PG → migrate → 种子检测项 → 启动
│   └── config/ + inspect/    # Django 项目与 app
└── report-view/              # 前端：React + Vite
    ├── Dockerfile            # 多阶段构建，Nginx 托管并反代 /api、/media
    └── src/
```

- 图片存储：后端本地文件系统（`/data/media`，compose 命名卷 `inspect_media`）
- 业务数据：PostgreSQL 16（卷 `pgdata`）
- 综合评分：`Σ(评级分数 × 权重) / Σ权重`，优=100 良=80 中=60 差=30，
  未评级的检测项不计入；结果四舍五入保留 1 位小数

## 一键启动

```bash
cd usedcar-check
docker compose up -d --build
# 前端（报告列表/新建/对比）: http://localhost:8080
# Django Admin（需先建管理员） : http://localhost:8080/api/admin/
```

创建管理员：

```bash
docker compose exec inspect-svc python manage.py createsuperuser
```

停止并清空数据：`docker compose down -v`

## 检测项（26 项，启动时自动种子化）

外观、发动机、变速箱、底盘、制动、转向、悬架、轮胎、内饰、电气……完整列表见
`inspect/management/commands/seed_items.py`，可在 Django Admin 中增删改权重。

## 本地开发（不用 Docker）

```bash
# 后端
cd inspect-svc
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_items
python manage.py runserver

# 前端（Vite dev server 已配置 /api 代理到 :8000）
cd report-view
npm install
npm run dev
```

## 主要 API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/items/` | 检测项目录（含权重/分组） |
| GET/POST | `/api/reports/` | 报告列表 / 新建报告（含全部检测项） |
| GET/PUT/DELETE | `/api/reports/{id}/` | 报告详情 / 全量更新 / 删除 |
| GET | `/api/reports/compare?ids=1,2,3` | 多报告按检测项对齐（最多 4 份） |
| POST | `/api/photos/` | 上传检测项照片（multipart/form-data） |
