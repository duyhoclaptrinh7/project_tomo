# TOMO — Phân tích tính nhất quán tài liệu (Document Analysis)

> Phân tích 7 tài liệu: `tomo-mvp-requirements.md`, `ARCHITECTURE.md`, `API_SPEC.md`, `BE_architecture.md`, `FE_architecture.md`, `BE_rules.md`, `FE_rules.md`.
> Mục tiêu: kiểm tra tính nhất quán, tìm contradiction, missing requirements, technical risks, dependencies — làm nền cho `roadmap.md`. Chỉ nêu các vấn đề có thật trong tài liệu, không suy diễn thêm.

---

## 1. Kết luận tổng quan

Bộ tài liệu **nhất quán ở mức cao và đủ để bắt đầu code MVP**. Các quyết định lớn (stateless backend, không DB, action = dữ liệu do client thực thi, audio thô gửi thẳng Gemini, TTS mặc định của máy, 2 endpoint duy nhất) được thể hiện thống nhất xuyên suốt cả 7 file, có cross-reference lẫn nhau rõ ràng.

**Không phát hiện contradiction nào chặn implementation.** Tồn tại một số **gap nhỏ** (mục 4) — chủ yếu là vài luồng trong requirements chưa có field/action tương ứng trong `API_SPEC.md` — cần chốt bổ sung trước khi code đến phase liên quan, không cần viết lại tài liệu.

---

## 2. Các điểm đã kiểm chứng là nhất quán

| Chủ đề | Các file liên quan | Trạng thái |
|---|---|---|
| Hợp đồng `POST /chat` (request/response từng field) | API_SPEC mục 3 ↔ ARCHITECTURE mục 4 ↔ BE_rules 4.4 ↔ FE_rules 4.2 | ✅ Khớp |
| Hợp đồng `POST /music-suggest` (gọi sau khi bấm [Có], `found:false` không phải lỗi, retry mở link ở client) | API_SPEC mục 4 ↔ ARCHITECTURE 6.4 ↔ FE_rules 4.6 ↔ UC-12 | ✅ Khớp |
| Format lỗi chuẩn + mapping status (400/502/500) | API_SPEC mục 2 ↔ BE_rules 4.2 ↔ BE_architecture 4.1 | ✅ Khớp |
| Action enum 6 loại + ai thực thi (Gemini ra ý định, client thực thi) | API_SPEC 5.2 ↔ ARCHITECTURE mục 5 ↔ FE_rules 4.6 | ✅ Khớp |
| Cộng điểm tiến hoá: `point_event = emotional_share` hoặc `end_focus_session`, không chống farm ở MVP | API_SPEC 5.4 ↔ FE_rules 4.6 ↔ ARCHITECTURE 6.1 ↔ UC-13 | ✅ Khớp |
| Mốc tiến hoá: stage 2 ở 10 điểm, stage 3 ở 30 điểm | UC-13 ↔ quyết định #11 ↔ FE_rules 4.6 | ✅ Khớp |
| Backend stateless, không DB/session; client gửi đủ ngữ cảnh mỗi request | ARCHITECTURE mục 1 ↔ BE_architecture 1.1 ↔ BE_rules mục 1 ↔ FE_rules 4.2 | ✅ Khớp |
| Lưu local: 3 file `memory.md` / `chat_history.jsonl` / `app_state.json`, chỉ qua `expo-file-system` | ARCHITECTURE mục 3 ↔ FE_architecture 2.2 ↔ FE_rules 4.4/5.2 | ✅ Khớp |
| Audio thô base64 → Gemini, không STT client; TTS mặc định máy; push-to-talk, không Live API/wake-word | Quyết định #12 ↔ ARCHITECTURE 6.2/8 ↔ FE_rules 4.6/5.2 | ✅ Khớp |
| SDK/thư viện cố định: `@google/genai` (không SDK cũ), `expo-audio` (không `expo-av`), Zustand (không Redux), axios, Expo Dev Client | BE_architecture 1.3 ↔ BE_rules 5.2 ↔ FE_architecture 1.3 ↔ FE_rules 5.2 | ✅ Khớp |
| Cảm xúc gán theo nội dung lời nói, không suy từ tông giọng | ARCHITECTURE 6.2 ↔ BE_architecture 2.1 ↔ BE_rules 4.6 | ✅ Khớp |
| Bảo mật theo giai đoạn: hiện tại không auth, `appSecret.js` có sẵn vị trí nhưng chưa kích hoạt | ARCHITECTURE 7.1 ↔ BE_architecture mục 5 ↔ BE_rules 5.3 ↔ FE_rules 5.3 | ✅ Khớp |
| Bỏ input `image` khỏi MVP | ARCHITECTURE 9.2 ↔ API_SPEC 3.1 (chỉ `text`/`audio`) | ✅ Khớp |
| Overlay: chat-head native + màn chat nổi là `OverlayChatActivity` (RN activity thứ hai), không nhúng RN view vào overlay window | FE_architecture 1.1/1.2 ↔ FE_rules 5.1 ↔ UC-03 | ✅ Khớp |
| Guardrail an toàn tự hại trong system prompt của mọi request `/chat` | UC-05 luồng 3a ↔ ARCHITECTURE mục 7 ↔ BE_rules 4.6/5.3 | ✅ Khớp |
| Cấu trúc thư mục + naming (route/controller/service/provider; screen/hook/service/action) | BE_architecture 2.1 ↔ BE_rules 2.1; FE_architecture 2.1 ↔ FE_rules 2.1 | ✅ Khớp |

**Điểm lệch nhỏ (không phải contradiction, không chặn):**
- `ARCHITECTURE.md` mục 4 ví dụ `emotion_label` thiếu `"trung_lập"` so với enum ở `API_SPEC.md` mục 5.3 — chỉ là ví dụ minh hoạ.
- `ARCHITECTURE.md` mục 3 ghi "`app_state.json` (hoặc SharedPreferences)" trong khi FE đã chốt `expo-file-system` duy nhất — đã được giải thích ở giả định #3 (tên/định dạng file chỉ là đề xuất).

---

## 3. Contradictions

Không có mâu thuẫn trực tiếp nào giữa các tài liệu ở mức chặn implementation. Các vấn đề thực tế phát hiện được đều thuộc loại **missing/gap** (mục 4).

---

## 4. Missing requirements / gaps cần chốt bổ sung

| # | Gap | Chi tiết | Ảnh hưởng |
|---|---|---|---|
| G1 | UC-11 có 2 luồng không có `action.type` tương ứng | "Đừng nhắc nữa" (tắt nhắc, phiên tiếp tục) và "Nghỉ tí đã" (tạm dừng phiên) là intent đến từ lời nói → cần Gemini trả action, nhưng enum `action.type` ở API_SPEC 5.2 chỉ có `start/end_focus_session`, không có action tắt nhắc hay tạm dừng | Chặn Phase focus mode (F6) |
| G2 | Cơ chế cache câu nhắc focus chưa có trong contract | ARCHITECTURE 6.3 mô tả gọi Gemini một lần lúc bắt đầu phiên để sinh sẵn danh sách câu nhắc, cache trong phiên — nhưng response `/chat` không có field nào trả danh sách câu nhắc này | Chặn Phase focus mode (F6) |
| G3 | Gemini không biết "giờ hiện tại" để parse lịch | F5 cần resolve "mai 7h", "thứ 6 này 15h" thành `datetime_iso`, nhưng request `/chat` không có field thời gian hiện tại/timezone của thiết bị (`recent_history[].ts` có thể rỗng) | Chặn Phase đặt lịch (F5) |
| G4 | Giá trị N của `recent_history` chưa chốt | API_SPEC 3.1 ghi "N tin nhắn gần nhất (xem mục 5.1)" nhưng 5.1 chỉ định nghĩa `HistoryMessage`, không định nghĩa N | Nhỏ — chốt khi code FE (đặt trong `constants/config.js`) |
| G5 | Mapping `emotion_label` → `animation_state` → asset chưa định nghĩa | API_SPEC 5.3 tự thừa nhận mapping "hiện chưa có trong tài liệu FE"; `animation_state` là string do FE định nghĩa | Chặn Phase làm animation (cần bảng mapping + danh sách asset) |
| G6 | Tập nhãn cảm xúc chưa thống nhất | F7 narrative liệt kê "vui/buồn/stress/mệt/hào hứng/cô đơn...", API_SPEC 5.3 chỉ có 4 giá trị + null (kèm ghi chú "có thể mở rộng") | Nhỏ — chốt một danh sách duy nhất khi làm G5 |
| G7 | UC-09 luồng 1a "Tomo thỉnh thoảng hỏi" — cơ chế chủ động chưa mô tả | Phiên focus không giới hạn thời gian: ai trigger Tomo hỏi (timer client gọi `/chat`? thông báo local?) — không tài liệu nào nêu | Nhỏ — có thể quyết định khi code F6 |
| G8 | Onboarding hỏi tên: qua `/chat` hay scripted local? | F1/UC-01 mô tả "Tomo tự giới thiệu bằng hội thoại, hỏi tên" nhưng không nói rõ đi qua backend hay hội thoại dựng sẵn phía client | Nhỏ — quyết định khi code F1 |

---

## 5. Technical risks

Phần lớn rủi ro **đã được chính các tài liệu ghi nhận kèm hướng giảm thiểu** — bảng dưới chỉ tổng hợp lại, không thêm rủi ro mới:

| Rủi ro | Mức | Trạng thái trong tài liệu |
|---|---|---|
| OEM (Xiaomi/Oppo...) giết foreground service → nhắc focus chết | Cao | Đã ghi nhận (requirements mục 5); giảm thiểu: hướng dẫn user tắt tối ưu pin |
| Gemini "bịa" link YouTube | Trung bình | Đã ghi nhận (UC-12); giảm thiểu: Google Search grounding + `found:false` + retry tối đa 2 lần |
| Chi phí Gemini theo lượt gọi (kể cả audio) | Trung bình | Đã ghi nhận (requirements mục 5); chưa có ước lượng số liệu; budget alert nằm trong lộ trình bảo mật khi deploy |
| Dữ liệu local plaintext (memory, history) | Thấp | Đã chấp nhận (ARCHITECTURE mục 7); yêu cầu minh bạch với user ở UC-07 |
| Gỡ app = mất toàn bộ dữ liệu | Thấp | Đã chấp nhận (quyết định #10) |
| Backend public không auth khi deploy | Thấp (hiện tại) | Đã có lộ trình 4 giai đoạn (ARCHITECTURE 7.1); giai đoạn hiện tại không cần làm gì |
| App bên dưới bị pause khi mở `OverlayChatActivity` | Thấp | Đã chấp nhận có chủ đích (FE_architecture 1.2) |
| Search grounding có sẵn/đúng gói trên `@google/genai` | Chưa kiểm chứng | Cần spike kỹ thuật sớm trước khi làm F7 |

---

## 6. Dependencies

| Dependency | Chặn việc gì | Ghi chú |
|---|---|---|
| `GEMINI_API_KEY` | Toàn bộ backend | Cần có trước khi test backend thật |
| Asset nhân vật (3 bộ ngoại hình stage + các trạng thái animation) | F2, F3, F8 — UI animation và tiến hoá | Quyết định #7: asset do người dùng cung cấp; **đây là dependency ngoài code lớn nhất** — có thể dùng placeholder trong lúc dev |
| Bảng mapping animation (G5) + tập nhãn cảm xúc thống nhất (G6) | F2/F3 animation | Chốt trước khi code `TomoAvatar`/`actionExecutor` |
| Chốt G1, G2, G7 | F6 focus mode | Cần cập nhật `API_SPEC.md` mục 5.2 (và có thể 3.2) trước Phase focus |
| Chốt G3 (thời gian hiện tại trong request) | F5 đặt lịch | Bổ sung field nhỏ vào `session_context` hoặc tương đương trong `API_SPEC.md` |
| Kiểm chứng Search grounding trên `@google/genai` | F7 gợi ý nhạc | Spike nhỏ ở backend trước Phase nhạc |
| Quyết định thư viện Intent (thư viện JS cộng đồng vs native module nhỏ) | F5 đặt lịch | FE_architecture 1.3 đã nêu: kiểm tra thư viện hiện có khi code |
| Base URL backend | Test end-to-end trên thiết bị thật | API_SPEC mục 1 để trống; dev local có thể dùng IP LAN qua `constants/config.js` |
| Kiểm tra Node LTS hiện hành | Scaffold backend | BE_architecture 1.3 đã lưu ý kiểm tra tại thời điểm code |
| Môi trường build Expo Dev Client cho Android | Toàn bộ FE | FE_architecture 1.1: bắt buộc Dev Client, không dùng Expo Go |

---

## 7. Đề xuất xử lý

1. Bộ tài liệu đủ tốt để bắt đầu implementation theo `roadmap.md` — không cần viết lại tài liệu nào.
2. Chỉ cần chốt 8 gap nhỏ ở mục 4 theo thứ tự ưu tiên gắn với phase: G4/G5/G6/G8 (sớm, rẻ), G3 (trước Phase đặt lịch), G1/G2/G7 (trước Phase focus).
3. Khi chốt các gap liên quan API (G1, G2, G3), cập nhật `API_SPEC.md` trước rồi mới code — đúng quy ước "mọi thay đổi hợp đồng API phải cập nhật file này" của chính tài liệu.
