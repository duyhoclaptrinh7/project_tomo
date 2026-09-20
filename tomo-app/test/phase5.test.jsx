import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { File as ExpoFile } from 'expo-file-system';
import { NativeModules } from 'react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const phase5Mocks = vi.hoisted(() => ({ sendChat: vi.fn() }));

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
  }
  File.__files = files;
  return { File, Paths: { document: { uri: 'file:///tmp' } } };
});

vi.mock('expo-audio', () => ({
  RecordingPresets: { HIGH_QUALITY: {} },
  requestRecordingPermissionsAsync: vi.fn(async () => ({ granted: true })),
  setAudioModeAsync: vi.fn(async () => undefined),
  useAudioRecorder: () => ({
    prepareToRecordAsync: vi.fn(),
    record: vi.fn(),
    stop: vi.fn(),
  }),
}));

vi.mock('expo-speech', () => ({ speak: vi.fn(), stop: vi.fn(async () => undefined) }));
vi.mock('../src/services/api/chatApi.js', () => ({
  sendChat: (...args) => phase5Mocks.sendChat(...args),
}));

import ChatScreen from '../src/screens/ChatScreen.jsx';
import { confirmAction, runAction } from '../src/actions/actionExecutor.js';
import { readAppState } from '../src/services/storage/appStateStorage.js';
import { useAppStore } from '../src/store/useAppStore.js';

const baseResponse = (action) => ({
  reply_text: 'Tomo chuẩn bị xong rồi.',
  emotion_label: null,
  should_speak: false,
  action,
  new_facts: [],
  point_event: null,
});

describe('Phase 5 — lịch hệ thống và focus mode', () => {
  beforeEach(() => {
    ExpoFile.__files.clear();
    vi.clearAllMocks();
    useAppStore.setState({
      evolutionPoints: 0,
      evolutionStage: 1,
      isFocusSessionActive: false,
      isFocusRemindersEnabled: false,
      onboarded: true,
      isHydrated: true,
    });
    NativeModules.TomoNativeModule.openScheduleIntent = vi.fn(async () => true);
    NativeModules.TomoNativeModule.startFocusSession = vi.fn(async () => true);
    NativeModules.TomoNativeModule.pauseFocusReminders = vi.fn(async () => true);
    NativeModules.TomoNativeModule.endFocusSession = vi.fn(async () => true);
    NativeModules.TomoNativeModule.setOverlayFocused = vi.fn(async () => true);
  });

  it('gửi giờ hiện tại, timezone và trạng thái nhắc trong session_context', async () => {
    phase5Mocks.sendChat.mockResolvedValue(baseResponse({ type: 'none', params: {} }));
    await render(<ChatScreen />);
    await fireEvent.changeText(screen.getByPlaceholderText('Nhắn cho Tomo...'), 'Mai nhắc mình');
    await fireEvent.press(screen.getByRole('button', { name: 'Gửi' }));

    await waitFor(() => expect(phase5Mocks.sendChat).toHaveBeenCalledOnce());
    const context = phase5Mocks.sendChat.mock.calls[0][0].session_context;
    expect(context.focus_reminders_enabled).toBe(false);
    expect(context.current_time_iso).toMatch(/(?:Z|[+-]\d{2}:\d{2})$/);
    expect(context.timezone).toEqual(expect.any(String));
  });

  it('chỉ mở app Đồng hồ sau khi người dùng xác nhận thẻ lịch', async () => {
    const action = {
      type: 'propose_schedule',
      params: {
        title: 'Dậy sớm',
        datetime_iso: '2099-09-21T07:00:00+07:00',
        type: 'alarm',
      },
    };
    phase5Mocks.sendChat.mockResolvedValue(baseResponse(action));

    await render(<ChatScreen />);
    await fireEvent.changeText(screen.getByPlaceholderText('Nhắn cho Tomo...'), 'Đặt báo thức');
    await fireEvent.press(screen.getByRole('button', { name: 'Gửi' }));

    await waitFor(() => expect(screen.getByText('Báo thức: Dậy sớm')).toBeTruthy());
    expect(NativeModules.TomoNativeModule.openScheduleIntent).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Mở app hệ thống' }));
    await waitFor(() =>
      expect(NativeModules.TomoNativeModule.openScheduleIntent).toHaveBeenCalledOnce(),
    );
  });

  it('bắt đầu focus qua xác nhận và persist trạng thái phiên', async () => {
    const action = { type: 'start_focus_session', params: { duration_minutes: 45 } };
    expect(await runAction(action)).toEqual({ pendingAction: action });

    const result = await confirmAction(action);
    expect(result).toMatchObject({ success: true, animationState: 'focused' });
    expect(NativeModules.TomoNativeModule.startFocusSession).toHaveBeenCalledWith(
      45,
      expect.any(Array),
    );
    expect(useAppStore.getState()).toMatchObject({
      isFocusSessionActive: true,
      isFocusRemindersEnabled: true,
    });
    expect(await readAppState()).toMatchObject({
      isFocusSessionActive: true,
      isFocusRemindersEnabled: true,
    });
  });

  it('tạm dừng nhắc vẫn giữ phiên, kết thúc phiên thì cộng điểm', async () => {
    useAppStore.setState({ isFocusSessionActive: true, isFocusRemindersEnabled: true });
    await runAction({ type: 'pause_focus_reminders', params: {} });
    expect(useAppStore.getState()).toMatchObject({
      isFocusSessionActive: true,
      isFocusRemindersEnabled: false,
    });

    const result = await runAction({ type: 'end_focus_session', params: {} });
    expect(result).toMatchObject({ animationState: 'celebrating', pointAwarded: true });
    expect(useAppStore.getState()).toMatchObject({
      isFocusSessionActive: false,
      evolutionPoints: 1,
    });
  });
});
