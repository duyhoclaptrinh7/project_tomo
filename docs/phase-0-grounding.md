# Phase 0 — Spike Google Search grounding

## Kết luận

- SDK đã cài và pin: `@google/genai@2.21.0`.
- Model ban đầu `gemini-2.5-flash` bị API trả `404 NOT_FOUND` với thông báo model không còn khả dụng cho tài khoản mới.
- Đã đổi default sang `gemini-3.6-flash`; request đi tới API thành công nhưng bị `429 RESOURCE_EXHAUSTED`, nên **chưa xác nhận được output grounding thực tế**.
- Blocker hiện tại là quota/billing của tài khoản Gemini, không phải lỗi cú pháp SDK hay thiếu script.

## Cú pháp đã xác nhận hợp lệ ở tầng request

```js
const response = await ai.models.generateContent({
  model: config.GEMINI_MODEL,
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
  config: {
    tools: [{ googleSearch: {} }],
    responseMimeType: 'application/json',
    responseJsonSchema: resultSchema,
  },
});
```

Grounding metadata dự kiến đọc từ:

```js
response.candidates?.[0]?.groundingMetadata;
```

## Cách chạy regression

```powershell
cd d:\project_tomo\tomo-backend
npm run spike:search
```

Script giữ lại: `d:\project_tomo\tomo-backend\scripts\search-grounding.spike.js`.

## Việc cần làm trước Phase 6

1. Bật billing hoặc tăng quota cho tài khoản Gemini.
2. Chạy lại `npm run spike:search`.
3. Xác nhận:
   - URL YouTube thật.
   - `found: true/false`.
   - `webSearchQueries`/`groundingChunks`.
   - Phân biệt rõ `found: false` với lỗi quota/network/SDK.
