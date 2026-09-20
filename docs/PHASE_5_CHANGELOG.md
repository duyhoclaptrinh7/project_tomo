# Phase 5 Changelog — Lịch/Báo thức và Focus mode

Ngày hoàn thành: 2026-09-20

## Phạm vi

Phase 5 hoàn thiện milestone M4:

1. Hiểu yêu cầu lịch tương đối dựa trên giờ hiện tại và múi giờ của thiết bị.
2. Hiển thị thẻ xác nhận trước khi mở app Đồng hồ hoặc Lịch hệ thống.
3. Bắt đầu phiên focus qua foreground service Android.
4. Nhắc nhẹ khi người dùng bật màn hình, tối đa một lần mỗi 5 phút.
5. Không nhắc khi app Tomo đang ở foreground.
6. Cho phép tạm dừng nhắc mà không kết thúc phiên.
7. Kết thúc phiên với animation ăn mừng và cộng một điểm kết nối.

## Các quyết định đã chốt

- G1: action `pause_focus_reminders` tắt nhắc nhưng vẫn giữ phiên focus.
- G2: câu nhắc được cache local trong service, không gọi Gemini khi nhận `SCREEN_ON`.
- G3: request `/chat` luôn gửi `current_time_iso` và `timezone`.
- G7: phiên không giới hạn chỉ xen câu hỏi “vẫn đang làm à?” sau ít nhất 30 phút, không tạo timer đánh thức máy.
- Intent hệ thống được triển khai trong native module hiện có, không thêm thư viện cộng đồng.

## Backend

- Mở rộng `session_context` với trạng thái nhắc focus, thời gian local ISO và múi giờ IANA.
- Bổ sung `pause_focus_reminders` vào JSON schema và Zod schema.
- Cập nhật system prompt để quy đổi “sáng mai”, “thứ Sáu” thành thời gian tuyệt đối.
- Yêu cầu lịch/báo thức được ghi thành `new_facts` để lưu vào memory.
- Structured output thiếu `datetime_iso` tiếp tục dùng cơ chế retry nội bộ của Gemini provider.

## App React Native

- Thêm `ActionConfirmationCard` dùng chung cho lịch/báo thức và bắt đầu focus.
- `useChat` gửi thời gian/múi giờ và expose luồng xác nhận/hủy action.
- `actionExecutor` xử lý đầy đủ `propose_schedule`, `start_focus_session`, `pause_focus_reminders` và `end_focus_session`.
- Persist thêm `isFocusRemindersEnabled` trong `app_state.json`.
- Thêm hướng dẫn mở cài đặt tối ưu pin trong màn Cài đặt.
- Thêm utility tạo ISO 8601 local có offset.

## Native Android

- Thêm `FocusTrackingService.kt` dạng foreground service.
- Đăng ký `SCREEN_ON` bằng dynamic receiver và giới hạn nhắc 5 phút.
- Ưu tiên bubble overlay; fallback sang heads-up notification khi overlay không chạy.
- Chat-head hiển thị badge focus và bubble câu nhắc.
- Native bridge mở `AlarmClock.ACTION_SET_ALARM` hoặc `CalendarContract.ACTION_INSERT`.
- Native bridge có API bắt đầu/tạm dừng/kết thúc focus và mở cài đặt tối ưu pin.
- Config plugin bảo toàn service mới sau mỗi lần `expo prebuild`.

## Test và xác minh

- Backend có test validate thời gian/múi giờ và retry lịch thiếu `datetime_iso`.
- App có test context Phase 5, thẻ xác nhận lịch, persist focus, tạm dừng nhắc và kết thúc phiên.
- Backend: **23 test pass**; app: **47 test pass**.
- ESLint pass cho cả backend và app.
- `:app:compileDebugKotlin` và `assembleDebug` đều **BUILD SUCCESSFUL**.
- APK debug Phase 5 được tạo tại `tomo-app/android/app/build/outputs/apk/debug/app-debug.apk`.

## Kiểm thử thủ công còn cần trên thiết bị

- Xác nhận app Đồng hồ của từng OEM điền đúng giờ báo thức.
- Xác nhận app Lịch mặc định điền đúng tiêu đề/thời gian và cho phép người dùng bấm Lưu.
- Bắt đầu focus, khóa rồi bật màn hình nhiều lần để kiểm tra giới hạn 5 phút.
- Xác nhận không hiện nhắc khi đang mở Tomo.
- Thử trên Xiaomi/Oppo/Vivo/Samsung sau khi cho phép chạy nền.
