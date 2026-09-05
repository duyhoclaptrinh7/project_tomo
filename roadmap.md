# TOMO — Project Roadmap (MVP)

> Roadmap cấp phase/milestone cho bản MVP. Thứ tự phase bám theo "Đề xuất thứ tự build MVP" (M1–M5) trong `tomo-mvp-requirements.md` mục 7, bổ sung Phase 0 (foundation) ở đầu và Phase 7 (hardening) ở cuối. Các gap G1–G8 tham chiếu từ `doc_ana.md` mục 4.

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
- Chốt các gap rẻ, sớm: G4 (giá trị N của `recent_history`), G5 + G6 (bảng mapping `emotion_label` → `animation_state` → asset), G8 (onboarding hỏi tên: qua `/chat` hay scripted local)
- Spike nhỏ: xác nhận Google Search grounding hoạt động với `@google/genai` (phục vụ F7)

Acceptance:
- Backend khởi động được, báo lỗi rõ khi thiếu `GEMINI_API_KEY`
- App build và chạy được trên máy Android thật qua Dev Client (màn trống)
- G4/G5/G6/G8 có quyết định bằng văn bản (cập nhật `API_SPEC.md`/tài liệu liên quan nếu cần)

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
- Gọi `POST /chat` (text) trả về JSON đúng đủ 6 field theo `API_SPEC.md` mục 3.2
- Request thiếu field → `400 INVALID_INPUT`; giả lập Gemini lỗi → `502 GEMINI_ERROR`
- `action` luôn hợp lệ (ít nhất `type: "none"`); guardrail tự hại hoạt động khi thử input nguy hiểm

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
- Gửi text → hiển thị `reply_text`, animation đổi theo `set_animation`, history/memory được ghi file
- Chia sẻ cảm xúc → +1 điểm + toast; mất mạng → báo lỗi nhẹ nhàng, tin nhắn không mất
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

- Hội thoại có cá nhân hoá từ `memory.md` (Tomo nhắc lại thông tin đã lưu)

---

## Phase 3 — Onboarding & Overlay (M2)

Goal:
Luồng thiết lập lần đầu hoàn chỉnh; Tomo hiện diện dạng chat-head overlay và mở được màn chat nổi. Tương ứng M2 (F1, F2).

Dependencies:
Phase 2; quyết định G8 đã chốt ở Phase 0.

Tasks:
- `OnboardingScreen` một màn nhiều bước (chào → nhập tên → xin lần lượt quyền mic → overlay → notification), từ chối quyền vẫn cho tiếp tục; set cờ `onboarded`
- `App.jsx` chọn stack Onboarding/Main theo cờ `onboarded`; `SettingsScreen` bật/tắt overlay + nút dẫn lại Settings hệ thống
- Native module Kotlin: `OverlayService.kt` (chat-head tĩnh, kéo-thả, hút cạnh, vùng × để đóng), `TomoNativeModule.kt`, `overlayBridge.js`
- `OverlayChatActivity.kt` (activity RN nền trong suốt) hiển thị màn chat nổi khi tap chat-head — dùng chung stack chat với app chính (cùng một lịch sử)

Acceptance:
- Cài mới → onboarding đầy đủ → vào chat; từ chối quyền không chặn luồng; mở lại app vào thẳng chat
- Overlay hiện đè lên app khác, kéo-thả/đóng đúng; tap mở màn chat nổi chat được (text), đồng bộ lịch sử với app
- Trạng thái bật/tắt overlay lưu trong `app_state.json`

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
- Nhấn-giữ mic, nói tiếng Việt → Tomo trả lời đúng nội dung, phát TTS; cảm xúc chỉ suy từ nội dung lời nói
- Audio lỗi/không hiểu → Tomo hỏi lại; mất mạng → giữ bản ghi để gửi lại

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

- "7h sáng mai đặt báo thức" → thẻ xác nhận → app Đồng hồ mở điền sẵn; tương tự sự kiện lịch; lịch trình được ghi vào memory
- Phiên focus: animation đổi (app + chat-head), bật màn hình → nhắc trong giới hạn tần suất; "làm xong rồi" → chúc mừng + +1 điểm

---

## Phase 6 — Cảm xúc & tiến hoá: nhạc + màn tiến độ + hoàn thiện memory (M5)

Goal:
Gợi ý nhạc theo mood qua YouTube; hệ thống tiến hoá đầy đủ với màn "Hành trình của Tomo"; quản lý memory. Tương ứng M5 (F7, F8, F4 hoàn thiện).

Dependencies:
Phase 2 (điểm tiến hoá đã cộng), Phase 1; spike Search grounding ở Phase 0 đã xác nhận khả dụng.

Tasks:
- Backend: `POST /music-suggest` với Search grounding, `found:false` vẫn trả 200
- `actionExecutor`: `suggest_music` → nút [Có]/[Thôi] → `musicApi` → mở link YouTube, retry tối đa 2 lần khi lỗi mở link
- `EvolutionScreen` (tiến độ, stage hiện tại/kế tiếp) + cutscene tiến hoá ở mốc 10/30 điểm + lưu "kỷ niệm tiến hóa" vào memory
- `MemoryScreen`: xem/xoá từng mục hoặc toàn bộ `memory.md`, ghi rõ dữ liệu lưu plaintext local (minh bạch)
- Tích hợp asset thật (3 bộ ngoại hình + bộ animation theo mapping G5) thay placeholder

Acceptance:
- Tomo đề xuất nhạc → [Có] → mở đúng link YouTube; `found:false` → thông báo nhẹ nhàng, không mở Intent
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

- Đủ 10/30 điểm → cutscene + đổi ngoại hình; xoá memory hoạt động và ảnh hưởng ngay đến hội thoại sau

---

## Phase 7 — Hardening & chuẩn bị test thật

Goal:
App đủ bền để đưa cho người dùng thật thử nghiệm các giả thuyết H1–H5; đo lường theo `tomo-mvp-requirements.md` mục 8.

Dependencies:
Phase 2–6 hoàn thành.

Tasks:
- Rà soát toàn bộ luồng thay thế trong các UC (mất mạng, từ chối quyền, thời gian mơ hồ/quá khứ, link lỗi...)
- Test trên máy OEM "khó tính" (Xiaomi/Oppo...) để kiểm chứng overlay + focus service
- Khi deploy backend ra ngoài: áp dụng đúng lộ trình bảo mật theo giai đoạn (`ARCHITECTURE.md` mục 7.1) — bắt đầu bằng budget alert, rồi `X-App-Secret` khi chia sẻ APK
- Đo các chỉ số MVP (tỉ lệ hoàn thành onboarding, phiên chat/ngày, phiên focus, tỉ lệ đạt stage 2, voice vs text)

Acceptance:
- Các luồng thay thế trong UC-01 đến UC-13 xử lý đúng như mô tả
- Overlay + nhắc focus hoạt động ổn định trên ít nhất 1 máy OEM Trung Quốc
- Bộ chỉ số mục 8 (requirements) thu thập được để đánh giá H1–H5
