# TOMO — Frontend Coding Rules (MVP)

> **Mục đích:** để AI/dev code app client đúng style và nhất quán với kiến trúc đã chốt. File này là **luật bắt buộc** khi sinh/sửa code trong `tomo-app/`. Bối cảnh kiến trúc xem `FE_architecture.md`; hợp đồng API xem `API_SPEC.md`; luồng use case xem `tomo-mvp-requirements.md`.

---

## 1. Tech stack cố định (không thay thế khi chưa cập nhật tài liệu)

- **React Native + Expo Dev Client** (không dùng Expo Go — cần Native Module tuỳ chỉnh).
- **JavaScript thuần** (không bắt buộc TypeScript ở MVP).
- `@react-navigation/native`, `axios`, **Zustand**, `expo-audio`, `expo-speech`, `expo-file-system`.
- Native Module **Kotlin** chỉ cho 3 thứ JS không làm được: overlay chat-head, foreground service `SCREEN_ON`, `OverlayChatActivity` — giao tiếp qua `TomoNativeModule`.

## 2. Naming conventions

### 2.1 Files & folders

- Screen/Component: **`PascalCase.jsx`** — `ChatScreen.jsx`, `OnboardingScreen.jsx`, `TomoAvatar.jsx`, `MicButton.jsx`.
- Hook: **`camelCase.js`, tiền tố `use`** — `useChat.js`, `useVoiceRecorder.js`, `useTts.js`, `useMemory.js`.
- Service: **`camelCase.js` + hậu tố vai trò** — `chatApi.js`, `musicApi.js`, `memoryStorage.js`, `historyStorage.js`, `appStateStorage.js`, `overlayBridge.js`.
- Store: `useAppStore.js` (Zustand); actions: `actionExecutor.js`; constants: `config.js`.
- Kotlin: **`PascalCase.kt`** — `OverlayService.kt`, `OverlayChatActivity.kt`, `FocusTrackingService.kt`, `TomoNativeModule.kt`.
- File mới phải đặt đúng folder của layer (`screens/`, `components/`, `hooks/`, `services/{api,storage,native}/`, `actions/`, `store/`, `constants/`).

### 2.2 Variables, functions, components

- Component: `PascalCase` — `ChatBubble`, `MicButton`.
- Biến/hàm: `camelCase`; hàm xử lý sự kiện: `handle<Event>` — `handleSend`, `handleMicPress`.
- Boolean: tiền tố `is`/`has`/`should` — `isRecording`, `shouldSpeak`.
- Hằng số cấu hình (trong `constants/config.js`): `UPPER_SNAKE_CASE` — `BASE_URL`, `REQUEST_TIMEOUT_MS`, `MEMORY_FILE_NAME`.
- Tên code dùng **tiếng Anh**; comment được dùng tiếng Việt.

## 3. Code style

### 3.1 Component

- Chỉ **function component + hooks** — cấm class component.
- Component giữ vai trò **"dumb"**: nhận props, render UI, gọi hàm từ hook — không chứa logic gọi API/storage/native.
- Style bằng **`StyleSheet.create`** đặt cuối file — không inline style rải rác trong JSX (trừ giá trị động bắt buộc).

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

- `eslint:recommended` + `plugin:react-hooks/recommended` (bắt buộc tuân thủ rules-of-hooks, đủ deps trong `useEffect`); `no-unused-vars`, `eqeqeq`, `no-var`, `prefer-const`.

### 3.4 Import order (mỗi file, cách nhau 1 dòng trống)

1. `react` / `react-native`
2. Thư viện ngoài (`@react-navigation/*`, `axios`, `zustand`, `expo-*`...)
3. `hooks/` → `services/` → `store/` → `actions/`
4. `components/`, `constants/`
5. Assets (ảnh, animation)

### 3.5 Comment style

- Comment **tiếng Việt ngắn gọn**, giải thích *lý do* (đặc biệt các đoạn liên quan quyền Android, lifecycle overlay/focus service).
- JSDoc cho mọi hàm export trong `services/` và `hooks/`.
- Không comment-out code chết, không `TODO` trống không.

## 4. Patterns bắt buộc

### 4.1 Luồng một chiều theo layer

`Component → Hook → Service (API / Storage / Native Bridge) → nguồn dữ liệu thật`, và `Hook → actionExecutor` khi response có `action`. Chi tiết trách nhiệm từng lớp xem `FE_architecture.md` mục 3.2.

### 4.2 Gọi API

- Mọi call REST đi qua `services/api/` bằng **axios instance chung** (base URL + timeout lấy từ `constants/config.js`).
- Request `/chat` **luôn mang đủ ngữ cảnh** theo `API_SPEC.md` mục 3.1: `memory_md` (từ `useMemory`), `recent_history` (từ `historyStorage`), `session_context` (`focus_session_active`, `evolution_stage`, `evolution_points` từ `useAppStore`). Backend stateless — không bao giờ giả định backend "nhớ" gì.
- Xử lý lỗi theo `error.code` từ backend: `GEMINI_ERROR`/mất mạng → Tomo báo lỗi nhẹ nhàng bằng text/giọng, **giữ nguyên tin nhắn/file ghi âm để gửi lại** (UC-04 luồng thay thế 3a).

### 4.3 Hook

- Hook giữ **state cục bộ + loading + error**, expose `{ data, loading, error, ...actions }` cho component.
- Mỗi hook chỉ gọi xuống 1–2 service tương ứng — không gọi thẳng `axios`/`expo-file-system`/native module trong hook hay component.

### 4.4 Storage local

- Đọc/ghi 3 file `memory.md`, `chat_history.jsonl`, `app_state.json` **chỉ qua** `services/storage/` tương ứng, dùng thống nhất `expo-file-system`.
- `new_facts` từ response `/chat` được append/merge vào `memory.md` ngay trong luồng `useChat` (xung đột đơn giản → ghi đè bản mới nhất); mọi tin nhắn append vào `chat_history.jsonl`.

### 4.5 Native bridge

- Gọi Kotlin **chỉ qua `services/native/overlayBridge.js`** — component/hook không import native module trực tiếp.
- `OnboardingScreen` quản lý toàn bộ luồng xin quyền nhiều bước (mic → overlay → notification) bằng state bước nội bộ; từ chối quyền → ghi nhận và tiếp tục, không chặn luồng (UC-01 luồng thay thế 3a); hoàn tất → set cờ `onboarded` trong `app_state.json`.

### 4.6 Action Executor & điểm tiến hoá

- Mọi `action` từ response `/chat` phải đi qua `actions/actionExecutor.js` (`switch` theo `action.type`): `set_animation` → đổi animation; `start_focus_session`/`end_focus_session` → `overlayBridge` + focus service; `suggest_music` → hiện nút [Có]/[Thôi] rồi mới gọi `musicApi`; `propose_schedule` → thẻ xác nhận rồi mở Intent `AlarmClock`/`CalendarContract`; `none` → không làm gì.
- Cộng **+1 điểm tiến hoá + toast "+1 kết nối 💙"** khi `point_event = "emotional_share"` **hoặc** `action.type = "end_focus_session"` (MVP không chống farm — `API_SPEC.md` mục 5.4). Mốc tiến hoá: stage 2 ở 10 điểm, stage 3 ở 30 điểm.
- `/music-suggest` chỉ được gọi **sau khi** người dùng bấm [Có]; `found: false` → hiển thị thông báo nhẹ nhàng, không mở Intent; lỗi mở link YouTube → retry tối đa 2 lần (UC-12).
- Audio push-to-talk: ghi bằng `expo-audio` (`useVoiceRecorder`), gửi **audio thô base64** lên `/chat` — không STT trên client. TTS phát bằng `expo-speech` (`useTts`) khi `should_speak = true`.

## 5. Những thứ KHÔNG được làm

### 5.1 Anti-patterns kiến trúc

- ❌ Component gọi trực tiếp `axios`, `expo-file-system`, `expo-speech`, hay native module — phải qua hook/service.
- ❌ Service chứa state React hay biết component nào đang gọi nó.
- ❌ Component/hook tự diễn giải `action.type` ngoài `actionExecutor.js`.
- ❌ Prop-drilling state toàn cục (điểm tiến hoá, stage, cờ overlay) — dùng Zustand store.
- ❌ Redux/MobX hay event bus/pub-sub riêng ở MVP — Zustand đã đủ (`FE_architecture.md` mục 4.2).
- ❌ Nhúng React Native view vào cửa sổ overlay — màn chat dạng nổi là `OverlayChatActivity` (activity RN thứ hai, nền trong suốt), quyết định có chủ đích (`FE_architecture.md` mục 1.2).

### 5.2 Deprecated / lỗi thời

- ❌ `expo-av` (đã deprecated) — dùng `expo-audio`.
- ❌ Android `SpeechRecognizer` (STT client-side) — audio thô gửi thẳng backend, Gemini hiểu trực tiếp (quyết định #12, `tomo-mvp-requirements.md` mục 6).
- ❌ Gemini Live API / Gemini TTS / wake-word always-listening — MVP dùng push-to-talk từng lượt + TTS mặc định của máy (`ARCHITECTURE.md` mục 8).
- ❌ AsyncStorage cho 3 file dữ liệu local — một cơ chế lưu trữ duy nhất là `expo-file-system`.
- ❌ TypeScript, class component, `var`.
- ❌ Chạy thử bằng Expo Go (không hỗ trợ Native Module tuỳ chỉnh) — bắt buộc Expo Dev Client (`FE_architecture.md` mục 1.1).

### 5.3 Security & privacy risks

- ❌ Tuyệt đối **không nhúng Gemini API key** trong client, không gọi thẳng Gemini API — mọi call AI đi qua backend (`ARCHITECTURE.md` mục 7).
- ❌ Không gửi toàn bộ `chat_history.jsonl` lên backend — chỉ 20 tin nhắn gần nhất (`RECENT_HISTORY_LIMIT` trong `constants/config.js`).
- ❌ Không hard-code URL backend — luôn qua `constants/config.js`.
- ❌ Không thêm header auth/app-secret ở giai đoạn dev local hiện tại — theo đúng lộ trình bảo mật `ARCHITECTURE.md` mục 7.1.
- ❌ Không giả định đã có quyền overlay/mic/notification — luôn kiểm tra và dẫn người dùng đến Settings khi thiếu (UC-02 luồng thay thế 2a).
