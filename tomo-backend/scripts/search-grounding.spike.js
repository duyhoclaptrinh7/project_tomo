import { GoogleGenAI } from '@google/genai';

import { config } from '../src/config/env.js';

const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });

const resultSchema = {
  type: 'object',
  properties: {
    song_title: { type: ['string', 'null'] },
    youtube_url: { type: ['string', 'null'] },
    found: { type: 'boolean' },
  },
  required: ['song_title', 'youtube_url', 'found'],
};

async function runSpike() {
  const response = await ai.models.generateContent({
    model: config.GEMINI_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text:
              'Tìm một bài hát Việt nhẹ nhàng phù hợp khi buồn. Ưu tiên link YouTube thật. ' +
              'Nếu không tìm được link phù hợp, trả found=false.',
          },
        ],
      },
    ],
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: 'application/json',
      responseJsonSchema: resultSchema,
    },
  });

  const parsed = JSON.parse(response.text);
  const metadata = response.candidates?.[0]?.groundingMetadata;
  // Spike CLI được phép in trực tiếp ra stdout để người dev đọc kết quả.
  /* eslint-disable no-console */
  console.log(
    JSON.stringify(
      {
        sdkVersion: '2.21.0',
        model: config.GEMINI_MODEL,
        parsed,
        webSearchQueries: metadata?.webSearchQueries ?? [],
        groundingChunks: metadata?.groundingChunks ?? [],
      },
      null,
      2,
    ),
  );
}

runSpike().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
/* eslint-enable no-console */
