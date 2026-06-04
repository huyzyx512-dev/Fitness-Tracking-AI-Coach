<div align="center">

# FitTrack

### Website quản lý luyện tập thể hình với trợ lý AI

FitTrack là ứng dụng web hỗ trợ người dùng quản lý bài tập, buổi tập, nhật ký luyện tập, gói đăng ký và tạo kế hoạch tập luyện với AI Fitness Coach.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)
![Sequelize](https://img.shields.io/badge/ORM-Sequelize-52B0E7)
![AI](https://img.shields.io/badge/AI-OpenRouter-111827)
![Payment](https://img.shields.io/badge/Payment-SePay-FF6B00)

</div>

---

## Mục lục

- [Giới thiệu](#giới-thiệu)
- [Tính năng chính](#tính-năng-chính)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Yêu cầu môi trường](#yêu-cầu-môi-trường)
- [Cài đặt nhanh](#cài-đặt-nhanh)
- [Cấu hình biến môi trường](#cấu-hình-biến-môi-trường)
- [Database, migration và seeder](#database-migration-và-seeder)
- [Chạy dự án](#chạy-dự-án)
- [Tài khoản demo](#tài-khoản-demo)
- [API tiêu biểu](#api-tiêu-biểu)
- [AI Coach](#ai-coach)
- [Thanh toán SePay](#thanh-toán-sepay)
- [Script thường dùng](#script-thường-dùng)
- [Kiểm thử](#kiểm-thử)
- [Ghi chú bảo mật](#ghi-chú-bảo-mật)
- [Khắc phục lỗi thường gặp](#khắc-phục-lỗi-thường-gặp)
- [Hướng phát triển](#hướng-phát-triển)
- [Tác giả](#tác-giả)

---

## Giới thiệu

**FitTrack** là hệ thống web quản lý luyện tập thể hình được xây dựng theo mô hình client-server. Ứng dụng cho phép người dùng tạo tài khoản, quản lý hồ sơ cá nhân, xem thư viện bài tập, tạo buổi tập, ghi nhật ký luyện tập, đăng ký gói sử dụng và dùng AI Fitness Coach để hỏi đáp hoặc tạo kế hoạch tập luyện.

Hệ thống gồm hai phần chính:

- **Frontend**: React + TypeScript + Vite, xây dựng giao diện SPA.
- **Backend**: Node.js + Express, cung cấp REST API, xử lý xác thực, nghiệp vụ, AI, thanh toán và cơ sở dữ liệu.

Dự án được phát triển phục vụ khóa luận tốt nghiệp với đề tài **“Phát triển ứng dụng web quản lý luyện tập thể hình với trợ lý AI”**.

---

## Tính năng chính

### Người dùng

- Đăng ký, đăng nhập, đăng xuất và làm mới phiên đăng nhập.
- Cập nhật hồ sơ cá nhân: họ tên, cân nặng, chiều cao, giới tính, ngày sinh.
- Xem, tìm kiếm và lọc danh sách bài tập.
- Xem chi tiết bài tập, nhóm cơ, độ khó, thiết bị, MET và video minh họa.
- Tạo, sửa, xóa buổi tập cá nhân.
- Thêm bài tập vào buổi tập và cấu hình `sets`, `reps`, `weight`, `rest_time`.
- Bắt đầu và hoàn thành buổi tập với các trạng thái `pending`, `in_progress`, `completed`.
- Ghi nhận nhật ký tập luyện, thời lượng, calo tiêu hao và ghi chú.
- Hỏi đáp với AI Fitness Coach trong phạm vi luyện tập.
- Tạo kế hoạch tập luyện bằng AI dựa trên mục tiêu, trình độ, số ngày tập, thời lượng và thiết bị.
- Áp dụng kế hoạch AI thành các buổi tập trong hệ thống.
- Xem gói đăng ký, tạo đơn thanh toán và theo dõi trạng thái đơn.

### Quản trị viên

- Quản lý danh sách người dùng.
- Tìm kiếm, lọc và xem chi tiết tài khoản.
- Tạo tài khoản người dùng mới.
- Đổi vai trò người dùng.
- Khóa hoặc mở khóa tài khoản.
- Reset mật khẩu người dùng.
- Buộc người dùng đăng xuất thông qua `tokenVersion`.
- Xem audit log cho các thao tác quản trị.
- Quản lý dữ liệu bài tập nền tảng.

---

## Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Form | React Hook Form, Zod |
| State | Zustand, TanStack Query |
| HTTP Client | Axios |
| Backend | Node.js, Express |
| Database | MySQL |
| ORM | Sequelize, sequelize-cli |
| Authentication | JWT, Refresh Token, Cookie httpOnly, bcrypt |
| Upload | Multer |
| AI Provider | OpenRouter API |
| Payment Provider | SePay Webhook |
| Development | Nodemon, ESLint, Docker Compose |

---

## Kiến trúc hệ thống

```text
User / Admin
    |
    v
Frontend: React + TypeScript + Vite
    |
    | REST API / Axios
    v
Backend: Node.js + Express
    |
    | Sequelize ORM
    v
MySQL Database

External Services:
- OpenRouter API: AI Coach và tạo kế hoạch tập luyện
- SePay Webhook: xác nhận giao dịch thanh toán
- Local Uploads: lưu video bài tập
```

Backend đóng vai trò trung gian để:

- Bảo vệ API key và secret.
- Xác thực người dùng bằng JWT.
- Phân quyền route quản trị.
- Validate dữ liệu đầu vào bằng Zod.
- Chuẩn hóa lỗi API.
- Kiểm soát prompt và output từ AI.
- Xác thực webhook thanh toán.

---

## Cấu trúc thư mục

```text
TestGiaoDien/
├── backend/
│   ├── src/
│   │   ├── config/              # Cấu hình env và database
│   │   ├── controllers/         # Nhận request, gọi service, trả response
│   │   ├── errors/              # AppError và lỗi dùng chung
│   │   ├── integrations/        # Tích hợp AI và payment provider
│   │   ├── middlewares/         # Auth, permission, upload, error handler
│   │   ├── migrations/          # Sequelize migrations
│   │   ├── models/              # Sequelize models
│   │   ├── routes/              # REST API routes
│   │   ├── seeders/             # Dữ liệu mẫu
│   │   ├── services/            # Xử lý nghiệp vụ chính
│   │   ├── utils/               # Hàm tiện ích
│   │   ├── validators/          # Zod schemas
│   │   ├── app.js               # Khởi tạo Express app
│   │   └── server.js            # Start server
│   ├── test/                    # Test runner backend
│   ├── .env.example             # File mẫu biến môi trường
│   ├── docker-compose.yml       # MySQL development container
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios client và API modules
│   │   ├── assets/              # Hình ảnh, icon
│   │   ├── components/          # Layout và UI components
│   │   ├── hooks/               # TanStack Query hooks
│   │   ├── lib/                 # Constants, utils, query client
│   │   ├── pages/               # Các trang chức năng
│   │   ├── router/              # ProtectedRoute, RoleGuard, routes
│   │   ├── store/               # Zustand stores
│   │   ├── types/               # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── .env
│   └── package.json
│
└── README.md
```

---

## Yêu cầu môi trường

Cài đặt trước:

- Node.js 20 trở lên.
- npm 10 trở lên.
- MySQL 8.0 trở lên, hoặc Docker để chạy MySQL container.
- Git.

Kiểm tra phiên bản:

```bash
node -v
npm -v
mysql --version
```

---

## Cài đặt nhanh

Clone repository:

```bash
git clone https://github.com/<username>/<repository>.git
cd <repository>
```

Cài đặt backend:

```bash
cd backend
npm install
cp .env.example .env
```

Cài đặt frontend:

```bash
cd ../frontend
npm install
```

Trên Windows PowerShell, thay `cp` bằng:

```powershell
Copy-Item .env.example .env
```

---

## Cấu hình biến môi trường

### Backend

Tạo file `backend/.env` từ `backend/.env.example`.

Ví dụ cấu hình tối thiểu:

```env
PORT=5000
NODE_ENV=development

CORS_ORIGINS=http://localhost:5173
COOKIE_DOMAIN=

MYSQL_DATABASE=fitness_tracker
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=fitness-app
MYSQL_PASSWORD=your_password
MYSQL_ROOT_PASSWORD=your_root_password

ACCESS_TOKEN_SECRET=change_this_to_a_long_random_secret

AI_FEATURE_ENABLED=0
AI_PROVIDER=openrouter
AI_BASE_URL=https://openrouter.ai/api/v1
AI_API_KEY=
AI_MODEL=openrouter/free
AI_REQUEST_TIMEOUT_MS=60000
OPENROUTER_HTTP_REFERER=http://localhost:5173
OPENROUTER_APP_TITLE=FitTrack AI Coach

SEPAY_PROVIDER_ENABLED=0
SEPAY_WEBHOOK_SECRET=
SEPAY_BANK_ACCOUNT=
SEPAY_BANK_NAME=
SEPAY_ACCOUNT_NAME=
SEPAY_QR_TEMPLATE=
SEPAY_ORDER_TTL_MINUTES=30
SEPAY_MERCHANT_ID=
SEPAY_SECRET_KEY=
```

> Lưu ý: `frontend/vite.config.ts` hiện đang proxy `/api` đến `http://localhost:5001`. Nếu backend chạy ở `PORT=5000`, hãy đổi proxy target về `http://localhost:5000`, hoặc đặt `PORT=5001` trong `backend/.env` để khớp cấu hình hiện tại.

### Frontend

File `frontend/.env` có thể cấu hình:

```env
VITE_API_URL=/api
VITE_API_TIMEOUT=60000
```

Nếu không dùng Vite proxy, có thể gọi trực tiếp backend:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Database, migration và seeder

### Cách 1: Dùng MySQL local

Tạo database:

```sql
CREATE DATABASE fitness_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Cập nhật `backend/.env`:

```env
MYSQL_DATABASE=fitness_tracker
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
```

### Cách 2: Dùng Docker Compose

Từ thư mục `backend`, chạy:

```bash
docker compose up -d mysql
```

Sau đó cấu hình `backend/.env` theo cổng MySQL container đã map trong `docker-compose.yml`.

### Chạy migration và seeder

Từ thư mục `backend`:

```bash
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

Migration dùng để tạo bảng. Seeder dùng để tạo dữ liệu mẫu như vai trò, tài khoản demo, gói đăng ký, danh mục, nhóm cơ và bài tập mẫu.

---

## Chạy dự án

### Chạy backend

```bash
cd backend
npm run dev
```

Backend mặc định chạy theo biến `PORT` trong `backend/.env`.

### Chạy frontend

Mở terminal mới:

```bash
cd frontend
npm run dev
```

Vite thường chạy tại:

```text
http://localhost:5173
```

---

## Tài khoản demo

Sau khi chạy seeder, có thể đăng nhập bằng các tài khoản sau:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@example.com` | `Admin@123` |
| User | `user@example.com` | `User@123` |
| Coach | `coach@example.com` | `Coach@123` |

> Các tài khoản này chỉ dùng cho môi trường phát triển. Không sử dụng trong production.

---

## API tiêu biểu

| Nhóm | Endpoint | Method | Mục đích |
|---|---|---|---|
| Auth | `/api/auth/register` | POST | Đăng ký tài khoản |
| Auth | `/api/auth/login` | POST | Đăng nhập |
| Auth | `/api/auth/logout` | POST | Đăng xuất |
| Auth | `/api/auth/refresh-token` | POST | Làm mới token |
| User | `/api/user` | GET | Lấy hồ sơ cá nhân |
| User | `/api/user` | PATCH | Cập nhật hồ sơ cá nhân |
| Admin | `/api/user/admin/users` | GET | Danh sách người dùng |
| Admin | `/api/user/admin/users` | POST | Tạo người dùng |
| Admin | `/api/user/admin/users/:id` | GET | Chi tiết người dùng |
| Admin | `/api/user/admin/users/:id/status` | PATCH | Khóa/mở tài khoản |
| Admin | `/api/user/admin/users/:id/role` | PATCH | Cập nhật vai trò |
| Admin | `/api/user/admin/users/:id/reset-password` | POST | Reset mật khẩu |
| Admin | `/api/user/admin/users/:id/force-logout` | POST | Buộc đăng xuất |
| Exercise | `/api/exercises` | GET | Danh sách bài tập |
| Exercise | `/api/exercises/:id` | GET | Chi tiết bài tập |
| Exercise | `/api/exercises` | POST | Tạo bài tập |
| Exercise | `/api/exercises/:id` | PUT | Cập nhật bài tập |
| Exercise | `/api/exercises/:id` | DELETE | Xóa bài tập |
| Exercise | `/api/exercises/:id/video` | POST | Upload video bài tập |
| Workout | `/api/workouts` | GET | Danh sách buổi tập |
| Workout | `/api/workouts` | POST | Tạo buổi tập |
| Workout | `/api/workouts/:id` | PUT | Cập nhật buổi tập |
| Workout | `/api/workouts/:id` | DELETE | Xóa buổi tập |
| Workout | `/api/workouts/:id/start` | PUT | Bắt đầu buổi tập |
| Workout | `/api/workouts/:id/complete` | PATCH | Hoàn thành buổi tập |
| Workout | `/api/workouts/:workoutId/exercise/:exerciseId` | POST | Thêm bài tập vào buổi tập |
| Workout | `/api/workouts/:workoutId/exercise/:exerciseId` | PUT | Cập nhật bài tập trong buổi tập |
| Workout | `/api/workouts/:workoutId/workout-exercise/:workoutExerciseId` | DELETE | Xóa bài tập khỏi buổi tập |
| Log | `/api/workout-logs` | GET | Danh sách nhật ký tập |
| Log | `/api/workout-logs` | POST | Tạo nhật ký tập |
| AI | `/api/ai/ask` | POST | Hỏi AI Fitness Coach |
| AI | `/api/ai/recommendations/generate` | POST | Tạo kế hoạch tập bằng AI |
| AI | `/api/ai/recommendations` | GET | Danh sách kế hoạch AI |
| AI | `/api/ai/recommendations/:id` | GET | Chi tiết kế hoạch AI |
| AI | `/api/ai/recommendations/:id/apply` | POST | Áp dụng kế hoạch AI thành workout |
| Billing | `/api/billing/plans` | GET | Danh sách gói đăng ký |
| Billing | `/api/billing/subscription` | GET | Gói hiện tại của người dùng |
| Billing | `/api/billing/orders` | POST | Tạo đơn thanh toán |
| Billing | `/api/billing/orders/:id` | GET | Xem trạng thái đơn |
| Billing Webhook | `/api/billing/webhooks/sepay` | POST | Nhận webhook SePay |

---

## AI Coach

AI Coach hỗ trợ:

1. Hỏi đáp về luyện tập trong phạm vi fitness.
2. Tạo kế hoạch tập luyện dạng JSON dựa trên mục tiêu, trình độ, số ngày tập, thời lượng và thiết bị.
3. Lưu lịch sử recommendation.
4. Áp dụng kế hoạch AI thành workout thật trong hệ thống.

Bật AI trong `backend/.env`:

```env
AI_FEATURE_ENABLED=1
AI_PROVIDER=openrouter
AI_BASE_URL=https://openrouter.ai/api/v1
AI_API_KEY=your_openrouter_api_key
AI_MODEL=your_model_name
AI_REQUEST_TIMEOUT_MS=60000
OPENROUTER_HTTP_REFERER=http://localhost:5173
OPENROUTER_APP_TITLE=FitTrack AI Coach
```

Lưu ý:

- Không đưa `AI_API_KEY` vào frontend.
- Không commit file `.env` chứa API key thật.
- AI chỉ đóng vai trò gợi ý tham khảo, không thay thế bác sĩ hoặc huấn luyện viên chuyên nghiệp.
- Output kế hoạch tập luyện từ AI cần được backend parse, validate và sanitize trước khi lưu.

---

## Thanh toán SePay

Hệ thống hỗ trợ thanh toán gói đăng ký thông qua `payment_order`, `payment_transaction` và `user_subscription`.

Luồng xử lý:

1. Người dùng chọn gói đăng ký.
2. Backend tạo đơn thanh toán với `order_code`, `payment_content`, số tiền và hạn thanh toán.
3. Người dùng chuyển khoản theo nội dung thanh toán hoặc QR.
4. SePay gửi webhook về `/api/billing/webhooks/sepay`.
5. Backend xác thực webhook bằng secret/chữ ký.
6. Backend ghi nhận giao dịch theo cơ chế idempotent.
7. Backend cập nhật đơn thành `paid` và kích hoạt subscription.

Bật thanh toán trong `backend/.env`:

```env
SEPAY_PROVIDER_ENABLED=1
SEPAY_WEBHOOK_SECRET=your_webhook_secret
SEPAY_BANK_ACCOUNT=your_bank_account
SEPAY_BANK_NAME=your_bank_name
SEPAY_ACCOUNT_NAME=your_account_name
SEPAY_ORDER_TTL_MINUTES=30
```

---

## Script thường dùng

### Backend

```bash
cd backend
npm run dev          # Chạy server development
npm test             # Chạy test runner backend
```

```bash
npx sequelize-cli db:migrate          # Chạy migration
npx sequelize-cli db:migrate:undo     # Rollback migration gần nhất
npx sequelize-cli db:seed:all         # Chạy toàn bộ seeder
npx sequelize-cli db:seed:undo:all    # Rollback toàn bộ seeder
```

### Frontend

```bash
cd frontend
npm run dev       # Chạy Vite dev server
npm run build     # Build production
npm run preview   # Preview build production
npm run lint      # Chạy ESLint
```

---

## Kiểm thử

Backend có test runner tại:

```text
backend/test/run-tests.js
```

Chạy test:

```bash
cd backend
npm test
```

Các nhóm kiểm thử nên duy trì:

- Đăng ký, đăng nhập, refresh token và logout.
- Validate dữ liệu đầu vào bằng Zod.
- Quyền truy cập route cần đăng nhập.
- Quyền truy cập route admin.
- Tạo, cập nhật, bắt đầu và hoàn thành buổi tập.
- Parse, validate và lưu kế hoạch AI.
- Xử lý lỗi AI provider.
- Tạo đơn thanh toán và xử lý webhook hợp lệ.
- Chặn webhook sai chữ ký hoặc giao dịch trùng.

---

## Ghi chú bảo mật

- Không commit `.env`, API key, access token hoặc refresh token.
- Mật khẩu phải được hash bằng bcrypt trước khi lưu database.
- Access token cần dùng secret đủ mạnh.
- Refresh token nên lưu qua cookie `httpOnly`.
- Route admin phải kiểm tra quyền `ADMIN`.
- Một số thao tác admin nhạy cảm nên yêu cầu xác nhận lại mật khẩu.
- Webhook thanh toán phải xác thực chữ ký hoặc secret.
- Không gọi OpenRouter trực tiếp từ frontend.
- Không sử dụng tài khoản demo trong production.
- Khi deploy production, bật HTTPS và cấu hình cookie `secure` phù hợp.

---

## Khắc phục lỗi thường gặp

### Frontend gọi API không được

Kiểm tra proxy trong `frontend/vite.config.ts`:

```ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5001',
      changeOrigin: true,
    },
  },
}
```

Nếu backend chạy ở port `5000`, đổi target thành:

```ts
target: 'http://localhost:5000'
```

Hoặc đặt trong `backend/.env`:

```env
PORT=5001
```

### Backend không kết nối được MySQL

Kiểm tra các biến:

```env
MYSQL_HOST
MYSQL_PORT
MYSQL_DATABASE
MYSQL_USER
MYSQL_PASSWORD
```

Nếu dùng Docker Compose, kiểm tra container:

```bash
docker compose ps
```

### Lỗi CORS

Đảm bảo `CORS_ORIGINS` trong `backend/.env` có đúng frontend origin:

```env
CORS_ORIGINS=http://localhost:5173
```

Sau khi sửa `.env`, restart backend.

### AI Coach báo chưa bật tính năng

Kiểm tra:

```env
AI_FEATURE_ENABLED=1
AI_API_KEY=your_openrouter_api_key
AI_PROVIDER=openrouter
```

Sau đó restart backend.

### Thanh toán không cập nhật subscription

Kiểm tra:

- Webhook URL đã trỏ đúng `/api/billing/webhooks/sepay` chưa.
- `SEPAY_WEBHOOK_SECRET` có khớp không.
- Nội dung chuyển khoản có chứa đúng `payment_content` hoặc `order_code` không.
- Đơn thanh toán còn hạn không.
- Giao dịch có bị gửi trùng không.

### Không truy cập được trang quản trị

Đảm bảo tài khoản có role `ADMIN`. Có thể dùng tài khoản seed:

```text
admin@example.com / Admin@123
```

---

## Hướng phát triển

- Phát triển mobile app bằng React Native hoặc Flutter.
- Bổ sung biểu đồ tiến độ luyện tập theo tuần/tháng.
- Thống kê tổng volume, nhóm cơ, tần suất tập và calo tiêu hao.
- Nâng cấp AI Coach với bộ nhớ ngữ cảnh cá nhân dài hạn.
- Tích hợp nhận diện động tác qua video để kiểm tra form tập luyện.
- Hoàn thiện giới hạn tính năng theo gói `FREE`, `PRO`, `COACH_PRO`.
- Bổ sung unit test, integration test và end-to-end test.
- Triển khai production bằng Docker, reverse proxy, HTTPS, logging và monitoring.
- Cải thiện giao diện responsive/mobile-first.
- Hỗ trợ đa ngôn ngữ.

---

## Tác giả

- **Sinh viên thực hiện**: Nguyễn Xuân Huy
- **Đề tài**: Phát triển ứng dụng web quản lý luyện tập thể hình với trợ lý AI
- **Khóa luận tốt nghiệp**: Ngành Công nghệ thông tin

---

<div align="center">

**FitTrack - Train smarter with AI**

</div>
