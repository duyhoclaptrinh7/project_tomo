# TOMO Backend

Node.js LTS: v26.3.0 tại thời điểm scaffold Phase 0.

## Chạy local

```powershell
npm install
Copy-Item .env.example .env
# Điền GEMINI_API_KEY vào .env
npm run dev
```

Thiếu `GEMINI_API_KEY` thì server dừng ngay với thông báo lỗi và không in giá trị secret.

Phase 0 chỉ gồm foundation, route/service/provider và config fail-fast. Nghiệp vụ `/chat` đầy đủ hoàn thiện ở Phase 1; `/music-suggest` ở Phase 6.
