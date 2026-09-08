# TOMO — Project Roadmap (MVP)

> Roadmap cấp phase/milestone cho bản MVP. Thứ tự phase bám theo "Đề xuất thứ tự build MVP" (M1–M5) trong `tomo-mvp-requirements.md` mục 7, bổ sung Phase 0 (foundation) ở đầu và Phase 7 (hardening) ở cuối. Các gap G1–G8 tham chiếu từ `doc_ana.md` mục 4.

> **Quy ước Acceptance**: Mỗi phase ghi rõ ai kiểm tra gì.
> - 🤖 **Agent** — coding agent tự chạy/xác nhận được (lệnh CLI, request API, đọc log, kiểm tra file output, lint, build).
> - 👤 **Con người** — cần mắt/tay người thật trên thiết bị thật hoặc đánh giá chủ quan (UI/UX, tương tác vật lý, chất lượng ngôn ngữ tự nhiên, hành vi trên máy OEM).

---

## Phase 0 — Foundation & chốt các câu hỏi mở

Goal:
Môi trường dev của cả backend lẫn app sẵn sàng; các quyết định nhỏ còn treo được chốt trước khi code để tránh sửa hợp đồng giữa chừng.

Dependencies:
Không.

Cần đọc — tài liệu:
- [BE_architecture.md](BE_architecture.md) — toàn bộ; đặc biệt mục 1.3 (tech stack), 2.1 (folder structure), 3 (layer architecture)
- [BE_rules.md](BE_rules.md) — toàn bộ mục 1–5
- [FE_architecture.md](FE_architecture.md) — toàn bộ; đặc biệt mục 1.1–1.3 (Expo Dev Client, native module Kotlin), 2.1 (folder structure)
- [FE_rules.md](FE_rules.md) — toàn bộ mục 1–5
- [API_SPEC.md](API_SPEC.md) — mục 3.1 (G4: N của `recent_history`), 5.2 + 5.3 (G5/G6: mapping animation, tập nhãn cảm xúc), mục 4 (spike Search grounding)
- [ARCHITECTURE.md](ARCHITECTURE.md) — mục 6.4 (Google Search grounding), 7.1 (lộ trình bảo mật)
- [tomo-mvp-requirements.md](tomo-mvp-requirements.md) — mục 6 (12 quyết định đã chốt), F1/UC-01 (G8), F7/UC-12 (spike grounding)

Cần đọc — code:
- Không có — phase này scaffold code mới từ đầu, chưa có code để đọc.

Tasks:
- Scaffold `tomo-backend/` (Express, ESM, Zod, dotenv, `@google/genai`, eslint/prettier) theo đúng cấu trúc `BE_architecture.md`
- Scaffold `tomo-app/` (Expo Dev Client, navigation, Zustand, axios, eslint/prettier) theo đúng cấu trúc `FE_architecture.md`
- Kiểm tra Node LTS hiện hành; cấu hình `config/env.js` fail-fast khi thiếu `GEMINI_API_KEY`
- Build thử Dev Client lên máy Android thật (xác nhận pipeline native sẵn sàng cho module Kotlin sau này)
- [x] Chốt các gap rẻ, sớm: G4 (`RECENT_HISTORY_LIMIT = 20`), G5 + G6 (mapping ASCII với fallback `idle`, enum MVP giữ 4 nhãn + null), G8 (onboarding hỏi tên bằng scripted local)
- Spike nhỏ: xác nhận Google Search grounding hoạt động với `@google/genai` (phục vụ F7)

Acceptance:

🤖 Agent:
- `npm start` (hoặc `node src/index.js`) backend thành công, không crash
- Xoá `GEMINI_API_KEY` khỏi `.env` → backend in lỗi rõ ràng và thoát (exit code ≠ 0)
- Chạy `npx expo prebuild` không lỗi; `eslint` + `prettier --check` pass cả 2 repo
- Spike Search grounding: chạy script gọi `@google/genai` với `tools: [{ googleSearch: {} }]` → nhận response hợp lệ (log ra terminal)
- G4/G5/G6/G8 có quyết định bằng văn bản — kiểm tra diff/nội dung `API_SPEC.md` chứa giá trị đã chốt

👤 Con người:
- Build Dev Client lên máy Android thật → app mở được (màn trống, không crash) — cần thiết bị vật lý
- Đọc lại các quyết định G4/G5/G6/G8 đã ghi — xác nhận đúng ý định sản phẩm

---

## Phase 1 — Backend lõi `/chat` (text)

Goal:
Endpoint `POST /chat` hoạt động end-to-end với input text: validate → ghép prompt → Gemini structured output → response đúng hợp đồng.

Dependencies:
Phase 0 (cần `GEMINI_API_KEY`).

Cần đọc — tài liệu:
- [API_SPEC.md](API_SPEC.md) — toàn bộ mục 1, 2 (status code + format lỗi), 3 (toàn bộ hợp đồng `/chat`), 5 (đối tượng dùng chung), 6 (ghi chú triển khai)
- [BE_architecture.md](BE_architecture.md) — mục 2.1, 2.2 (folder structure), 3 (layer architecture + bảng trách nhiệm), 4.1 (REST + format lỗi)
- [BE_rules.md](BE_rules.md) — mục 1, 2, 3, 4 (đặc biệt 4.2 error handling, 4.3 logging, 4.4 validation, 4.5 config, 4.6 Gemini), 5
- [ARCHITECTURE.md](ARCHITECTURE.md) — mục 1 (nguyên tắc), 4 (hợp đồng + việc backend làm bên trong), 7 (guardrail tự hại)
- [tomo-mvp-requirements.md](tomo-mvp-requirements.md) — UC-05 luồng thay thế 3a (kịch bản an toàn tự hại), quyết định #8 (Gemini)

Cần đọc — code:
- `tomo-backend/src/index.js`, `tomo-backend/src/app.js` — skeleton từ Phase 0 (nơi mount route + middleware)
- `tomo-backend/src/config/env.js` — đọc/validate `GEMINI_API_KEY`
- `tomo-backend/package.json` — deps và scripts đã scaffold

Tasks:
- Zod schema validate request (`chatRequest.schema.js`) khớp từng field `API_SPEC.md` mục 3.1
- System prompt (persona Tomo, guardrail tự hại, gán cảm xúc theo nội dung, tiêu chí `point_event`) + response schema structured output
- `gemini.provider.js` (timeout, retry nội bộ khi action thiếu field, chuẩn hoá lỗi) → `chat.service.js` → `chat.controller.js` → `chat.route.js`
- `middlewares/errorHandler.js` với mapping 400/502/500 đúng format lỗi chuẩn

Acceptance:

🤖 Agent:
- `curl POST /chat` với body text hợp lệ → response JSON chứa đủ 6 field (`reply_text`, `emotion_label`, `action`, `new_facts`, `should_speak`, `point_event`) đúng kiểu dữ liệu
- Request thiếu `message` hoặc `input.type` → HTTP 400 với `{ error: "INVALID_INPUT", ... }`
- Mock/stub Gemini trả lỗi → HTTP 502 với `{ error: "GEMINI_ERROR", ... }`
- `action` luôn có ít nhất `{ type: "none" }` khi Gemini không đề xuất action
- `eslint` pass toàn bộ backend code

👤 Con người:
- Gửi vài câu chat thật (tiếng Việt, nhiều ngữ cảnh) → đọc `reply_text` kiểm tra giọng văn Tomo tự nhiên, đúng persona
- Gửi input nguy hiểm (ám chỉ tự hại) → xác nhận guardrail kích hoạt, Tomo phản hồi phù hợp và nhạy cảm (đánh giá chủ quan, không thể tự động)

---

## Phase 2 — Client chat lõi + memory + điểm tiến hoá (M1)

Goal:
Người dùng chat text với Tomo trong app; memory và lịch sử lưu local; cộng điểm tiến hoá cơ bản. Tương ứng M1 (F3, F4 rút gọn) — milestone demo đầu tiên.

Dependencies:
Phase 0, Phase 1.

Cần đọc — tài liệu:
- [FE_architecture.md](FE_architecture.md) — toàn bộ mục 2, 3 (layer architecture + luồng dữ liệu ví dụ), 4 (communication)
- [FE_rules.md](FE_rules.md) — toàn bộ mục 1–5 (đặc biệt 4.1–4.4, 4.6: gọi API kèm đủ ngữ cảnh, merge `new_facts`, cộng điểm)
- [API_SPEC.md](API_SPEC.md) — mục 3.1, 3.2, 3.3 (hợp đồng `/chat`), 5.1 (`HistoryMessage`), 5.2 (`set_animation`, `none`), 5.3 (`emotion_label`), 5.4 (`point_event`)
- [ARCHITECTURE.md](ARCHITECTURE.md) — mục 3 (3 file local), 6.1 (luồng chat text), 6.5 (cập nhật memory)
- [tomo-mvp-requirements.md](tomo-mvp-requirements.md) — F3/UC-05, F4/UC-06, F8/UC-13 (phần cộng điểm + toast), UC-04 luồng thay thế 3a (giữ tin nhắn khi lỗi)

Cần đọc — code:
- `tomo-app/src/App.jsx`, `tomo-app/app.config.js`, `tomo-app/package.json` — skeleton từ Phase 0
- `tomo-app/src/constants/config.js` — BASE_URL, timeout, tên file local
- Không cần đọc code backend — hợp đồng response đã đủ ở `API_SPEC.md` mục 3.2

Tasks:
- 3 storage service (`memoryStorage`, `historyStorage`, `appStateStorage`) + `chatApi` (axios instance chung)
- `useChat`, `useMemory`, `useAppStore` (điểm/stage) — request luôn mang đủ `memory_md` + `recent_history` + `session_context`
- `ChatScreen` + `ChatBubble` (text only), `TomoAvatar` với placeholder asset
- `actionExecutor`: xử lý `set_animation` + `none` trước; cộng +1 điểm + toast "+1 kết nối 💙" khi `point_event = "emotional_share"`
- Append/merge `new_facts` vào `memory.md`; append mọi tin nhắn vào `chat_history.jsonl`
- Xử lý lỗi nhẹ nhàng (mất mạng/`GEMINI_ERROR`), giữ nguyên tin nhắn để gửi lại

Acceptance:

🤖 Agent:
- `npx expo start` không lỗi; `eslint` pass toàn bộ FE code
- Sau khi gửi 1 tin nhắn qua API, kiểm tra file `memory.md` và `chat_history.jsonl` tồn tại và có nội dung mới (đọc file bằng script)
- Request mang đủ 3 field `memory_md`, `recent_history`, `session_context` — kiểm tra bằng log backend hoặc mock server
- `actionExecutor` nhận `point_event = "emotional_share"` → `useAppStore` tăng điểm +1 (kiểm tra bằng unit test hoặc log state)
- Tắt wifi/backend → gọi API → hàm xử lý lỗi trả đúng trạng thái, tin nhắn không bị xoá khỏi state

👤 Con người:
- Mở app trên thiết bị → gõ tin nhắn → `reply_text` hiển thị trong bubble, avatar đổi animation theo `set_animation` — kiểm tra trực quan
- Chia sẻ cảm xúc → thấy toast "+1 kết nối 💙" hiện trên màn hình — kiểm tra trực quan
- Tắt wifi → gửi tin → thấy thông báo lỗi nhẹ nhàng (không crash, tin nhắn vẫn còn) — kiểm tra trực quan
- Chat vài lượt → Tomo nhắc lại thông tin đã lưu từ `memory.md` (cá nhân hoá) — đánh giá chủ quan

---

## Phase 3 — Onboarding & Overlay (M2)

Goal:
Luồng thiết lập lần đầu hoàn chỉnh; Tomo hiện diện dạng chat-head overlay và mở được màn chat nổi. Tương ứng M2 (F1, F2).

Dependencies:
Phase 2; quyết định G8 đã chốt ở Phase 0.

Cần đọc — tài liệu:
- [tomo-mvp-requirements.md](tomo-mvp-requirements.md) — F1/UC-01 (onboarding nhiều bước), F2/UC-02, UC-03 (tương tác chat-head), UC-04 (chat từ overlay) + yêu cầu phi chức năng F2
- [FE_architecture.md](FE_architecture.md) — mục 1.1, 1.2 (kiến trúc overlay + `OverlayChatActivity`), 2.1 (phần `android/` + `OnboardingScreen`), 2.2, 4.2 (JS ↔ native bridge)
- [FE_rules.md](FE_rules.md) — mục 2.1 (naming Kotlin), 4.5 (native bridge + onboarding), 5.1 (không nhúng RN view vào overlay), 5.3 (quyền)
- [ARCHITECTURE.md](ARCHITECTURE.md) — mục 3 (cờ `onboarded`, cờ overlay trong `app_state.json`)
- [API_SPEC.md](API_SPEC.md) — mục 3 (màn chat nổi dùng chung hợp đồng `/chat`)

Cần đọc — code:
- `tomo-app/src/App.jsx` — thêm chọn stack Onboarding/Main theo cờ `onboarded`
- `tomo-app/src/screens/ChatScreen.jsx` — dùng lại cho màn chat nổi
- `tomo-app/src/hooks/useChat.js` + `tomo-app/src/services/api/chatApi.js` — luồng chat dùng chung giữa app và overlay
- `tomo-app/src/services/storage/appStateStorage.js` — đọc/ghi cờ `onboarded` + trạng thái overlay
- `tomo-app/src/store/useAppStore.js` — cờ overlay bật/tắt
- `tomo-app/src/constants/config.js` — cấu hình chung
- `tomo-app/app.config.js` — khai báo quyền SYSTEM_ALERT_WINDOW, RECORD_AUDIO, POST_NOTIFICATIONS

Tasks:
- `OnboardingScreen` một màn nhiều bước (chào → nhập tên → xin lần lượt quyền mic → overlay → notification), từ chối quyền vẫn cho tiếp tục; set cờ `onboarded`
- `App.jsx` chọn stack Onboarding/Main theo cờ `onboarded`; `SettingsScreen` bật/tắt overlay + nút dẫn lại Settings hệ thống
- Native module Kotlin: `OverlayService.kt` (chat-head tĩnh, kéo-thả, hút cạnh, vùng × để đóng), `TomoNativeModule.kt`, `overlayBridge.js`
- `OverlayChatActivity.kt` (activity RN nền trong suốt) hiển thị màn chat nổi khi tap chat-head — dùng chung stack chat với app chính (cùng một lịch sử)

Acceptance:

🤖 Agent:
- `npx expo prebuild` + Gradle build thành công (không lỗi compile Kotlin)
- `eslint` pass toàn bộ code JS/TS mới
- `app_state.json` chứa `"onboarded": true` sau khi chạy qua luồng onboarding — kiểm tra bằng script đọc file
- Cờ overlay bật/tắt được lưu đúng trong `app_state.json` — kiểm tra bằng script đọc file
- Code Kotlin compile không warning nghiêm trọng (kiểm tra Gradle build log)

👤 Con người:
- Cài mới (xoá data) → mở app → đi qua toàn bộ onboarding → vào chat — kiểm tra luồng mượt, UI rõ ràng
- Từ chối quyền overlay → vẫn vào được chat (không bị chặn) — kiểm tra trên thiết bị
- Mở lại app → vào thẳng chat (không hiện onboarding lại) — kiểm tra trên thiết bị
- Overlay hiện đè lên app khác (Chrome, YouTube...), kéo-thả mượt, hút cạnh đúng, kéo vào vùng × để đóng — kiểm tra tương tác vật lý
- Tap chat-head → mở màn chat nổi → chat text được, lịch sử đồng bộ với app chính — kiểm tra trực quan
- Settings: bật/tắt overlay → trạng thái phản ánh đúng — kiểm tra trên thiết bị

---

## Phase 4 — Voice push-to-talk & TTS (M3)

Goal:
Nói chuyện bằng giọng nói trong app lẫn màn chat nổi: ghi âm → gửi audio thô lên backend → Gemini hiểu trực tiếp → Tomo trả lời text + giọng nói. Tương ứng M3 (F2/F3 nâng cấp).

Dependencies:
Phase 1, Phase 2, Phase 3.

Cần đọc — tài liệu:
- [tomo-mvp-requirements.md](tomo-mvp-requirements.md) — UC-04 (voice từ overlay), UC-05, quyết định #5 (TTS mặc định máy), #12 (audio thô → Gemini); F2 (animation mở miệng khi phản hồi); mục 5 hàng "Mic khi đang overlay"
- [ARCHITECTURE.md](ARCHITECTURE.md) — mục 6.2 (luồng voice đầy đủ + lưu ý cảm xúc theo nội dung), 8 (không Live API/Gemini TTS), 9.1
- [API_SPEC.md](API_SPEC.md) — mục 3.1 (field audio: `audio_base64`, `audio_mime`), 3.2 (`should_speak`), 3.3 (lỗi audio)
- [BE_architecture.md](BE_architecture.md) — mục 2.1, 3 (vị trí xử lý audio trong layer)
- [BE_rules.md](BE_rules.md) — mục 4.4 (validate có điều kiện theo `input.type`), 4.6
- [FE_architecture.md](FE_architecture.md) — mục 1.3 (hàng `expo-audio`, `expo-speech`)
- [FE_rules.md](FE_rules.md) — mục 4.6 (audio push-to-talk gửi base64, TTS khi `should_speak`), 5.2 (cấm `expo-av`, cấm SpeechRecognizer)

Cần đọc — code:
- Backend (từ Phase 1): `src/schemas/chatRequest.schema.js` (thêm validate có điều kiện), `src/controllers/chat.controller.js`, `src/services/chat.service.js`, `src/providers/gemini.provider.js` (đưa audio vào Gemini), `src/prompts/systemPrompt.js` (chỉ dẫn gán cảm xúc theo nội dung)
- FE (từ Phase 2–3): `src/screens/ChatScreen.jsx`, `src/hooks/useChat.js`, `src/services/api/chatApi.js`, `src/components/TomoAvatar.jsx` (animation nói), `src/actions/actionExecutor.js`
- Native (từ Phase 3): `android/.../OverlayService.kt` (animation mở miệng trên chat-head), `android/.../TomoNativeModule.kt` + `src/services/native/overlayBridge.js` (đổi animation qua bridge)

Tasks:
- Backend: mở rộng xử lý `input.type = "audio"` (validate `audio_base64`/`audio_mime` có điều kiện, đưa audio vào Gemini)
- `useVoiceRecorder` (bọc `expo-audio`) + `MicButton` nhấn-giữ; `useTts` (bọc `expo-speech`) phát khi `should_speak = true`
- Animation "mở miệng" trong lúc TTS phát (cả chat-head lẫn avatar trong app); lỗi → giữ file ghi âm để gửi lại

Acceptance:

🤖 Agent:
- `curl POST /chat` với `input.type = "audio"` + `audio_base64` hợp lệ → response JSON đủ 6 field, `should_speak = true`
- `curl POST /chat` với `input.type = "audio"` nhưng thiếu `audio_base64` → HTTP 400 `INVALID_INPUT`
- `eslint` pass toàn bộ code mới (backend + FE)
- Gradle build thành công sau khi sửa Kotlin (nếu có thay đổi native)

👤 Con người:
- Nhấn-giữ mic, nói tiếng Việt → Tomo trả lời đúng nội dung, TTS phát giọng Việt rõ ràng — kiểm tra trên thiết bị
- Animation "mở miệng" chạy đúng lúc TTS phát (cả avatar trong app và chat-head overlay) — kiểm tra trực quan
- Nói câu mơ hồ/không rõ → Tomo hỏi lại thay vì bịa nội dung — đánh giá chủ quan
- Mất mạng giữa chừng → bản ghi âm được giữ, có thể gửi lại — kiểm tra trên thiết bị
- Cảm xúc Tomo phản hồi suy từ nội dung lời nói (không phải giọng điệu) — đánh giá chủ quan

---

## Phase 5 — Đồng hành làm việc: lịch/báo thức + Focus mode (M4)

Goal:
Đặt báo thức/sự kiện qua app hệ thống; phiên focus với nhắc khi bật màn hình và ăn mừng kết thúc. Tương ứng M4 (F5, F6).

Dependencies:
Phase 3 (hạ tầng native service); **phải chốt trước:** G3 (thời gian hiện tại trong request), G1 (action tắt nhắc/tạm dừng), G2 (cơ chế cache câu nhắc), G7 (cơ chế "thỉnh thoảng hỏi") — cập nhật `API_SPEC.md` trước khi code.

Cần đọc — tài liệu:
- [tomo-mvp-requirements.md](tomo-mvp-requirements.md) — F5/UC-08 (đặt lịch qua Intent), F6/UC-09, UC-10, UC-11 (focus mode), quyết định #3, #4; mục 5 hàng "Nhắc khi bật màn hình"
- [API_SPEC.md](API_SPEC.md) — mục 5.2 (`propose_schedule`, `start_focus_session`, `end_focus_session`), 5.4 (điểm từ `end_focus_session`), 6 (retry nội bộ khi thiếu field), 3.1 (`session_context.focus_session_active`) — **bao gồm cả phần cập nhật mới sau khi chốt G1/G2/G3**
- [ARCHITECTURE.md](ARCHITECTURE.md) — mục 5 (bảng action), 6.3 (câu nhắc focus xử lý local, cache trong phiên)
- [FE_architecture.md](FE_architecture.md) — mục 1.1 (foreground service), 1.3 (hàng "Mở Intent hệ thống"), 2.1 (`FocusTrackingService.kt`)
- [FE_rules.md](FE_rules.md) — mục 4.5 (native bridge), 4.6 (action focus + Intent + cộng điểm)
- [BE_rules.md](BE_rules.md) — mục 4.6 (retry khi Gemini trả action thiếu field)

Cần đọc — code:
- Backend (từ Phase 1): `src/providers/gemini.provider.js` (retry khi `propose_schedule` thiếu field), `src/services/chat.service.js`, `src/prompts/responseSchema.js` + `src/prompts/systemPrompt.js` (cập nhật nếu G1 mở rộng enum action)
- FE (từ Phase 2–3): `src/actions/actionExecutor.js`, `src/services/native/overlayBridge.js`, `src/store/useAppStore.js` (`focus_session_active` đưa vào `session_context`), `src/hooks/useChat.js`, `src/screens/ChatScreen.jsx`, `src/components/TomoAvatar.jsx`, `src/services/storage/appStateStorage.js`
- Native (từ Phase 3): `android/.../OverlayService.kt`, `android/.../TomoNativeModule.kt` (thêm API điều khiển focus service)

Tasks:
- Quyết định thư viện Intent (JS cộng đồng hay native module nhỏ) cho `AlarmClock`/`CalendarContract`
- `actionExecutor`: `propose_schedule` → thẻ xác nhận → mở Intent điền sẵn; `start_focus_session`/`end_focus_session` → `overlayBridge` + focus service
- `FocusTrackingService.kt`: foreground service bắt `SCREEN_ON`, giới hạn tần suất nhắc (mặc định 5 phút), không nhắc khi đang trong app Tomo
- Câu nhắc trong phiên theo cơ chế đã chốt ở G2; +1 điểm + animation ăn mừng khi `end_focus_session`
- Hướng dẫn người dùng tắt tối ưu pin cho app (giảm rủi ro OEM giết service)

Acceptance:

🤖 Agent:
- `curl POST /chat` với message "7h sáng mai đặt báo thức" → response chứa `action.type = "propose_schedule"` với đủ field `title`, `time` — kiểm tra JSON
- Backend retry: mock Gemini trả `propose_schedule` thiếu `time` → retry nội bộ thành công hoặc trả fallback hợp lệ
- `eslint` pass; Gradle build thành công
- `session_context.focus_session_active` được gửi đúng trong request khi phiên focus đang bật — kiểm tra log backend
- `app_state.json` cập nhật `focus_session_active` đúng khi bắt đầu/kết thúc phiên — kiểm tra bằng script đọc file

👤 Con người:
- Nói "7h sáng mai đặt báo thức" → thẻ xác nhận hiện lên → bấm xác nhận → app Đồng hồ mở với giờ điền sẵn — kiểm tra trên thiết bị
- Tương tự với sự kiện lịch → app Calendar mở điền sẵn — kiểm tra trên thiết bị
- Bắt đầu phiên focus → avatar đổi animation (app + chat-head) — kiểm tra trực quan
- Trong phiên focus, bật màn hình → nhắc xuất hiện nhưng không quá dày (≤ 1 lần/5 phút) — kiểm tra trên thiết bị, cần đợi thời gian thực
- Nói "làm xong rồi" → animation ăn mừng + toast +1 điểm — kiểm tra trực quan
- Lịch trình được ghi vào memory → lượt chat sau Tomo nhắc lại — đánh giá chủ quan

---

## Phase 6 — Cảm xúc & tiến hoá: nhạc + màn tiến độ + hoàn thiện memory (M5)

Goal:
Gợi ý nhạc theo mood qua YouTube; hệ thống tiến hoá đầy đủ với màn "Hành trình của Tomo"; quản lý memory. Tương ứng M5 (F7, F8, F4 hoàn thiện).

Dependencies:
Phase 2 (điểm tiến hoá đã cộng), Phase 1; spike Search grounding ở Phase 0 đã xác nhận khả dụng.

Cần đọc — tài liệu:
- [tomo-mvp-requirements.md](tomo-mvp-requirements.md) — F7/UC-12 (gợi ý nhạc), F8/UC-13 (tiến hoá + màn tiến độ), F4/UC-06 + UC-07 (quản lý memory), quyết định #1 (nguồn nhạc), #11 (mốc điểm)
- [API_SPEC.md](API_SPEC.md) — mục 4 (toàn bộ hợp đồng `/music-suggest`), 5.2 (`suggest_music`), 5.4, mục 2 (format lỗi, `found:false` vẫn là 200)
- [ARCHITECTURE.md](ARCHITECTURE.md) — mục 6.4 (luồng music-suggest), 6.5 (memory), 7 (minh bạch dữ liệu plaintext với người dùng)
- [BE_architecture.md](BE_architecture.md) — mục 2.1 (các file `music.route/controller/service.js`)
- [BE_rules.md](BE_rules.md) — mục 4.6 (`/music-suggest` bắt buộc bật Google Search grounding)
- [FE_rules.md](FE_rules.md) — mục 4.4 (storage), 4.6 (luồng `suggest_music`: nút [Có]/[Thôi] → `musicApi` → mở link, retry 2 lần)

Cần đọc — code:
- Backend (từ Phase 1, làm mẫu cho pipeline mới): `src/routes/chat.route.js`, `src/controllers/chat.controller.js`, `src/services/chat.service.js`, `src/providers/gemini.provider.js`, `src/schemas/chatRequest.schema.js`, `src/middlewares/errorHandler.js`, `src/app.js` (mount `music.route.js`)
- FE (từ Phase 2–5): `src/actions/actionExecutor.js`, `src/services/api/chatApi.js` (mẫu cho `musicApi.js`), `src/hooks/useChat.js`, `src/screens/ChatScreen.jsx` (thêm icon header mở `EvolutionScreen`), `src/store/useAppStore.js` (điểm/stage), `src/services/storage/memoryStorage.js` (đọc/xoá memory), `src/components/TomoAvatar.jsx`, `src/constants/config.js`

Tasks:
- Backend: `POST /music-suggest` với Search grounding, `found:false` vẫn trả 200
- `actionExecutor`: `suggest_music` → nút [Có]/[Thôi] → `musicApi` → mở link YouTube, retry tối đa 2 lần khi lỗi mở link
- `EvolutionScreen` (tiến độ, stage hiện tại/kế tiếp) + cutscene tiến hoá ở mốc 10/30 điểm + lưu "kỷ niệm tiến hóa" vào memory
- `MemoryScreen`: xem/xoá từng mục hoặc toàn bộ `memory.md`, ghi rõ dữ liệu lưu plaintext local (minh bạch)
- Tích hợp asset thật (3 bộ ngoại hình + bộ animation theo mapping G5) thay placeholder

Acceptance:

🤖 Agent:
- `curl POST /music-suggest` → response JSON chứa `found`, `title`, `url` (hoặc `found: false` với message thân thiện) — HTTP 200 cả hai trường hợp
- `curl POST /music-suggest` với query quá ngắn/rỗng → HTTP 400 `INVALID_INPUT`
- `eslint` pass toàn bộ code mới
- Sau khi xoá memory qua `MemoryScreen`, file `memory.md` trống hoặc chỉ còn header — kiểm tra bằng script đọc file
- `useAppStore` state: đạt 10 điểm → `stage` chuyển sang giá trị kế tiếp — kiểm tra bằng unit test hoặc log state

👤 Con người:
- Tomo đề xuất nhạc → bấm [Có] → mở đúng link YouTube trong trình duyệt/app YouTube — kiểm tra trên thiết bị
- `found: false` → thông báo nhẹ nhàng, không mở Intent — kiểm tra trực quan
- Đủ 10 điểm → cutscene tiến hoá chạy, ngoại hình Tomo đổi — kiểm tra trực quan
- Đủ 30 điểm → cutscene thứ 2 + ngoại hình cuối cùng — kiểm tra trực quan
- `EvolutionScreen`: hiển thị đúng stage hiện tại, điểm, stage kế tiếp — kiểm tra trực quan
- `MemoryScreen`: xem danh sách memory → xoá 1 mục → xoá toàn bộ → hoạt động đúng — kiểm tra trên thiết bị
- Xoá memory → chat tiếp → Tomo không nhắc lại thông tin đã xoá — đánh giá chủ quan
- Asset thật (3 bộ ngoại hình + animation) hiển thị đẹp, đúng mapping — kiểm tra trực quan

---

## Phase 7 — Hardening & chuẩn bị test thật

Goal:
App đủ bền để đưa cho người dùng thật thử nghiệm các giả thuyết H1–H5; đo lường theo `tomo-mvp-requirements.md` mục 8.

Dependencies:
Phase 2–6 hoàn thành.

Cần đọc — tài liệu:
- [tomo-mvp-requirements.md](tomo-mvp-requirements.md) — toàn bộ UC-01 đến UC-13 (rà soát từng luồng thay thế), mục 2 (giả thuyết H1–H5), mục 5 (bảng khả thi/rủi ro), mục 8 (chỉ số đo lường)
- [ARCHITECTURE.md](ARCHITECTURE.md) — mục 7 + 7.1 (bảo mật + lộ trình theo giai đoạn khi deploy)
- [API_SPEC.md](API_SPEC.md) — mục 1 (cập nhật khi kích hoạt `X-App-Secret`), mục 2 (format lỗi)
- [BE_architecture.md](BE_architecture.md) — mục 5 (ghi chú bảo mật, `appSecret.js`)
- [BE_rules.md](BE_rules.md) — mục 5.3
- [FE_rules.md](FE_rules.md) — mục 5.3

Cần đọc — code:
- Toàn bộ code đã viết ở Phase 1–6 (rà soát luồng thay thế); đặc biệt:
- `tomo-backend/src/middlewares/appSecret.js` + `tomo-backend/src/config/env.js` — kích hoạt khi deploy/chia sẻ APK
- `tomo-app/src/constants/config.js` — đổi BASE_URL sang môi trường deploy
- `tomo-app/android/.../OverlayService.kt` + `tomo-app/android/.../FocusTrackingService.kt` — kiểm chứng trên máy OEM (Xiaomi/Oppo...)

Tasks:
- Rà soát toàn bộ luồng thay thế trong các UC (mất mạng, từ chối quyền, thời gian mơ hồ/quá khứ, link lỗi...)
- Test trên máy OEM "khó tính" (Xiaomi/Oppo...) để kiểm chứng overlay + focus service
- Khi deploy backend ra ngoài: áp dụng đúng lộ trình bảo mật theo giai đoạn (`ARCHITECTURE.md` mục 7.1) — bắt đầu bằng budget alert, rồi `X-App-Secret` khi chia sẻ APK
- Đo các chỉ số MVP (tỉ lệ hoàn thành onboarding, phiên chat/ngày, phiên focus, tỉ lệ đạt stage 2, voice vs text)

Acceptance:

🤖 Agent:
- Rà soát code: mọi lệnh gọi API (`chatApi`, `musicApi`) đều có `try/catch` hoặc `.catch()` xử lý lỗi — grep code xác nhận
- `appSecret.js` middleware hoạt động: request không có `X-App-Secret` → HTTP 401 — kiểm tra bằng `curl`
- `eslint` pass toàn bộ codebase; Gradle build release thành công
- Backend start với `NODE_ENV=production` không crash, log ở mức `info` (không `debug`)
- Rà soát checklist các luồng thay thế UC-01 đến UC-13: mỗi luồng có code xử lý tương ứng — grep/đọc code xác nhận

👤 Con người:
- Test trên máy OEM Trung Quốc (Xiaomi/Oppo/Vivo): overlay hiện đúng, focus service không bị giết sau 30 phút — cần thiết bị vật lý cụ thể
- Luồng thay thế thực tế: tắt wifi giữa chat, từ chối quyền rồi cấp lại, nói thời gian mơ hồ ("chiều mai"), link nhạc hỏng → app xử lý đúng — kiểm tra thủ công trên thiết bị
- Đo chỉ số: yêu cầu người dùng thật (hoặc tester) dùng app 3–5 ngày, thu thập tỉ lệ hoàn thành onboarding, phiên chat/ngày, phiên focus, tỉ lệ đạt stage 2, tỉ lệ voice vs text — cần người thật sử dụng
- Xác nhận budget alert (Gemini API) được cấu hình đúng trước khi mở rộng — kiểm tra trên Google Cloud Console
