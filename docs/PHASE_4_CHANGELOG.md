# Phase 4 Changelog — Voice push-to-talk & TTS

Ngày hoàn thành: 2026-09-20

## Phạm vi

Phase 4 triển khai luồng hội thoại bằng giọng nói cho màn chat chính và màn chat nổi:

1. Người dùng giữ nút mic để ghi âm và thả để gửi.
2. App đọc file ghi âm thành base64 và gửi thẳng lên `POST /chat`.
3. Backend đưa audio thô vào Gemini, không chạy Speech-to-Text trên client.
4. Phản hồi được hiển thị bằng text và phát bằng TTS tiếng Việt.
5. Avatar trong app và chat-head overlay mở/đóng miệng trong lúc TTS phát.
6. Nếu request lỗi, payload audio được giữ nguyên để người dùng bấm **Gửi lại**.

## Backend

### `tomo-backend/src/services/chat.service.js`

- Giữ luồng `inlineData` đã có để chuyển `audio_base64` và `audio_mime` sang Gemini.
- Chuẩn hóa `should_speak = true` cho mọi input loại `audio`, bảo đảm voice input luôn nhận phản hồi TTS.
- Text input vẫn tôn trọng giá trị `should_speak` từ Gemini.

### Test backend

- Bổ sung HTTP contract test cho audio hợp lệ.
- Bổ sung HTTP 400 `INVALID_INPUT` khi thiếu `audio_base64`.
- Bổ sung schema test cho discriminated union audio.
- Bổ sung service test xác nhận audio được map sang `inlineData` và luôn bật TTS.

## App React Native

### `src/hooks/useVoiceRecorder.js`

- Thay skeleton bằng recorder thật dùng `expo-audio`.
- Xin quyền microphone trước khi ghi.
- Dùng preset M4A chất lượng cao và cấu hình audio mode phù hợp push-to-talk.
- Đọc file bằng API `File.base64()` của `expo-file-system`.
- Tự nhận MIME `audio/mp4`, `audio/3gpp` hoặc `audio/webm` theo URI.
- Giữ recording cuối cùng và báo lỗi thân thiện khi quyền/file audio có vấn đề.

### `src/components/MicButton.jsx`

- Thay placeholder bằng nút nhấn-giữ thật.
- `onPressIn`: bắt đầu ghi âm.
- `onPressOut`: dừng và gửi.
- Có trạng thái đang ghi, disabled khi request đang chạy và accessibility label.

### `src/hooks/useChat.js`

- Hỗ trợ chung cả input text và audio.
- Lưu `requestInput` trong message đang chờ/thất bại để retry đúng payload ban đầu.
- Không duplicate message khi gửi lại audio.
- Lưu lịch sử voice dưới nhãn `🎤 Tin nhắn thoại` vì API hiện chưa trả transcript.
- Phát TTS khi response có `should_speak = true`.
- Bật/tắt animation `speaking` cho avatar và chat-head đúng vòng đời TTS.
- Lỗi TTS không biến một API request đã thành công thành request thất bại.

### `src/hooks/useTts.js`

- Thay skeleton bằng `expo-speech`.
- Dùng locale `vi-VN`, rate `0.95`, pitch `1`.
- Bọc callback TTS thành Promise để animation kết thúc đúng lúc.
- Dừng utterance cũ trước utterance mới và cleanup khi unmount.

### `src/screens/ChatScreen.jsx`

- Thêm mic vào cả chat chính và chat overlay.
- Xử lý race giữa lúc đang xin quyền/prepare recorder và lúc người dùng thả mic.
- Hiển thị lỗi microphone riêng, không làm mất lỗi chat hiện tại.

### `src/components/TomoAvatar.jsx`

- Thêm animation mở/đóng miệng mỗi 220 ms khi state là `speaking`.
- Tự trở về khuôn mặt tĩnh khi TTS kết thúc.

## Native Android

### `TomoNativeModule.kt` và `overlayBridge.js`

- Thêm API `setOverlaySpeaking(isSpeaking)` từ JavaScript sang Kotlin.
- Có fallback an toàn khi native module/overlay chưa chạy, gồm cả môi trường Expo Go/test.

### `OverlayService.kt`

- Theo dõi instance overlay đang hoạt động trong cùng process.
- Thêm mouth view trên chat-head.
- Dùng `ValueAnimator` để mở/đóng miệng trong lúc nói.
- Hủy animator và giải phóng view khi TTS dừng hoặc service bị hủy.
- Cập nhật đồng thời bản nguồn trong `native-src/` và bản generated đang dùng trong `android/`.

## Test và xác minh

- Backend: **21 test pass**.
- App: **43 test pass**, gồm 3 test Phase 4 mới:
  - ghi âm → base64 → request audio → TTS;
  - lỗi mạng → retry giữ nguyên payload audio;
  - từ chối quyền mic → thông báo thân thiện, không gọi API.
- ESLint backend: pass.
- ESLint app: pass.
- Kotlin: `:app:compileDebugKotlin` **BUILD SUCCESSFUL** với SDK 36, Build Tools 36.0.0, NDK 27.1.12297006 và Kotlin 2.1.20.
- Các file JavaScript thay đổi trong Phase 4 đã được chạy Prettier.

## Kiểm thử thủ công còn cần làm trên thiết bị

- Chất lượng nhận tiếng Việt thực tế của Gemini với microphone thiết bị.
- TTS `vi-VN` phụ thuộc voice engine được cài trên từng máy Android.
- Quan sát animation chat-head khi overlay đang hiện trên ứng dụng khác.
- Tắt mạng giữa request thật rồi bấm **Gửi lại**.
- Expo Go kiểm tra được voice/TTS trong app; animation chat-head native cần development build/APK.

## Ghi chú ngoài Phase 4

- Không chạy `npm audit fix --force` và không nâng dependency.
- `npm run format:check` toàn repo vẫn báo các file cũ và Android build artifacts chưa nằm trong `.prettierignore`; đây không phải lỗi từ các file Phase 4.
- Không thay đổi `BASE_URL`, package lock hoặc hai chỉnh sửa `OverlayChatActivity.kt` đã tồn tại trước Phase 4.
