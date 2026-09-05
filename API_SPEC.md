# TOMO — API Specification (MVP)

> Đặc tả chi tiết, chính xác đến từng field cho các API giữa Client và Backend. Đây là tài liệu tham chiếu khi code — mọi thay đổi hợp đồng API (request/response) phải cập nhật lại file này. Bối cảnh kiến trúc tổng quan xem `ARCHITECTURE.md`; chi tiết implement từng phía xem `BE_architecture.md` / `FE_architecture.md`.

---

## 1. Tổng quan

| Mục | Giá trị |
|---|---|
| Giao thức | REST over HTTPS, body dạng JSON |
| Base URL | Chưa xác định (backend chưa deploy) — sẽ điền khi có, vd `https://<domain>` |
| Versioning | Không dùng tiền tố version (`/v1/...`) ở MVP — chỉ 2 endpoint, thay đổi hợp đồng thì sửa trực tiếp file này |
| Xác thực (auth) | **Không có** ở giai đoạn hiện tại (backend chưa deploy). Khi cần, sẽ thêm header `X-App-Secret` theo đúng lộ trình ở `ARCHITECTURE.md` mục 7.1 — cập nhật file này ngay khi kích hoạt |
| `Content-Type` | `application/json` cho mọi request và response |
| Số lượng endpoint | 2 — `POST /chat`, `POST /music-suggest` (lý do chỉ 2 và không gộp lại: xem `ARCHITECTURE.md` mục 6.1–6.4) |

---

## 2. Quy ước chung

### 2.1 HTTP status code

| Status | Khi nào dùng |
|---|---|
| `200 OK` | Xử lý thành công (kể cả trường hợp Gemini không tìm được nhạc — `found: false` vẫn là `200`, không phải lỗi) |
| `400 Bad Request` | Request body sai định dạng/thiếu field bắt buộc (lỗi do client) |
| `502 Bad Gateway` | Backend gọi Gemini API thất bại (lỗi mạng, Gemini trả lỗi, timeout...) — lỗi từ dịch vụ ngoài, không phải lỗi logic backend |
| `500 Internal Server Error` | Lỗi không lường trước trong chính backend |

### 2.2 Format lỗi chuẩn (áp dụng cho mọi status ≥ 400)

```json
{
  "error": {
    "code": "INVALID_INPUT | GEMINI_ERROR | INTERNAL_ERROR",
    "message": "Mô tả ngắn gọn, dễ hiểu, có thể hiển thị cho người dùng hoặc log"
  }
}
```

| `error.code` | Status tương ứng | Ý nghĩa |
|---|---|---|
| `INVALID_INPUT` | 400 | Request không đúng schema (vd thiếu `input.type`, `audio_base64` rỗng khi `type = audio`) |
| `GEMINI_ERROR` | 502 | Gemini API lỗi/timeout/từ chối xử lý |
| `INTERNAL_ERROR` | 500 | Lỗi khác trong backend |

---

## 3. `POST /chat`

Endpoint chính cho mọi lượt hội thoại (text hoặc voice), dùng chung cho chat trong app và màn hình chat dạng nổi mở từ overlay. Không lưu state — mỗi request phải mang đủ ngữ cảnh.

### 3.1 Request Body

| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `input.type` | `"text"` \| `"audio"` | ✅ | Loại input người dùng gửi |
| `input.text` | string | Chỉ khi `type = "text"` | Nội dung tin nhắn dạng chữ |
| `input.audio_base64` | string (base64) | Chỉ khi `type = "audio"` | Dữ liệu audio đã encode base64, clip ngắn (push-to-talk) |
| `input.audio_mime` | string | Chỉ khi `type = "audio"` | MIME type của audio, vd `"audio/m4a"` |
| `memory_md` | string | ✅ | Toàn bộ nội dung file `memory.md` hiện tại của client. Truyền `""` nếu chưa có memory nào |
| `recent_history` | array\<HistoryMessage\> | ✅ | N tin nhắn gần nhất (xem mục 5.1). Truyền `[]` nếu là tin đầu tiên |
| `session_context.focus_session_active` | boolean | ✅ | Có đang trong phiên focus mode hay không |
| `session_context.evolution_stage` | number | ✅ | Stage tiến hoá hiện tại của Tomo |
| `session_context.evolution_points` | number | ✅ | Điểm tiến hoá hiện tại |

**Ví dụ — input dạng text:**
```json
{
  "input": {
    "type": "text",
    "text": "Hôm nay mình thi trượt rồi, buồn quá"
  },
  "memory_md": "## Sở thích\n- Thích mèo\n- Đang ôn thi IELTS\n",
  "recent_history": [
    {"role": "user", "text": "Chào Tomo", "ts": "2026-09-04T08:00:00+07:00"},
    {"role": "tomo", "text": "Chào bạn! Hôm nay thế nào?", "ts": "2026-09-04T08:00:02+07:00"}
  ],
  "session_context": {
    "focus_session_active": false,
    "evolution_stage": 1,
    "evolution_points": 6
  }
}
```

**Ví dụ — input dạng audio:**
```json
{
  "input": {
    "type": "audio",
    "audio_base64": "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMA==...",
    "audio_mime": "audio/m4a"
  },
  "memory_md": "…",
  "recent_history": [],
  "session_context": { "focus_session_active": false, "evolution_stage": 1, "evolution_points": 6 }
}
```

### 3.2 Response Body (200 OK)

| Field | Kiểu | Mô tả |
|---|---|---|
| `reply_text` | string | Câu trả lời của Tomo dạng chữ — luôn hiển thị trong chat, dù input là text hay audio |
| `emotion_label` | string \| `null` | Nhãn cảm xúc suy ra **từ nội dung lời nói**, dùng để chọn animation. Xem enum ở mục 5.3 |
| `should_speak` | boolean | Gợi ý client có nên phát TTS hay không (vd `true` nếu input là audio) |
| `action` | Action object | Hành động Tomo muốn thực hiện — xem mục 5.2 |
| `new_facts` | array\<string\> | Fact mới trích được từ lượt hội thoại này, client tự append vào `memory.md`. Mảng rỗng `[]` nếu không có gì mới |
| `point_event` | `"emotional_share"` \| `null` | Sự kiện cộng điểm tiến hoá của lượt này — xem mục 5.4. `null` = lượt này không cộng điểm |

**Ví dụ response:**
```json
{
  "reply_text": "Ui, trượt rồi thì buồn thật, nhưng mình tin bạn sẽ ổn thôi. Muốn kể thêm cho Tomo nghe không?",
  "emotion_label": "buồn",
  "should_speak": false,
  "action": {
    "type": "set_animation",
    "params": { "animation_state": "an_ủi" }
  },
  "new_facts": ["Vừa thi trượt một kỳ thi quan trọng"],
  "point_event": "emotional_share"
}
```

### 3.3 Lỗi

| Trường hợp | Response |
|---|---|
| Thiếu `input.type` | `400` — `{"error": {"code": "INVALID_INPUT", "message": "input.type là bắt buộc"}}` |
| `type = "audio"` nhưng thiếu `audio_base64` | `400 INVALID_INPUT` |
| Gemini timeout/lỗi | `502 GEMINI_ERROR` |

---

## 4. `POST /music-suggest`

Gọi **sau khi** người dùng bấm [Có] xác nhận muốn nghe nhạc gợi ý từ Tomo (action `suggest_music` ở `/chat`). Endpoint riêng vì cần bật Google Search grounding — xem `ARCHITECTURE.md` mục 6.4.

### 4.1 Request Body

| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `mood` | string | ✅ | Tâm trạng hiện tại, lấy từ `action.params.mood` của response `/chat` trước đó |
| `genre_hint` | string | ❌ | Gu nhạc trích từ `memory.md`, truyền `""` nếu chưa biết |

**Ví dụ:**
```json
{
  "mood": "buồn",
  "genre_hint": "nhạc acoustic nhẹ nhàng"
}
```

### 4.2 Response Body (200 OK)

| Field | Kiểu | Mô tả |
|---|---|---|
| `song_title` | string \| `null` | Tên bài hát tìm được, `null` nếu `found = false` |
| `youtube_url` | string \| `null` | Link YouTube thật (có nguồn từ Google Search grounding), `null` nếu `found = false` |
| `found` | boolean | `false` nếu Gemini không tìm được link phù hợp — không phải lỗi hệ thống, client hiển thị thông báo nhẹ nhàng thay vì mở Intent |

**Ví dụ — tìm thấy:**
```json
{ "song_title": "Có Chàng Trai Viết Lên Cây - phiên bản acoustic", "youtube_url": "https://www.youtube.com/watch?v=xxxxxxxxxxx", "found": true }
```

**Ví dụ — không tìm thấy:**
```json
{ "song_title": null, "youtube_url": null, "found": false }
```

### 4.3 Lỗi

| Trường hợp | Response |
|---|---|
| Thiếu `mood` | `400 INVALID_INPUT` |
| Gemini/Search grounding lỗi | `502 GEMINI_ERROR` |

*Lưu ý: nếu client mở `youtube_url` bằng Intent `ACTION_VIEW` mà lỗi (không mở được), đó là lỗi phía client, retry tối đa 2 lần — không liên quan response của endpoint này.*

---

## 5. Đối tượng dữ liệu dùng chung

### 5.1 `HistoryMessage`

| Field | Kiểu | Mô tả |
|---|---|---|
| `role` | `"user"` \| `"tomo"` | Ai là người gửi tin |
| `text` | string | Nội dung tin nhắn (dạng chữ, kể cả tin gốc là voice — dùng `reply_text`/transcript) |
| `ts` | string (ISO 8601) | Thời điểm gửi |

### 5.2 `Action`

| Field | Kiểu | Mô tả |
|---|---|---|
| `type` | enum (xem bảng dưới) | Loại hành động |
| `params` | object | Tham số đi kèm, cấu trúc tuỳ theo `type` |

| `action.type` | `params` | Ai thực thi | Tính năng |
|---|---|---|---|
| `set_animation` | `{ "animation_state": string }` — vd `"vui"`, `"buồn"`, `"an_ủi"`, `"tập_trung"`, `"ăn_mừng"`, `"chờ"` (danh sách cụ thể do FE định nghĩa animation tương ứng) | Client | F2/F3 |
| `start_focus_session` | `{ "duration_minutes": number \| null }` (`null` = không giới hạn, đến khi người dùng tự kết thúc) | Client | F6 |
| `end_focus_session` | `{}` | Client | F6 |
| `suggest_music` | `{ "mood": string }` — client hiện nút [Có]/[Thôi], nếu đồng ý dùng `mood` này gọi `/music-suggest` | Client | F7 |
| `propose_schedule` | `{ "title": string, "datetime_iso": string, "type": "alarm" \| "calendar_event" }` | Client (mở Intent `AlarmClock`/`CalendarContract` tương ứng) | F5 |
| `none` | `{}` | — | Chat thường, không có hành động |

### 5.3 `emotion_label` (enum)

`"vui"` \| `"buồn"` \| `"stress"` \| `"trung_lập"` \| `null`

Danh sách có thể mở rộng khi cần thêm animation mới — cập nhật đồng thời ở đây và ở `FE_architecture.md` (nơi sẽ định nghĩa mapping `emotion_label` → animation cụ thể, hiện chưa có trong tài liệu FE).

### 5.4 `point_event` (enum)

`"emotional_share"` \| `null`

Đánh dấu lượt hội thoại là **một lượt chia sẻ cảm xúc hợp lệ** theo F8 → client cộng +1 điểm tiến hoá và hiển thị toast "+1 kết nối 💙" (xem `FE_architecture.md` mục 3.3). Tiêu chí để Gemini gán giá trị này (mô tả chi tiết trong system prompt, xem `BE_architecture.md` mục 2.1): chỉ tính khi người dùng thật sự chia sẻ cảm xúc hoặc trải nghiệm cá nhân (vui, buồn, stress, tâm sự...); **không** tính chào hỏi, small talk, câu hỏi thông tin thông thường, hay yêu cầu tiện ích (đặt báo thức, gợi ý nhạc...).

Điểm từ **phiên focus hoàn thành** không đi qua field này — client tự suy ra từ `action.type = "end_focus_session"` (xem `tomo-mvp-requirements.md` UC-11). MVP **không áp dụng chống farm** (không giới hạn số điểm/ngày) — xem `tomo-mvp-requirements.md` UC-13.

Danh sách giá trị có thể mở rộng khi có thêm cách kiếm điểm mới — cập nhật đồng thời ở đây và system prompt ở backend.

---

## 6. Ghi chú triển khai

- Backend validate request bằng Zod theo đúng bảng field ở mục 3.1/4.1 trước khi gọi Gemini (xem `BE_architecture.md` mục 2.1, file `schemas/chatRequest.schema.js`).
- `action.params` với `type = "propose_schedule"` cần đủ field để client dựng Intent chính xác (`AlarmClock.ACTION_SET_ALARM` cần giờ/phút; `CalendarContract` cần thời điểm bắt đầu) — nếu Gemini trả thiếu field, backend nên coi là lỗi cần retry nội bộ trước khi trả về client, tránh đẩy dữ liệu không dùng được xuống Action Executor.
- File này **không version hoá riêng** — mọi thay đổi hợp đồng API sửa trực tiếp tại đây, đồng thời soát lại các phần liên quan ở `ARCHITECTURE.md` mục 4/6.4 để tránh lệch nội dung giữa các file.
