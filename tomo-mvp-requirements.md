# TOMO — Tài liệu Yêu cầu Tính năng MVP (v0.2)

> **Trạng thái:** Đã cập nhật theo thảo luận — toàn bộ quyết định phạm vi ở mục 6 đã chốt. Tài liệu sẵn sàng làm nền cho bước bàn kỹ thuật.

---

## 1. Tổng quan sản phẩm

**Tomo** là một ứng dụng Android đóng vai trò **"người bạn AI hóa hình"** — một nhân vật hoạt hình sống cùng người dùng trên điện thoại, có khả năng:

- **Hiện diện thường trực** qua chế độ overlay (giống bong bóng chat Messenger), có animation, kéo thả được.
- **Trò chuyện hai chiều** bằng tin nhắn văn bản và giọng nói (cả trong app lẫn khi đang overlay).
- **Đồng hành cảm xúc**: lắng nghe chia sẻ, phản hồi đồng cảm, phát nhạc hợp tâm trạng.
- **Đồng hành làm việc/học tập**: lên lịch, đặt báo thức, nhắc tập trung khi người dùng mở điện thoại trong giờ làm việc, chúc mừng khi hoàn thành.
- **Ghi nhớ** thông tin cá nhân và ký ức chung để cá nhân hóa hội thoại.
- **Tiến hóa (lớn lên)** theo mức độ tương tác, tạo vòng lặp gắn bó dài hạn.

**Định vị:** Companion app (bạn đồng hành) — KHÔNG phải trợ lý ảo thuần tiện ích. Giá trị cốt lõi là *cảm xúc + sự hiện diện*.

---

## 2. Mục tiêu của MVP

MVP cần trả lời được các giả thuyết kinh doanh/sản phẩm sau:

| # | Giả thuyết cần validate | Tính năng kiểm chứng |
|---|---|---|
| H1 | Người dùng cảm thấy gắn bó với một nhân vật AI "hiện diện" thường trực trên màn hình | Overlay + animation |
| H2 | Người dùng thực sự chia sẻ cảm xúc với AI và thấy được đồng cảm | Chat/voice cảm xúc + memory |
| H3 | Chế độ đồng hành làm việc giúp người dùng tập trung hơn (và họ thích nó) | Focus mode + nhắc khi mở màn hình |
| H4 | Cơ chế tiến hóa tạo động lực quay lại app hằng ngày | Hệ thống tiến hóa + màn tiến độ |
| H5 | Người dùng chấp nhận cấp các quyền nhạy cảm (overlay, mic, thông báo) cho loại app này | Luồng onboarding xin quyền |

**Nguyên tắc MVP:** mọi tính năng chỉ làm ở mức *đủ dùng để kiểm chứng giả thuyết*, không làm hoàn chỉnh.

---

## 3. Phạm vi MVP

### 3.1. Trong phạm vi (In scope)

| Nhóm | Tính năng |
|---|---|
| Hiện diện | Overlay nhân vật (kéo/thả/đóng), animation "nói" khi phản hồi, mở chat từ overlay |
| Hội thoại | Chat text + nhập bằng giọng nói (push-to-talk), phản hồi text + giọng nói (TTS) |
| Trí nhớ | Ghi nhớ facts về người dùng (lưu local, chèn thô vào prompt), dùng lại trong hội thoại |
| Công việc | Đặt báo thức/sự kiện lịch **qua app Đồng hồ/Lịch hệ thống (Intent)** qua hội thoại |
| Focus mode | Phiên làm việc: animation "đang làm việc", nhắc khi mở màn hình, chúc mừng khi xong |
| Cảm xúc | Nhận diện cảm xúc từ văn bản, phản hồi đồng cảm, gợi ý & mở **nhạc YouTube** qua trình duyệt |
| Tiến hóa | 3 giai đoạn tiến hóa, màn hình tiến độ |

### 3.2. Ngoài phạm vi (Out of scope — để bản sau)

- Đọc/đồng bộ hai chiều Google Calendar (MVP chỉ **ghi** sự kiện bằng Intent mở app Lịch).
- Phát hiện người dùng đang dùng app nào (Usage Access) để nhắc khi "lướt mạng xã hội".
- Wake word ("Hey Tomo") / chế độ luôn nghe (always-listening) — MVP dùng push-to-talk.
- Nhận diện cảm xúc từ tông giọng nói.
- Tích hợp API Spotify/YouTube Music (MVP chỉ mở link YouTube trong trình duyệt).
- Nhiều nhân vật, tùy biến ngoại hình, cửa hàng vật phẩm.
- Tài khoản người dùng, đồng bộ đám mây, đa thiết bị.
- Mini-games, streak, bảng xếp hạng, mạng xã hội.
- Bản iOS.

---

## 4. Mô tả tính năng chi tiết & Use Case

**Quy ước:** Actor chính là *Người dùng (User)*; *Tomo* là nhân vật AI; *Hệ thống* là app.

---

### F1 — Onboarding & cấp quyền

**Mô tả:** Lần đầu mở app, người dùng được giới thiệu Tomo, đặt tên cho Tomo (tùy chọn), khai báo tên/sở thích cơ bản của mình, và được dẫn dắt cấp các quyền cần thiết: microphone, hiển thị trên ứng dụng khác (overlay), thông báo.

**Use Case UC-01: Thiết lập lần đầu**

| Mục | Nội dung |
|---|---|
| Tiền điều kiện | Người dùng mới cài app, mở lần đầu |
| Luồng chính | 1. Màn hình chào giới thiệu Tomo (animation chào). 2. Tomo "tự giới thiệu" bằng hội thoại, hỏi tên người dùng. 3. Người dùng nhập tên (và có thể đặt biệt danh cho Tomo). 4. App giải thích *tại sao* cần từng quyền, lần lượt xin: mic → overlay → notification. 5. Hoàn tất → vào màn hình chính, Tomo chào bằng tên người dùng. |
| Luồng thay thế | 3a. Người dùng từ chối một quyền → app ghi nhận, tiếp tục, tính năng liên quan bị tắt và có nút bật lại trong Cài đặt. |
| Kết quả | Hồ sơ người dùng khởi tạo; quyền đã cấp được lưu; memory ghi nhận fact đầu tiên (tên). |

**Ghi chú thiết kế:** Việc xin quyền overlay trên Android bắt buộc người dùng tự bật trong Settings hệ thống — luồng onboarding phải dẫn thẳng đến đúng màn Settings đó và hướng dẫn bằng hình ảnh.

---

### F2 — Floating Overlay Character

**Mô tả:** Khi bật, Tomo xuất hiện dạng floating overlay character nổi trên mọi màn hình (kể cả trên app khác), là ảnh nhân vật **tĩnh** (không animation idle, tiết kiệm pin). Animation duy nhất là **mở/đóng miệng** khi Tomo đang trả lời (phát TTS hoặc hiển thị tin nhắn) — khi trả lời xong thì quay về tĩnh. Người dùng kéo thả tự do, floating overlay character tự hút vào cạnh màn hình khi thả ra. Chạm vào floating overlay character mở **màn hình chat dạng nổi** — một activity nền trong suốt hiển thị giống panel chat đè lên màn hình hiện tại (giới hạn: app đang dùng bên dưới bị pause trong lúc mở — đã chấp nhận). Vuốt floating overlay character xuống vùng "×" ở đáy màn hình để đóng overlay.

**Use Case UC-02: Bật/tắt overlay**

| Mục | Nội dung |
|---|---|
| Tiền điều kiện | Đã cấp quyền overlay |
| Luồng chính | 1. Trong app, người dùng bật công tắc "Hiện Tomo trên màn hình". 2. Hệ thống khởi động foreground service, hiển thị floating overlay character Tomo. 3. Người dùng kéo floating overlay character đến vùng đóng (hoặc tắt công tắc trong app) → overlay biến mất, service dừng. |
| Luồng thay thế | 2a. Chưa cấp quyền → dẫn đến Settings cấp quyền rồi quay lại. |
| Kết quả | Overlay hiện/ẩn đúng; trạng thái bật/tắt được lưu để khôi phục sau reboot. |

**Use Case UC-03: Tương tác với floating overlay character**

| Mục | Nội dung |
|---|---|
| Luồng chính | 1. Người dùng **chạm (tap)** floating overlay character → mở **màn hình chat dạng nổi** (activity nền trong suốt; giới hạn: app bên dưới bị pause trong lúc mở). 2. **Kéo (drag)** floating overlay character → di chuyển; thả ra → hút về cạnh gần nhất. 3. **Kéo xuống vùng ×** → đóng overlay. 4. floating overlay character ở trạng thái tĩnh; chỉ khi Tomo đang phản hồi (TTS/text) → animation mở/đóng miệng; có thông báo/nhắc → badge nhỏ. *(Thao tác phân biệt rõ: kéo = di chuyển, chạm = mở màn chat; push-to-talk nằm trên nút mic trong màn chat nên không xung đột với kéo/chạm trên floating overlay character.)* |
| Kết quả | Tương tác mượt, không che khuất nội dung quá mức, không crash app khác. |

**Use Case UC-04: Trò chuyện từ overlay**

| Mục | Nội dung |
|---|---|
| Luồng chính | 1. Từ màn hình chat dạng nổi, người dùng gõ tin nhắn **hoặc** nhấn-giữ nút mic để nói. 2. Client ghi âm giọng nói thành file audio và **gửi thẳng file ghi âm lên backend**; backend dùng trực tiếp file audio đó làm input gọi API Gemini (kèm ngữ cảnh hội thoại + memory) — không qua bước chuyển giọng nói → văn bản trên client. 3. Tomo trả lời bằng text trong màn chat; nếu người dùng nhập bằng giọng nói → phát luôn giọng nói (TTS). 4. Màn chat có nút đóng để quay về chỉ còn floating overlay character, nút mở full app. |
| Luồng thay thế | 2a. Backend/Gemini không hiểu được nội dung audio → Tomo hỏi lại. 3a. Mất mạng → Tomo báo lỗi bằng giọng/text nhẹ nhàng, giữ nguyên tin nhắn/file ghi âm để gửi lại. |
| Kết quả | Hội thoại từ màn chat dạng nổi đồng bộ với hội thoại trong app (cùng một lịch sử). |

**Yêu cầu phi chức năng:** Overlay phải nhẹ (RAM/CPU); floating overlay character tĩnh ở idle (không tốn GPU), animation "nói" chỉ chạy trong lúc phản hồi; service không bị hệ thống giết bất thường.

---

### F3 — Trò chuyện trong app (màn hình chính)

**Mô tả:** Mở app thấy Tomo ở trung tâm với animation theo trạng thái (idle/vui/buồn/đang làm việc), khung chat phía dưới. Nhập text hoặc nhấn-giữ mic để nói. Tomo phản hồi text; bật loa để nghe giọng nói. Lịch sử hội thoại lưu vô hạn trong app.

**Use Case UC-05: Trò chuyện/chia sẻ cảm xúc trong app**

| Mục | Nội dung |
|---|---|
| Luồng chính | 1. Người dùng mở app → Tomo chào (có thể chào theo buổi: sáng/chiều/tối, gọi tên). 2. Người dùng nhắn/nói chia sẻ (vd: "hôm nay mệt quá"). 3. AI phân tích cảm xúc → phản hồi đồng cảm + animation Tomo đổi theo (an ủi, vui vẻ...). 4. Nếu nội dung chứa thông tin cá nhân mới → hệ thống trích xuất và lưu vào memory (xem F4). 5. Lượt chia sẻ cảm xúc được tính vào tiến độ tiến hóa (xem F8). |
| Luồng thay thế | 3a. Phát hiện nội dung có dấu hiệu nguy hiểm (tự hại...) → Tomo phản hồi theo kịch bản an toàn, gợi ý tìm sự giúp đỡ từ người thân/chuyên gia. *(Cần có kịch bản này ngay từ MVP — yêu cầu an toàn bắt buộc.)* |
| Kết quả | Hội thoại lưu lại; cảm xúc được ghi nhận; tiến độ tiến hóa tăng. |

---

### F4 — Trí nhớ & cá nhân hóa (Memory)

**Mô tả:** Tomo ghi nhớ các "facts" về người dùng (tên, sở thích, bạn bè, công việc, sự kiện quan trọng...) và các "kỷ niệm chung" (lần đầu trò chuyện, lần tiến hóa, phiên làm việc đáng nhớ...). Facts được trích xuất tự động từ hội thoại bằng AI, lưu local, và được đưa vào ngữ cảnh mỗi lần trò chuyện để cá nhân hóa câu trả lời. Người dùng xem/xóa được memory trong Cài đặt (minh bạch + quyền riêng tư).

**Use Case UC-06: Ghi nhớ và sử dụng thông tin cá nhân**

| Mục | Nội dung |
|---|---|
| Luồng chính | 1. Trong hội thoại, người dùng nói "cuối tuần này tớ thi toán". 2. Hệ thống trích xuất fact {sự kiện: thi toán, thời gian: cuối tuần}. 3. Lần trò chuyện sau, Tomo chủ động hỏi "hôm qua thi toán ổn không?". |
| Luồng thay thế | 2a. Fact trùng/mâu thuẫn với fact cũ → cập nhật bản mới nhất. |
| Kết quả | Người dùng cảm nhận "Tomo hiểu mình". |

**Use Case UC-07: Quản lý memory**

| Mục | Nội dung |
|---|---|
| Luồng chính | Cài đặt → "Bộ nhớ của Tomo" → danh sách facts đã nhớ → vuốt để xóa từng mục hoặc "Xóa toàn bộ". |
| Kết quả | Người dùng kiểm soát được dữ liệu cá nhân. |

**Giới hạn MVP:** memory lưu local trên máy; **toàn bộ memory được chèn thô vào prompt mỗi lần gọi LLM** (không chắt lọc) để đơn giản — phiên bản sau nâng cấp thành RAG (chỉ truy xuất facts liên quan); chưa đồng bộ đám mây.

---

### F5 — Đặt lịch & báo thức qua app Đồng hồ / Lịch hệ thống

**Mô tả:** Người dùng yêu cầu bằng ngôn ngữ tự nhiên ("mai 7h đặt báo thức dậy", "thứ 6 này 15h họp"). AI phân tích thành {thời gian, nội dung, loại: báo thức/sự kiện}, hiển thị thẻ xác nhận, rồi app gửi **Android Intent** để đặt vào **app Đồng hồ (Clock) hoặc app Lịch (Calendar) mặc định của máy**. Từ đó, việc kích hoạt báo thức/nhắc lịch do app hệ thống đảm nhiệm — Tomo không phải gửi thông báo. Tomo vẫn **ghi nhớ lịch trình** vào memory để cá nhân hóa hội thoại ("chiều nay 15h họp nhé, cố lên!").

**Use Case UC-08: Đặt báo thức / sự kiện lịch qua app hệ thống**

| Mục | Nội dung |
|---|---|
| Luồng chính | 1. Người dùng: "7h sáng mai đặt báo thức dậy giúp tớ" hoặc "thứ 6 15h đặt lịch họp". 2. AI parse → thẻ xác nhận [Báo thức/Sự kiện — thời gian, nội dung] [Xác nhận] [Hủy]. 3. Người dùng xác nhận → app gửi Intent `AlarmClock.ACTION_SET_ALARM` (báo thức) hoặc Intent `CalendarContract` ACTION_INSERT (sự kiện lịch) → đặt vào **app Đồng hồ/Lịch mặc định** (với lịch, Intent mở app Lịch điền sẵn thông tin, người dùng bấm "Lưu"). 4. Đến giờ → app hệ thống kích hoạt báo/nhắc. 5. Tomo lưu fact lịch trình vào memory để tham chiếu sau này. |
| Luồng thay thế | 2a. Thời gian mơ hồ ("lát nữa") → Tomo hỏi lại cụ thể. 2b. Thời gian ở quá khứ → báo lỗi thân thiện. 3a. Máy không có app Đồng hồ/Lịch hỗ trợ Intent chuẩn (hiếm) → Tomo báo không đặt được, ghi yêu cầu vào memory. |
| Kết quả | Báo thức/lịch nằm trong app hệ thống → kích hoạt đáng tin cậy kể cả khi app Tomo đóng hoặc bị giết; Tomo chỉ giữ vai trò "nhớ" và "đồng hành". |

---

### F6 — Chế độ Đồng hành làm việc (Focus Companion)

**Mô tả:** Tính năng khác biệt hóa chính. Khi người dùng báo "tớ sắp làm X / học Y", Tomo vào **phiên đồng hành**: đổi animation thành "đang làm việc chăm chỉ" (cả trong app lẫn floating overlay character). Trong phiên, mỗi khi người dùng **bật màn hình điện thoại**, Tomo hiện lời nhắc nhẹ nhàng ("Đang làm việc mà, cố lên!"). Người dùng nói/chat "xong việc rồi" → Tomo chúc mừng, kết thúc phiên, cộng tiến độ tiến hóa. Có thể nói "đừng nhắc nữa" để tắt nhắc mà vẫn giữ phiên.

**Use Case UC-09: Bắt đầu phiên làm việc**

| Mục | Nội dung |
|---|---|
| Luồng chính | 1. Người dùng nói/chat: "Tớ sắp học bài 2 tiếng". 2. Tomo xác nhận [Bắt đầu phiên: Học bài — ~2 giờ] → người dùng đồng ý. 3. Animation Tomo → "đang làm việc"; nếu overlay đang bật → floating overlay character cũng đổi animation. 4. Hệ thống bắt đầu theo dõi sự kiện bật màn hình. |
| Luồng thay thế | 1a. Người dùng không nói thời lượng → phiên mở (không giới hạn), Tomo thỉnh thoảng hỏi "vẫn đang làm à?". |
| Kết quả | Phiên focus hoạt động; trạng thái hiển thị rõ trong app. |

**Use Case UC-10: Nhắc khi mở màn hình trong phiên**

| Mục | Nội dung |
|---|---|
| Tiền điều kiện | Đang trong phiên focus; chế độ nhắc đang bật |
| Luồng chính | 1. Người dùng bật màn hình (SCREEN_ON). 2. Trong ~1s, Tomo hiện lời nhắc (qua overlay nếu đang bật, hoặc notification/heads-up nếu không). 3. Lời nhắc đa dạng, không lặp máy móc; có giới hạn tần suất (tối đa 1 lần / X phút, mặc định 5 phút) để không gây phiền. |
| Luồng thay thế | 2a. Người dùng đang ở *trong app Tomo* → không nhắc. |
| Kết quả | Người dùng được nhắc quay lại làm việc mà không thấy quấy rầy. |

**Use Case UC-11: Kết thúc phiên / tắt nhắc**

| Mục | Nội dung |
|---|---|
| Luồng chính | 1. Người dùng: "Tớ làm xong rồi!" → 2. Tomo chúc mừng (animation ăn mừng + lời khen cá nhân hóa), kết thúc phiên, **+1 điểm tiến hóa**. 3. Hoặc người dùng: "Đừng nhắc nữa" → tắt nhắc, phiên vẫn tiếp tục. 4. Hoặc "Nghỉ tí đã" → tạm dừng phiên. |
| Kết quả | Phiên đóng đúng cách; thống kê phiên lưu lại (phục vụ tiến hóa & cảm giác thành tựu). |

**Lưu ý kỹ thuật (ghi nhận sớm):** Bắt sự kiện SCREEN_ON bắt buộc foreground service chạy suốt phiên → tốn pin; phải tối ưu và thông báo rõ cho người dùng. Phát hiện "đang lướt MXH" (app đang mở là gì) cần quyền Usage Access — **ngoài MVP**.

---

### F7 — Đồng cảm cảm xúc & phát nhạc theo tâm trạng

**Mô tả:** Khi người dùng chia sẻ cảm xúc, AI gán nhãn cảm xúc (vui/buồn/stress/mệt/hào hứng/cô đơn...) và: (a) phản hồi lời lẽ + animation tương ứng; (b) **đề xuất một bài nhạc** hợp mood. Nếu người dùng đồng ý, app yêu cầu Gemini (qua API) chọn một bài phù hợp — prompt kèm theo mood + gu nhạc đã lưu trong memory — Gemini trả về **link YouTube** của bài đó, app mở link bằng **trình duyệt/app YouTube mặc định** (Intent `ACTION_VIEW`). Không cần tích hợp bất kỳ dịch vụ nhạc nào.

**Use Case UC-12: Phản hồi cảm xúc + gợi ý nhạc**

| Mục | Nội dung |
|---|---|
| Luồng chính | 1. Người dùng: "Hôm nay buồn quá, bị sếp mắng". 2. AI: nhãn cảm xúc = buồn → Tomo an ủi (text + giọng + animation an ủi). 3. Tomo đề xuất: "Tớ mở bài nhạc cho đỡ buồn nhé?" [Có] [Thôi]. 4. [Có] → app hỏi Gemini chọn bài (prompt gồm mood + gu nhạc từ memory) → Gemini trả **link YouTube** → app mở link bằng Intent `ACTION_VIEW` (trình duyệt, hoặc app YouTube nếu máy có). 5. Memory ghi nhận nếu người dùng khen/chê bài → cải thiện gợi ý sau. |
| Luồng thay thế | 4a. LLM trả link không hợp lệ/không mở được → Tomo xin lỗi và thử bài khác (tối đa 2 lần). 4b. Người dùng từ chối → tiếp tục trò chuyện bình thường. |
| Kết quả | Người dùng cảm thấy được lắng nghe; tương tác tính vào tiến hóa. |

**Rủi ro đã ghi nhận (đã chốt phương án):** LLM có thể "bịa" link YouTube không tồn tại (hallucination). Giảm thiểu: bật Google Search grounding của Gemini nếu gói API cho phép, hoặc retry như luồng 4a. MVP chấp nhận rủi ro này — đổi lại được trải nghiệm "nhạc thật theo gu người dùng" mà không cần tích hợp dịch vụ nhạc.

---

### F8 — Hệ thống Tiến hóa (Evolution)

**Mô tả:** Tomo "lớn lên" qua các giai đoạn ngoại hình. Mỗi **lượt chia sẻ cảm xúc hợp lệ** hoặc **phiên làm việc hoàn thành** = +1 điểm kết nối. Mốc tiến hóa: **Stage 1 → 2: 10 điểm; Stage 2 → 3: 30 điểm** (tổng 40). MVP có 3 stage. Có màn hình tiến độ (thanh progress + hình ảnh stage hiện tại + hình mờ stage kế tiếp). Khi tiến hóa: cutscene animation đặc biệt + Tomo cảm ơn.

**Use Case UC-13: Tích điểm và tiến hóa**

| Mục | Nội dung |
|---|---|
| Luồng chính | 1. Hoàn thành hành động +điểm → hệ thống cộng điểm, cập nhật thanh tiến độ (có thể hiện toast "+1 kết nối 💙"). 2. Đạt mốc → cutscene tiến hóa (ngoại hình đổi), memory lưu "kỷ niệm tiến hóa". 3. Người dùng xem màn "Hành trình của Tomo": stage hiện tại, điểm hiện có/điểm cần, ảnh các stage. |
| Luồng thay thế | 1a. Chống farm: **MVP chưa áp dụng** (đã chốt lại khi bàn kỹ thuật) — nếu thực tế cho thấy lạm dụng, bản sau cân nhắc giới hạn điểm chia sẻ cảm xúc/ngày. |
| Kết quả | Vòng lặp động lực: tương tác → tiến bộ → muốn tương tác tiếp. |

❓ **Cần bàn:** số stage và ngưỡng điểm (10/30 hay 10/30/60/100...?) phụ thuộc số lượng asset nhân vật bạn có thể sản xuất. Đề xuất MVP: **3 stage, ngưỡng 10 và 30**.

---

## 5. Đánh giá tính khả thi (mức tính năng, chưa bàn kỹ thuật sâu)

| Tính năng | Khả thi | Rủi ro / ghi chú |
|---|---|---|
| Floating overlay character kéo-thả | ✅ Cao | Cơ chế chuẩn của Android (như chat heads). Phụ thuộc người dùng cấp quyền thủ công — cần onboarding tốt. |
| Animation nhân vật | ✅ Cao | Sprite 2D/Lottie; floating overlay character tĩnh ở idle, chỉ chạy animation "nói" khi phản hồi → tiết kiệm pin. |
| Chat AI (text) | ✅ Cao | Gemini API + mạng. Rủi ro chính: **chi phí API theo lượt dùng** và độ trễ. |
| Nhập giọng nói (audio → Gemini) | ✅ Cao | Client ghi âm thành file audio và gửi thẳng lên backend; backend dùng file audio làm input gọi API Gemini (Gemini hỗ trợ audio input, bao gồm tiếng Việt). Không dùng Android SpeechRecognizer. Rủi ro: chi phí API tính theo audio, độ trễ upload file. |
| TTS (chữ → giọng) | ✅ Cao | MVP dùng TTS mặc định của máy (đã chốt) — giọng hơi "máy" nhưng đủ validate. |
| Mic khi đang overlay | ⚠️ Trung bình | Android bắt buộc foreground service khi dùng mic từ nền (đi kèm notification thường trực). MVP chốt **push-to-talk trên nút mic trong màn hình chat dạng nổi**, không luôn-nghe. |
| Memory cá nhân hóa | ✅ Cao | Lưu local + trích xuất bằng Gemini; MVP chèn thô toàn bộ memory vào prompt, sau nâng cấp RAG. |
| Báo thức/lịch qua app hệ thống | ✅ Rất cao | Intent `AlarmClock`/`Calendar` → app Đồng hồ/Lịch lo việc kích hoạt; Tomo chỉ ghi nhớ vào memory. |
| Nhắc khi bật màn hình | ⚠️ Trung bình | Làm được qua foreground service bắt SCREEN_ON, nhưng: tốn pin, và OEM Trung Quốc (Xiaomi/Oppo...) hay giết service nền → cần hướng dẫn user tắt tối ưu pin cho app. |
| Phát nhạc theo mood (link YouTube) | ⚠️ Trung bình | Gemini chọn bài → trả link YouTube → mở qua Intent `ACTION_VIEW`. Rủi ro: link hallucinate → retry/Search grounding. |
| Nhận diện cảm xúc từ text | ✅ Cao | LLM làm tốt, kể cả tiếng Việt. |
| Tiến hóa + màn tiến độ | ✅ Cao | Logic đơn giản; chi phí nằm ở **asset nghệ thuật** (3 bộ ngoại hình + animation). |
| Kịch bản an toàn (nội dung tự hại) | ✅ Bắt buộc | Cần viết sẵn kịch bản + guardrail trong prompt hệ thống. |

---

## 6. ✅ Quyết định đã chốt (đã thống nhất sau thảo luận)

1. **Nguồn nhạc:** Gemini chọn bài → trả **link YouTube** → mở bằng trình duyệt/app YouTube mặc định. Không tích hợp dịch vụ nhạc. Chấp nhận rủi ro link "hallucinate" (retry tối đa 2 lần / Search grounding).
2. **Tương tác giọng nói khi overlay:** push-to-talk trên **nút mic trong màn hình chat dạng nổi** (chạm floating overlay character = mở màn chat dạng nổi, kéo floating overlay character = di chuyển) → không xung đột thao tác trên floating overlay character.
3. **Đặt lịch/báo thức:** dùng Intent tới **app Đồng hồ/Lịch hệ thống**; Tomo không gửi thông báo, chỉ ghi nhớ lịch trình vào memory.
4. **Nhắc khi bật màn hình:** chỉ nhắc "đừng sao nhãng" chung, **không** phát hiện app đang mở.
5. **Giọng Tomo:** TTS mặc định của máy.
6. **Ngôn ngữ:** tiếng Việt cho MVP.
7. **Nhân vật:** ngoại hình đã có sẵn (asset do bạn cung cấp); 3 stage tiến hóa dùng 3 bộ ngoại hình.
8. **Backend AI:** API **Gemini**; mọi ngữ cảnh cá nhân hóa lấy từ memory local.
9. **Memory:** lưu local; MVP **chèn thô toàn bộ vào prompt** (không chắt lọc); phiên bản sau nâng cấp thành **RAG**.
10. **Định danh:** **không cần tài khoản**, hoàn toàn local. Hệ quả đã chấp nhận: gỡ app = mất dữ liệu Tomo.
11. **Tiến hóa:** **3 stage, mốc 10 và 30 điểm**; MVP **chưa áp dụng** quy tắc chống farm (cân nhắc bổ sung ở bản sau nếu thấy lạm dụng).
12. **Nhập giọng nói:** client ghi âm thành file audio và **gửi thẳng file ghi âm lên backend**; backend dùng file audio làm input gọi API Gemini trực tiếp — **không dùng Android SpeechRecognizer**, không qua bước STT trên client.

---

## 7. Đề xuất thứ tự build MVP (gợi ý)

1. **M1 — Lõi hội thoại:** app chat text + LLM + memory cơ bản (F3, F4 rút gọn).
2. **M2 — Hiện diện:** overlay floating overlay character + animation + chat từ overlay (F2) + onboarding quyền (F1).
3. **M3 — Giọng nói:** ghi âm push-to-talk → gửi file audio lên backend → Gemini xử lý trực tiếp; TTS phản hồi — áp dụng cả trong app lẫn overlay (F3, F2 nâng cấp).
4. **M4 — Đồng hành làm việc:** báo thức/lịch qua Intent hệ thống (F5) + focus mode + nhắc màn hình (F6).
5. **M5 — Cảm xúc & tiến hóa:** nhạc theo mood (F7) + hệ thống tiến hóa (F8) + hoàn thiện memory.

Mỗi milestone đều có thể demo/test với người dùng thật độc lập.

---

## 8. Chỉ số đo lường MVP (gợi ý)

- Tỉ lệ hoàn thành onboarding cấp quyền (đo H5).
- Số phiên chat/ngày, retention D1/D7 (đo H1, H2).
- Số phiên focus được tạo & tỉ lệ hoàn thành (đo H3).
- Tỉ lệ người dùng đạt stage 2 (đo H4).
- Số lượt dùng giọng nói vs text.
