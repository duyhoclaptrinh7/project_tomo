# TOMO — Backend Coding Rules (MVP)

> **Mục đích:** để AI/dev code backend đúng style và nhất quán với kiến trúc đã chốt. File này là **luật bắt buộc** khi sinh/sửa code trong `tomo-backend/`. Bối cảnh kiến trúc xem `BE_architecture.md`; hợp đồng API xem `API_SPEC.md` — khi hai bên mâu thuẫn, ưu tiên `API_SPEC.md` cho request/response và `BE_architecture.md` cho cấu trúc code.

---

## 1. Tech stack cố định (không thay thế khi chưa cập nhật tài liệu)

- Node.js **LTS hiện hành** + **JavaScript thuần** (không TypeScript ở MVP).
- **Express.js**, **Zod**, **dotenv**, **`@google/genai`**, package manager **npm**.
- Không database, không session, không lưu state giữa các request — backend là proxy mỏng stateless.

## 2. Naming conventions

### 2.1 Files & folders

- Folder: chữ thường, số nhiều — `routes/`, `controllers/`, `services/`, `providers/`, `prompts/`, `schemas/`, `middlewares/`, `config/`.
- File: `camelCase` kèm **hậu tố vai trò** bắt buộc, đúng mẫu đã chốt:
  - `chat.route.js`, `music.route.js`
  - `chat.controller.js`, `music.controller.js`
  - `chat.service.js`, `music.service.js`
  - `gemini.provider.js`
  - `systemPrompt.js`, `responseSchema.js`
  - `chatRequest.schema.js`
  - `errorHandler.js`, `appSecret.js`
  - `env.js`, `index.js`, `app.js`
- Thêm file mới phải theo đúng mẫu `<tên>.<vai-trò>.js` và đặt đúng folder của layer đó.

### 2.2 Variables, functions, constants

- Biến/hàm: `camelCase` — `buildChatPrompt()`, `normalizeAction()`, `recentHistory`.
- Hàm trong provider/service/controller: **động từ mở đầu** (`validate`, `build`, `call`, `normalize`...).
- Hằng số cấu hình: `UPPER_SNAKE_CASE` — `GEMINI_API_KEY`, `DEFAULT_MODEL`, `REQUEST_TIMEOUT_MS`.
- Zod schema: `camelCase` + hậu tố `Schema` — `chatRequestSchema`, `musicRequestSchema`.
- Biến boolean: tiền tố `is`/`has`/`should` — `isFocusSessionActive`.
- Tên phải dùng **tiếng Anh**; chỉ comment mới dùng tiếng Việt.

## 3. Code style

### 3.1 Module system

- Dùng **ESM** (`import`/`export`) thống nhất toàn project, khai báo `"type": "module"` trong `package.json`. Không trộn `require()`.

### 3.2 Format (Prettier)

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100
}
```

### 3.3 ESLint (tối thiểu)

- `eslint:recommended` + các rule bắt buộc: `no-unused-vars`, `no-undef`, `eqeqeq: ["error", "always"]`, `no-var: error`, `prefer-const: error`, `no-console` chỉ ở mức `warn` (log đi qua logger, xem mục 4.3).

### 3.4 Import order (mỗi file, cách nhau 1 dòng trống)

1. Node built-ins (`node:crypto`...)
2. Package ngoài (`express`, `zod`, `@google/genai`...)
3. Internal theo chiều layer: `config/` → `schemas/` → `providers/` → `services/` → `controllers/` → `routes/`
4. Import tương đối cùng folder cuối cùng.

### 3.5 Comment style

- Comment **tiếng Việt ngắn gọn**, giải thích *lý do*, không nhại lại code.
- JSDoc cho mọi hàm export từ `services/` và `providers/` (tham số, kiểu trả về, lỗi có thể throw).
- Không comment-out code chết — xoá hẳn. Không để `TODO` không kèm ngữ cảnh.

## 4. Patterns bắt buộc

### 4.1 Luồng một chiều theo layer

`Route → Controller → Service → Provider → Gemini API`. Không được nhảy cóc layer (xem mục 5).

### 4.2 Error handling

- Mọi lỗi đi qua **`middlewares/errorHandler.js`** tập trung — controller/service **throw**, không tự `res.status(...)` khi lỗi.
- Response lỗi **luôn đúng shape** trong `API_SPEC.md` mục 2.2:

```json
{ "error": { "code": "INVALID_INPUT | GEMINI_ERROR | INTERNAL_ERROR", "message": "..." } }
```

- Mapping status cố định: validate fail → `400 INVALID_INPUT`; Gemini lỗi/timeout/từ chối → `502 GEMINI_ERROR`; còn lại → `500 INTERNAL_ERROR`.
- Lỗi từ `@google/genai` phải được bắt và chuẩn hoá **trong provider** (kèm timeout + retry nội bộ khi Gemini trả action thiếu field bắt buộc — xem `API_SPEC.md` mục 6) trước khi ném lên service.
- Async route/controller phải bọc lỗi (wrapper `asyncHandler` hoặc tương đương) để lỗi async luôn chảy vào `errorHandler`.

### 4.3 Logging

- Log qua **một logger dùng chung** (console có prefix mức `info`/`warn`/`error`), không rải `console.log` tuỳ tiện.
- Log đủ để debug: method + path, mã lỗi, thời gian gọi Gemini.
- **Không bao giờ log:** `GEMINI_API_KEY`, toàn bộ `memory_md`, `recent_history`, `audio_base64` (dữ liệu cá nhân của người dùng + payload lớn). Chỉ log độ dài/tóm tắt nếu cần.

### 4.4 Validation

- Mọi request body phải qua **Zod schema** trong `schemas/` trước khi chạm service — validate ở **controller**.
- Schema phải khớp **từng field** trong `API_SPEC.md` mục 3.1/4.1 (kể cả validate có điều kiện: `type = "audio"` thì `audio_base64` + `audio_mime` bắt buộc; `type = "text"` thì `text` bắt buộc).
- Validate fail → trả `400 INVALID_INPUT` với message ngắn gọn, dễ hiểu.

### 4.5 Config & secrets

- Đọc biến môi trường **chỉ qua `config/env.js`**, validate lúc khởi động — **fail sớm** nếu thiếu `GEMINI_API_KEY`, không để lỗi giữa chừng khi xử lý request.
- Cấm `process.env.*` rải rác ngoài `config/env.js`.

### 4.6 Gemini

- **`providers/gemini.provider.js` là nơi duy nhất** import/gọi `@google/genai` (model config, response schema, timeout, retry, lỗi mạng).
- Mọi response `/chat` phải qua **structured output** với schema ở `prompts/responseSchema.js`; service phải chuẩn hoá kết quả (vd ép `action.type = "none"` khi Gemini không chọn hành động).
- System prompt (`prompts/systemPrompt.js`) **luôn được ghép vào mọi request `/chat`**, gồm đủ: persona Tomo, guardrail an toàn tự hại, chỉ dẫn gán cảm xúc theo **nội dung lời nói** (không suy từ tông giọng), tiêu chí chấm `point_event` (xem `API_SPEC.md` mục 5.4).
- `/music-suggest` phải bật **Google Search grounding** để tránh link YouTube bịa; `found: false` vẫn trả `200`, không coi là lỗi.

## 5. Những thứ KHÔNG được làm

### 5.1 Anti-patterns kiến trúc

- ❌ Controller gọi thẳng `@google/genai` hoặc chứa business logic.
- ❌ Service tự parse HTTP request/response (`req`/`res` không được lọt xuống service/provider).
- ❌ Thêm database, ORM, session store, cache server-side — MVP stateless tuyệt đối (`ARCHITECTURE.md` mục 1).
- ❌ Biến global mutable chia sẻ giữa các request.
- ❌ Thêm endpoint mới khi chưa cập nhật `API_SPEC.md` (MVP chỉ có `POST /chat` và `POST /music-suggest`).

### 5.2 Deprecated / lỗi thời

- ❌ `@google/generative-ai` (SDK cũ, ngừng phát triển) — bắt buộc `@google/genai`.
- ❌ `require()`/CommonJS trộn lẫn ESM.
- ❌ `var`, callback lồng nhau — dùng `const`/`let`, `async/await`.
- ❌ Framework nặng hơn (NestJS...) hay TypeScript ở MVP.

### 5.3 Security risks

- ❌ Tuyệt đối không để `GEMINI_API_KEY` lộ ra client: không trả trong response, không log, không commit `.env` (chỉ commit `.env.example`).
- ❌ Không hard-code secret trong code — luôn qua `config/env.js` + dotenv.
- ❌ Không bỏ guardrail nội dung tự hại khỏi system prompt của **bất kỳ** request `/chat` nào (yêu cầu an toàn bắt buộc, không phụ thuộc filter phía client).
- ❌ Không kích hoạt `middlewares/appSecret.js` ở giai đoạn dev local hiện tại — đúng lộ trình bảo mật theo giai đoạn ở `ARCHITECTURE.md` mục 7.1 (khi nào kích hoạt phải cập nhật `API_SPEC.md` mục 1).
- ❌ Không trust dữ liệu client gửi lên — mọi thứ qua Zod trước.
