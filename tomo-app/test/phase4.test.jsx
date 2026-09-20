import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { File as ExpoFile } from 'expo-file-system';
import { NativeModules } from 'react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const phase4Mocks = vi.hoisted(() => ({
  requestPermission: vi.fn(),
  setAudioMode: vi.fn(),
  recorder: {
    uri: 'file:///tmp/voice.m4a',
    prepareToRecordAsync: vi.fn(),
    record: vi.fn(),
    stop: vi.fn(),
  },
  sendChat: vi.fn(),
  speechSpeak: vi.fn(),
  speechStop: vi.fn(),
}));

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
    async base64() {
      return files.get(this.uri) ?? '';
    }
    async write(content, options = {}) {
      files.set(this.uri, options.append ? (files.get(this.uri) ?? '') + content : content);
    }
  }
  File.__files = files;
  return { File, Paths: { document: { uri: 'file:///tmp' } } };
});

vi.mock('expo-audio', () => ({
  RecordingPresets: { HIGH_QUALITY: {} },
  requestRecordingPermissionsAsync: phase4Mocks.requestPermission,
  setAudioModeAsync: phase4Mocks.setAudioMode,
  useAudioRecorder: () => phase4Mocks.recorder,
}));

vi.mock('expo-speech', () => ({
  speak: phase4Mocks.speechSpeak,
  stop: phase4Mocks.speechStop,
}));

vi.mock('../src/services/api/chatApi.js', () => ({
  sendChat: phase4Mocks.sendChat,
}));

import ChatScreen from '../src/screens/ChatScreen.jsx';
import { useAppStore } from '../src/store/useAppStore.js';

function successfulResponse(overrides = {}) {
  return {
    reply_text: 'Tớ nghe thấy bạn rồi.',
    emotion_label: 'vui',
    should_speak: true,
    action: { type: 'none', params: {} },
    new_facts: [],
    point_event: null,
    ...overrides,
  };
}

describe('Phase 4 — voice push-to-talk và TTS', () => {
  beforeEach(() => {
    ExpoFile.__files.clear();
    ExpoFile.__files.set('file:///tmp/voice.m4a', 'QUJD');
    vi.clearAllMocks();

    phase4Mocks.requestPermission.mockResolvedValue({ granted: true, status: 'granted' });
    phase4Mocks.setAudioMode.mockResolvedValue(undefined);
    phase4Mocks.recorder.prepareToRecordAsync.mockResolvedValue(undefined);
    phase4Mocks.recorder.stop.mockResolvedValue(undefined);
    phase4Mocks.sendChat.mockResolvedValue(successfulResponse());
    phase4Mocks.speechStop.mockResolvedValue(undefined);
    phase4Mocks.speechSpeak.mockImplementation((text, options) => {
      options?.onStart?.();
      options?.onDone?.();
    });

    NativeModules.TomoNativeModule.setOverlaySpeaking = vi.fn(async () => true);
    useAppStore.setState({
      evolutionPoints: 0,
      evolutionStage: 1,
      isFocusSessionActive: false,
      onboarded: true,
      isHydrated: true,
    });
  });

  it('giữ mic, gửi audio base64 và phát TTS tiếng Việt', async () => {
    await render(<ChatScreen />);

    const mic = screen.getByTestId('mic-button');
    await fireEvent(mic, 'pressIn');
    await waitFor(() => expect(phase4Mocks.recorder.record).toHaveBeenCalledOnce());
    await fireEvent(screen.getByTestId('mic-button'), 'pressOut');

    await waitFor(() => expect(phase4Mocks.sendChat).toHaveBeenCalledOnce());
    expect(phase4Mocks.sendChat.mock.calls[0][0].input).toEqual({
      type: 'audio',
      audio_base64: 'QUJD',
      audio_mime: 'audio/mp4',
    });
    expect(phase4Mocks.speechSpeak).toHaveBeenCalledWith(
      'Tớ nghe thấy bạn rồi.',
      expect.objectContaining({ language: 'vi-VN' }),
    );
    expect(NativeModules.TomoNativeModule.setOverlaySpeaking).toHaveBeenNthCalledWith(1, true);
    expect(NativeModules.TomoNativeModule.setOverlaySpeaking).toHaveBeenLastCalledWith(false);
  });

  it('giữ nguyên payload audio để gửi lại sau lỗi mạng', async () => {
    phase4Mocks.sendChat
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(successfulResponse({ should_speak: false }));

    await render(<ChatScreen />);
    await fireEvent(screen.getByTestId('mic-button'), 'pressIn');
    await waitFor(() => expect(phase4Mocks.recorder.record).toHaveBeenCalledOnce());
    await fireEvent(screen.getByTestId('mic-button'), 'pressOut');

    await waitFor(() => expect(screen.getByText('Gửi lại')).toBeTruthy());
    await fireEvent.press(screen.getByText('Gửi lại'));
    await waitFor(() => expect(phase4Mocks.sendChat).toHaveBeenCalledTimes(2));

    expect(phase4Mocks.sendChat.mock.calls[1][0].input).toEqual(
      phase4Mocks.sendChat.mock.calls[0][0].input,
    );
    expect(screen.getAllByText('🎤 Tin nhắn thoại')).toHaveLength(1);
  });

  it('báo nhẹ nhàng khi người dùng từ chối quyền microphone', async () => {
    phase4Mocks.requestPermission.mockResolvedValueOnce({ granted: false, status: 'denied' });

    await render(<ChatScreen />);
    await fireEvent(screen.getByTestId('mic-button'), 'pressIn');
    await fireEvent(screen.getByTestId('mic-button'), 'pressOut');

    await waitFor(() =>
      expect(screen.getByText('Tomo cần quyền microphone để nghe bạn nói.')).toBeTruthy(),
    );
    expect(phase4Mocks.sendChat).not.toHaveBeenCalled();
  });
});
