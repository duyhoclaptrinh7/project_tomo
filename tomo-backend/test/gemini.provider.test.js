import { beforeEach, describe, expect, it } from 'vitest';

import { generateChatResponse, setGeminiClient } from '../src/providers/gemini.provider.js';

const validPayload = () => ({
  reply_text: 'OK',
  emotion_label: null,
  should_speak: false,
  action: { type: 'none', params: {} },
  new_facts: [],
  point_event: null,
});

async function withClient(client, run) {
  const restore = setGeminiClient(client);
  try {
    return await run();
  } finally {
    restore();
  }
}

describe('Gemini provider', () => {
  beforeEach(() => {
    setGeminiClient(undefined);
  });

  it('calls Gemini once for a valid structured response', async () => {
    let calls = 0;
    await withClient(
      {
        models: {
          generateContent: async () => {
            calls += 1;
            return { text: JSON.stringify(validPayload()) };
          },
        },
      },
      async () => {
        expect(await generateChatResponse('prompt', [])).toEqual(validPayload());
      },
    );
    expect(calls).toBe(1);
  });

  it('retries an invalid action exactly once', async () => {
    let calls = 0;
    await withClient(
      {
        models: {
          generateContent: async () => {
            calls += 1;
            if (calls === 1) {
              return {
                text: JSON.stringify({
                  ...validPayload(),
                  action: { type: 'set_animation', params: {} },
                }),
              };
            }
            return {
              text: JSON.stringify({
                ...validPayload(),
                action: { type: 'set_animation', params: { animation_state: 'idle' } },
              }),
            };
          },
        },
      },
      async () => {
        const result = await generateChatResponse('prompt', []);
        expect(result.action.params.animation_state).toBe('idle');
      },
    );
    expect(calls).toBe(2);
  });

  it('does not retry quota failures', async () => {
    let calls = 0;
    await expect(
      withClient(
        {
          models: {
            generateContent: async () => {
              calls += 1;
              throw Object.assign(new Error('RESOURCE_EXHAUSTED'), { status: 429 });
            },
          },
        },
        () => generateChatResponse('prompt', []),
      ),
    ).rejects.toMatchObject({ code: 'GEMINI_ERROR' });
    expect(calls).toBe(1);
  });
});
