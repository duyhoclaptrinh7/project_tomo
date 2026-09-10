import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { File as ExpoFile, Paths } from 'expo-file-system';
import { Alert, AppState, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { handlePointEvent, runAction } from '../src/actions/actionExecutor.js';
import { resolveEvolutionStage, useAppStore } from '../src/store/useAppStore.js';
import { appendFacts, readMemory, writeMemory } from '../src/services/storage/memoryStorage.js';
import { appendHistoryMessage, readRecentHistory } from '../src/services/storage/historyStorage.js';
import { readAppState, writeAppState } from '../src/services/storage/appStateStorage.js';

vi.mock('expo-file-system', () => {
  const files = new Map();
  class File {
    constructor(...uris) {
      this.uri = uris.map((uri) => (typeof uri === 'string' ? uri : uri.uri)).join('/');
    }
    get exists() {
      return files.has(this.uri);
    }
    async text() {
      return files.get(this.uri) ?? '';
    }
    async write(content, options = {}) {
      files.set(this.uri, options.append ? (files.get(this.uri) ?? '') + content : content);
    }
    delete() {
      files.delete(this.uri);
    }
    move(destination) {
      const destUri = typeof destination === 'string' ? destination : destination.uri;
      files.set(destUri, files.get(this.uri));
      files.delete(this.uri);
    }
  }
  File.__files = files;
  globalThis.__tomoFiles = files;
  return { File, Paths: { document: { uri: 'file:///tmp' } }, __files: files };
});

/** Mock sendChat trả về đúng hợp đồng, dùng chung cho các chat flow test. */
const mockSendChat = vi.fn();

vi.mock('../src/services/api/chatApi.js', () => ({
  sendChat: (...args) => mockSendChat(...args),
}));

/** Lazy import ChatScreen sau khi mock đã đăng ký. */
let ChatScreen;

/** Reset state và filesystem mock giữa từng test. */
function resetStorage() {
  const files = ExpoFile.__files ?? globalThis.__tomoFiles;
  files.clear();
  mockSendChat.mockReset();
  useAppStore.setState({
    evolutionPoints: 0,
    evolutionStage: 1,
    isOverlayEnabled: false,
    isFocusSessionActive: false,
    onboarded: false,
  });
}

describe('Phase 2 storage', () => {
  beforeEach(resetStorage);

  it('memory missing file defaults empty and merge deduplicates facts', async () => {
    expect(await readMemory()).toBe('');
    await writeMemory('- Thích mèo\n');
    const next = await appendFacts(['Thích mèo', 'Đang học Rust']);
    expect(next).toContain('- Thích mèo');
    expect(next.match(/Thích mèo/g)).toHaveLength(1);
    expect(next).toContain('- Đang học Rust');
  });

  it('overwrites existing fact when simple topic conflicts', async () => {
    await writeMemory('# Ký ức của Tomo\n\n- Tên: Nam\n- Đang sống tại: Hà Nội\n- Thích mèo\n');
    const next = await appendFacts(['Đang sống tại: Đà Nẵng', 'Thích mèo']);
    expect(next).toContain('- Đang sống tại: Đà Nẵng');
    expect(next).not.toContain('- Đang sống tại: Hà Nội');
    expect(next).toContain('- Tên: Nam');
    expect(next).toContain('- Thích mèo');
  });

  it('history appends JSONL and request history keeps only latest 20', async () => {
    for (let index = 0; index < 25; index += 1) {
      await appendHistoryMessage({ role: 'user', text: `msg-${index}` });
    }
    const recent = await readRecentHistory();
    expect(recent).toHaveLength(20);
    expect(recent.at(-1).text).toBe('msg-24');
    expect(recent[0].text).toBe('msg-5');
    expect(await readRecentHistory(100)).toHaveLength(25);
  });

  it('app state persists through atomic replacement and survives invalid JSON', async () => {
    await writeAppState({ evolutionPoints: 10, evolutionStage: 2 });
    expect(await readAppState()).toMatchObject({ evolutionPoints: 10, evolutionStage: 2 });
    const target = new ExpoFile(Paths.document, 'app_state.json');
    await target.write('{broken');
    expect(await readAppState()).toMatchObject({ evolutionPoints: 0, evolutionStage: 1 });
  });
});

describe('Phase 2 points and actions', () => {
  beforeEach(resetStorage);

  it('calculates MVP stage thresholds', () => {
    expect(resolveEvolutionStage(9)).toBe(1);
    expect(resolveEvolutionStage(10)).toBe(2);
    expect(resolveEvolutionStage(30)).toBe(3);
  });

  it('adds one point and persists the new stage', async () => {
    await useAppStore.getState().addConnectionPoint();
    expect(useAppStore.getState()).toMatchObject({ evolutionPoints: 1, evolutionStage: 1 });
    expect(await readAppState()).toMatchObject({ evolutionPoints: 1 });
  });

  it('stage transitions at 10 and 30 point thresholds', async () => {
    useAppStore.setState({ evolutionPoints: 9, evolutionStage: 1 });
    await writeAppState({ evolutionPoints: 9, evolutionStage: 1 });
    await useAppStore.getState().addConnectionPoint();
    expect(useAppStore.getState()).toMatchObject({ evolutionPoints: 10, evolutionStage: 2 });

    useAppStore.setState({ evolutionPoints: 29, evolutionStage: 2 });
    await writeAppState({ evolutionPoints: 29, evolutionStage: 2 });
    await useAppStore.getState().addConnectionPoint();
    expect(useAppStore.getState()).toMatchObject({ evolutionPoints: 30, evolutionStage: 3 });
  });

  it('focus_session_active is included in session_context', () => {
    useAppStore.setState({ isFocusSessionActive: true });
    expect(useAppStore.getState().isFocusSessionActive).toBe(true);
    useAppStore.setState({ isFocusSessionActive: false });
    expect(useAppStore.getState().isFocusSessionActive).toBe(false);
  });

  it('executes set_animation and safely ignores future actions', async () => {
    expect(
      await runAction({ type: 'set_animation', params: { animation_state: 'happy' } }),
    ).toEqual({ animationState: 'happy' });
    expect(await runAction({ type: 'set_animation', params: {} })).toEqual({
      animationState: 'idle',
    });
    expect(await runAction({ type: 'start_focus_session', params: {} })).toEqual({});
  });

  it('none action produces no side effects', async () => {
    expect(await runAction({ type: 'none' })).toEqual({});
    expect(await runAction({ type: 'none', params: {} })).toEqual({});
    expect(await runAction(null)).toEqual({});
    expect(await runAction(undefined)).toEqual({});
  });

  it('missing or undefined params does not crash', async () => {
    expect(await runAction({ type: 'set_animation' })).toEqual({ animationState: 'idle' });
    expect(await runAction({ type: 'set_animation', params: undefined })).toEqual({
      animationState: 'idle',
    });
  });

  it('actionExecutor handles point_event emotional_share and end_focus_session', async () => {
    const res1 = await runAction({ type: 'none' }, { pointEvent: 'emotional_share' });
    expect(res1).toEqual({ toast: '+1 kết nối 💙', pointAwarded: true });
    expect(useAppStore.getState().evolutionPoints).toBe(1);

    const res2 = await runAction({ type: 'end_focus_session', params: {} });
    expect(res2).toEqual({ toast: '+1 kết nối 💙', pointAwarded: true });
    expect(useAppStore.getState().evolutionPoints).toBe(2);

    const res3 = await handlePointEvent('emotional_share');
    expect(res3).toEqual({ toast: '+1 kết nối 💙', pointAwarded: true });
    expect(useAppStore.getState().evolutionPoints).toBe(3);
  });
});

describe('Phase 2 chat flow', () => {
  beforeEach(async () => {
    resetStorage();
    if (!ChatScreen) {
      const mod = await import('../src/screens/ChatScreen.jsx');
      ChatScreen = mod.default;
    }
  });

  it('sends full context, persists both messages, merges facts and awards toast', async () => {
    mockSendChat.mockResolvedValueOnce({
      reply_text: 'Mình nghe đây',
      emotion_label: 'buồn',
      should_speak: false,
      action: { type: 'set_animation', params: { animation_state: 'comfort' } },
      new_facts: ['Hôm nay buồn vì thi trượt'],
      point_event: 'emotional_share',
    });

    await render(<ChatScreen />);
    await fireEvent.changeText(screen.getByPlaceholderText('Nhắn cho Tomo...'), 'Buồn quá');
    await fireEvent.press(screen.getByRole('button', { name: 'Gửi' }));

    await waitFor(() => expect(mockSendChat).toHaveBeenCalledTimes(1));
    const payload = mockSendChat.mock.calls[0][0];
    expect(payload).toMatchObject({
      input: { type: 'text', text: 'Buồn quá' },
      memory_md: '',
      session_context: { focus_session_active: false, evolution_stage: 1, evolution_points: 0 },
    });
    expect(payload.recent_history).toEqual([]);
    expect(await readMemory()).toContain('Hôm nay buồn vì thi trượt');
    expect((await readRecentHistory()).map((message) => message.role)).toEqual(['user', 'tomo']);
    expect(useAppStore.getState().evolutionPoints).toBe(1);
    expect(screen.getByText('+1 kết nối 💙')).toBeTruthy();
    expect(screen.getByText('Tomo ở bên bạn')).toBeTruthy();
  });

  it('keeps failed user message and retry does not duplicate it', async () => {
    mockSendChat.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({
      reply_text: 'Xong rồi',
      emotion_label: null,
      should_speak: false,
      action: { type: 'none', params: {} },
      new_facts: [],
      point_event: null,
    });

    await render(<ChatScreen />);
    await fireEvent.changeText(screen.getByPlaceholderText('Nhắn cho Tomo...'), 'Alo');
    await fireEvent.press(screen.getByRole('button', { name: 'Gửi' }));
    await waitFor(() => expect(screen.getByText('Gửi lại')).toBeTruthy());
    expect(screen.getByText('Alo')).toBeTruthy();
    expect(await readRecentHistory()).toEqual([]);

    await fireEvent.press(screen.getByText('Gửi lại'));
    await waitFor(() => expect(mockSendChat).toHaveBeenCalledTimes(2));
    expect(screen.getAllByText('Alo')).toHaveLength(1);
    expect((await readRecentHistory()).map((message) => message.text)).toEqual(['Alo', 'Xong rồi']);
  });

  it('handles GEMINI_ERROR response appropriately', async () => {
    const geminiError = new Error('Request failed with status code 502');
    geminiError.response = {
      status: 502,
      data: { error: { code: 'GEMINI_ERROR', message: 'Gemini API lỗi' } },
    };
    mockSendChat.mockRejectedValueOnce(geminiError);

    await render(<ChatScreen />);
    await fireEvent.changeText(screen.getByPlaceholderText('Nhắn cho Tomo...'), 'Xin chào');
    await fireEvent.press(screen.getByRole('button', { name: 'Gửi' }));
    await waitFor(() => expect(screen.getByText('Gửi lại')).toBeTruthy());
    expect(screen.getByText('Xin chào')).toBeTruthy();
    expect(await readRecentHistory()).toEqual([]);
  });

  it('multi-turn chat includes valid recent_history with role, text, and ts (ISO 8601)', async () => {
    const prevTs1 = '2026-09-09T08:00:00.000Z';
    const prevTs2 = '2026-09-09T08:00:02.000Z';
    await appendHistoryMessage({ role: 'user', text: 'Chào Tomo', ts: prevTs1 });
    await appendHistoryMessage({ role: 'tomo', text: 'Chào bạn!', ts: prevTs2 });

    mockSendChat.mockResolvedValueOnce({
      reply_text: 'Hôm nay trời đẹp',
      emotion_label: 'vui',
      should_speak: false,
      action: { type: 'set_animation', params: { animation_state: 'happy' } },
      new_facts: [],
      point_event: null,
    });

    await render(<ChatScreen />);
    await fireEvent.changeText(
      screen.getByPlaceholderText('Nhắn cho Tomo...'),
      'Thời tiết thế nào?',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Gửi' }));

    await waitFor(() => expect(mockSendChat).toHaveBeenCalledTimes(1));
    const payload = mockSendChat.mock.calls[0][0];

    expect(payload.recent_history).toHaveLength(2);
    expect(payload.recent_history[0]).toEqual({
      role: 'user',
      text: 'Chào Tomo',
      ts: prevTs1,
    });
    expect(payload.recent_history[1]).toEqual({
      role: 'tomo',
      text: 'Chào bạn!',
      ts: prevTs2,
    });

    // Xác nhận ts là ISO 8601 hợp lệ theo schema backend
    const isoRegex =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/;
    for (const msg of payload.recent_history) {
      expect(msg.ts).toMatch(isoRegex);
      expect(Number.isNaN(Date.parse(msg.ts))).toBe(false);
    }
  });

  it('hydrates recent chat history into UI messages on mount', async () => {
    await appendHistoryMessage({
      role: 'user',
      text: 'Tin nhắn cũ từ hôm qua',
      ts: '2026-09-09T10:00:00.000Z',
    });
    await appendHistoryMessage({
      role: 'tomo',
      text: 'Tomo chào bạn hôm qua',
      ts: '2026-09-09T10:00:02.000Z',
    });

    await render(<ChatScreen />);
    await waitFor(() => {
      expect(screen.getByText('Tin nhắn cũ từ hôm qua')).toBeTruthy();
      expect(screen.getByText('Tomo chào bạn hôm qua')).toBeTruthy();
    });
  });

  it('falls back to emotion_label for avatar animation when action has no set_animation', async () => {
    mockSendChat.mockResolvedValueOnce({
      reply_text: 'Thật tuyệt vời!',
      emotion_label: 'vui',
      should_speak: false,
      action: { type: 'none', params: {} },
      new_facts: [],
      point_event: null,
    });

    await render(<ChatScreen />);
    await fireEvent.changeText(screen.getByPlaceholderText('Nhắn cho Tomo...'), 'Vừa nhận tin vui');
    await fireEvent.press(screen.getByRole('button', { name: 'Gửi' }));

    await waitFor(() => expect(mockSendChat).toHaveBeenCalledTimes(1));
    expect(screen.getByText('Thật tuyệt vời!')).toBeTruthy();
    expect(screen.getByText('Tomo vui')).toBeTruthy();
  });
});
