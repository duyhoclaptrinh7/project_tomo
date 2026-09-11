import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { File as ExpoFile, Paths } from 'expo-file-system';
import { AppState, NativeModules } from 'react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as audioModule from 'expo-audio';
import * as notificationsModule from 'expo-notifications';

import { useAppStore } from '../src/store/useAppStore.js';
import { readMemory } from '../src/services/storage/memoryStorage.js';
import { readAppState } from '../src/services/storage/appStateStorage.js';
import * as overlayBridge from '../src/services/native/overlayBridge.js';
import OnboardingScreen from '../src/screens/OnboardingScreen.jsx';
import SettingsScreen from '../src/screens/SettingsScreen.jsx';
import ChatScreen from '../src/screens/ChatScreen.jsx';
import App from '../App.jsx';

// Mock expo-file-system
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

// Mock expo-audio
vi.mock('expo-audio', () => ({
  requestRecordingPermissionsAsync: vi.fn(async () => ({ granted: true, status: 'granted' })),
  getRecordingPermissionsAsync: vi.fn(async () => ({ granted: true, status: 'granted' })),
}));

// Mock expo-notifications
vi.mock('expo-notifications', () => ({
  requestPermissionsAsync: vi.fn(async () => ({ granted: true, status: 'granted' })),
  getPermissionsAsync: vi.fn(async () => ({ granted: true, status: 'granted' })),
}));

// Mock chatApi
vi.mock('../src/services/api/chatApi.js', () => ({
  sendChat: vi.fn(async () => ({
    reply_text: 'Xin chào! Tớ là Tomo.',
    emotion_label: 'vui',
    action: { type: 'none' },
    new_facts: [],
  })),
}));

function resetStorage() {
  const files = ExpoFile.__files ?? globalThis.__tomoFiles;
  files.clear();
  useAppStore.setState({
    evolutionPoints: 0,
    evolutionStage: 1,
    isOverlayEnabled: false,
    isFocusSessionActive: false,
    onboarded: false,
    isHydrated: true,
  });
  NativeModules.TomoNativeModule.isOverlayPermissionGranted = vi.fn(async () => false);
  NativeModules.TomoNativeModule.openOverlaySettings = vi.fn(async () => true);
  NativeModules.TomoNativeModule.startOverlay = vi.fn(async () => true);
  NativeModules.TomoNativeModule.stopOverlay = vi.fn(async () => true);
  NativeModules.TomoNativeModule.openOverlayChat = vi.fn(async () => true);
  vi.clearAllMocks();
}

describe('Phase 3 — State Hydration & Store', () => {
  beforeEach(() => {
    resetStorage();
  });

  it('useAppStore: có cờ isHydrated và chuyển thành true sau khi hydrate()', async () => {
    useAppStore.setState({ isHydrated: false, onboarded: false });
    expect(useAppStore.getState().isHydrated).toBe(false);

    await useAppStore.getState().hydrate();
    expect(useAppStore.getState().isHydrated).toBe(true);
  });

  it('useAppStore: patchState lưu onboarded: true và isOverlayEnabled: true xuống app_state.json', async () => {
    await useAppStore.getState().patchState({ onboarded: true, isOverlayEnabled: true });

    const persisted = await readAppState();
    expect(persisted.onboarded).toBe(true);
    expect(persisted.isOverlayEnabled).toBe(true);
  });
});

describe('Phase 3 — overlayBridge.js', () => {
  beforeEach(() => {
    resetStorage();
  });

  it('gọi các method native thành công khi TomoNativeModule có sẵn', async () => {
    NativeModules.TomoNativeModule.isOverlayPermissionGranted = vi.fn(async () => true);
    NativeModules.TomoNativeModule.openOverlaySettings = vi.fn(async () => true);
    NativeModules.TomoNativeModule.startOverlay = vi.fn(async () => true);
    NativeModules.TomoNativeModule.stopOverlay = vi.fn(async () => true);
    NativeModules.TomoNativeModule.openOverlayChat = vi.fn(async () => true);

    expect(await overlayBridge.isOverlayPermissionGranted()).toBe(true);
    expect(await overlayBridge.openOverlaySettings()).toBe(true);
    expect(await overlayBridge.startOverlay()).toBe(true);
    expect(await overlayBridge.stopOverlay()).toBe(true);
    expect(await overlayBridge.openOverlayChat()).toBe(true);
  });

  it('fallback an toàn (trả về false) khi native method ném exception', async () => {
    NativeModules.TomoNativeModule.isOverlayPermissionGranted = vi.fn(async () => {
      throw new Error('Native error');
    });
    NativeModules.TomoNativeModule.startOverlay = vi.fn(async () => {
      throw new Error('Native start error');
    });

    const isGranted = await overlayBridge.isOverlayPermissionGranted();
    expect(isGranted).toBe(false);

    const started = await overlayBridge.startOverlay();
    expect(started).toBe(false);
  });
});

describe('Phase 3 — OnboardingScreen.jsx', () => {
  beforeEach(() => {
    resetStorage();
  });

  it('hiển thị bước 1 chào mừng và chuyển sang bước 2 khi bấm Tiếp tục', async () => {
    await render(<OnboardingScreen />);

    expect(screen.getByText('Chào bạn, tớ là Tomo!')).toBeTruthy();
    expect(screen.getByText('Bước 1/6')).toBeTruthy();

    await fireEvent.press(screen.getByText('Làm quen với Tomo'));

    await waitFor(() => {
      expect(screen.getByText('Tớ nên gọi bạn là gì?')).toBeTruthy();
      expect(screen.getByText('Bước 2/6')).toBeTruthy();
    });
  });

  it('bước 2: nhập tên người dùng và lưu fact vào memory.md', async () => {
    await render(<OnboardingScreen />);

    await fireEvent.press(screen.getByText('Làm quen với Tomo'));

    await waitFor(() => {
      expect(screen.getByText('Tên của bạn (*)')).toBeTruthy();
    });

    const nameInput = screen.getByPlaceholderText('Ví dụ: Duy, An, Minh...');
    await fireEvent.changeText(nameInput, 'Minh Duy');

    await fireEvent.press(screen.getByText('Tiếp tục'));

    await waitFor(async () => {
      expect(screen.getByText('Quyền Microphone')).toBeTruthy();
      const memoryContent = await readMemory();
      expect(memoryContent).toContain('Tên người dùng: Minh Duy');
    });
  });

  it('bước 3: cấp quyền microphone thành công -> chuyển sang bước 4', async () => {
    vi.mocked(audioModule.requestRecordingPermissionsAsync).mockResolvedValueOnce({
      granted: true,
      status: 'granted',
      expires: 'never',
      canAskAgain: true,
    });

    await render(<OnboardingScreen />);
    await fireEvent.press(screen.getByText('Làm quen với Tomo'));
    await waitFor(() => screen.getByPlaceholderText('Ví dụ: Duy, An, Minh...'));

    await fireEvent.changeText(screen.getByPlaceholderText('Ví dụ: Duy, An, Minh...'), 'Duy');
    await fireEvent.press(screen.getByText('Tiếp tục'));

    await waitFor(() => screen.getByText('Quyền Microphone'));
    await fireEvent.press(screen.getByText('Cấp quyền Microphone'));

    await waitFor(() => {
      expect(screen.getByText('Quyền hiển thị trên ứng dụng khác')).toBeTruthy();
      expect(screen.getByText('Bước 4/6')).toBeTruthy();
    });
  });

  it('bước 3: từ chối microphone ("Để sau") vẫn chuyển sang bước 4 bình thường', async () => {
    await render(<OnboardingScreen />);
    await fireEvent.press(screen.getByText('Làm quen với Tomo'));
    await waitFor(() => screen.getByPlaceholderText('Ví dụ: Duy, An, Minh...'));

    await fireEvent.changeText(screen.getByPlaceholderText('Ví dụ: Duy, An, Minh...'), 'Duy');
    await fireEvent.press(screen.getByText('Tiếp tục'));

    await waitFor(() => screen.getByText('Quyền Microphone'));
    await fireEvent.press(screen.getByText('Để sau'));

    await waitFor(() => {
      expect(screen.getByText('Quyền hiển thị trên ứng dụng khác')).toBeTruthy();
      expect(screen.getByText('Bước 4/6')).toBeTruthy();
    });
  });

  it('bước 5: cấp quyền notification thành công -> chuyển sang bước 6', async () => {
    vi.mocked(notificationsModule.requestPermissionsAsync).mockResolvedValueOnce({
      granted: true,
      status: 'granted',
      expires: 'never',
      canAskAgain: true,
    });

    await render(<OnboardingScreen />);
    await fireEvent.press(screen.getByText('Làm quen với Tomo'));
    await waitFor(() => screen.getByPlaceholderText('Ví dụ: Duy, An, Minh...'));

    await fireEvent.changeText(screen.getByPlaceholderText('Ví dụ: Duy, An, Minh...'), 'Duy');
    await fireEvent.press(screen.getByText('Tiếp tục'));

    await waitFor(() => screen.getByText('Quyền Microphone'));
    await fireEvent.press(screen.getByText('Để sau'));

    await waitFor(() => screen.getByText('Quyền hiển thị trên ứng dụng khác'));
    await fireEvent.press(screen.getByText('Để sau'));

    await waitFor(() => screen.getByText('Quyền Thông báo'));
    await fireEvent.press(screen.getByText('Cấp quyền Thông báo'));

    await waitFor(() => {
      expect(screen.getByText('Sẵn sàng đồng hành cùng Duy!')).toBeTruthy();
      expect(screen.getByText('Bước 6/6')).toBeTruthy();
    });
  });

  it('hoàn tất toàn bộ onboarding: lưu onboarded: true vào app state và gọi navigation.reset', async () => {
    const mockNavigation = { reset: vi.fn(), replace: vi.fn() };
    await render(<OnboardingScreen navigation={mockNavigation} />);

    // B1 -> B2
    await fireEvent.press(screen.getByText('Làm quen với Tomo'));

    // B2 -> B3
    await waitFor(() => screen.getByPlaceholderText('Ví dụ: Duy, An, Minh...'));
    await fireEvent.changeText(screen.getByPlaceholderText('Ví dụ: Duy, An, Minh...'), 'Duy');
    await fireEvent.press(screen.getByText('Tiếp tục'));

    // B3 (Mic) -> B4
    await waitFor(() => screen.getByText('Quyền Microphone'));
    await fireEvent.press(screen.getByText('Để sau'));

    // B4 (Overlay) -> B5
    await waitFor(() => screen.getByText('Quyền hiển thị trên ứng dụng khác'));
    await fireEvent.press(screen.getByText('Để sau'));

    // B5 (Notif) -> B6
    await waitFor(() => screen.getByText('Quyền Thông báo'));
    await fireEvent.press(screen.getByText('Để sau'));

    // B6 (Summary)
    await waitFor(() => {
      expect(screen.getByText('Sẵn sàng đồng hành cùng Duy!')).toBeTruthy();
      expect(screen.getByText('Bắt đầu trò chuyện')).toBeTruthy();
    });

    await fireEvent.press(screen.getByText('Bắt đầu trò chuyện'));

    await waitFor(async () => {
      expect(useAppStore.getState().onboarded).toBe(true);
      const appState = await readAppState();
      expect(appState.onboarded).toBe(true);
      expect(mockNavigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'Chat', params: { isOverlay: false } }],
      });
    });
  });

  it('bước 4: khi mở Settings mà chưa bật toggle, hiển thị giao diện kiểm tra lại quyền', async () => {
    NativeModules.TomoNativeModule.isOverlayPermissionGranted = vi.fn(async () => false);
    NativeModules.TomoNativeModule.openOverlaySettings = vi.fn(async () => true);

    await render(<OnboardingScreen />);
    await fireEvent.press(screen.getByText('Làm quen với Tomo'));
    await waitFor(() => screen.getByPlaceholderText('Ví dụ: Duy, An, Minh...'));
    await fireEvent.changeText(screen.getByPlaceholderText('Ví dụ: Duy, An, Minh...'), 'Duy');
    await fireEvent.press(screen.getByText('Tiếp tục'));

    await waitFor(() => screen.getByText('Quyền Microphone'));
    await fireEvent.press(screen.getByText('Để sau'));

    await waitFor(() => screen.getByText('Quyền hiển thị trên ứng dụng khác'));
    await fireEvent.press(screen.getByText('Mở Cài đặt cấp quyền'));

    await waitFor(() => {
      expect(NativeModules.TomoNativeModule.openOverlaySettings).toHaveBeenCalled();
      expect(screen.getByText('Kiểm tra lại quyền')).toBeTruthy();
      expect(screen.getByText('Mở lại Cài đặt')).toBeTruthy();
      expect(screen.getByText('Bước 4/6')).toBeTruthy();
    });
  });

  it('bước 4: khi bấm Kiểm tra lại quyền và đã được cấp -> chuyển sang bước 5', async () => {
    NativeModules.TomoNativeModule.isOverlayPermissionGranted = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    await render(<OnboardingScreen />);
    await fireEvent.press(screen.getByText('Làm quen với Tomo'));
    await waitFor(() => screen.getByPlaceholderText('Ví dụ: Duy, An, Minh...'));
    await fireEvent.changeText(screen.getByPlaceholderText('Ví dụ: Duy, An, Minh...'), 'Duy');
    await fireEvent.press(screen.getByText('Tiếp tục'));

    await waitFor(() => screen.getByText('Quyền Microphone'));
    await fireEvent.press(screen.getByText('Để sau'));

    await waitFor(() => screen.getByText('Quyền hiển thị trên ứng dụng khác'));
    await fireEvent.press(screen.getByText('Mở Cài đặt cấp quyền'));

    await waitFor(() => screen.getByText('Kiểm tra lại quyền'));
    await fireEvent.press(screen.getByText('Kiểm tra lại quyền'));

    await waitFor(() => {
      expect(screen.getByText('Quyền Thông báo')).toBeTruthy();
      expect(screen.getByText('Bước 5/6')).toBeTruthy();
    });
  });

  it('bước 4: khi app resume active qua AppState, tự động nhận diện quyền overlay đã cấp', async () => {
    NativeModules.TomoNativeModule.isOverlayPermissionGranted = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    await render(<OnboardingScreen />);
    await fireEvent.press(screen.getByText('Làm quen với Tomo'));
    await waitFor(() => screen.getByPlaceholderText('Ví dụ: Duy, An, Minh...'));
    await fireEvent.changeText(screen.getByPlaceholderText('Ví dụ: Duy, An, Minh...'), 'Duy');
    await fireEvent.press(screen.getByText('Tiếp tục'));

    await waitFor(() => screen.getByText('Quyền Microphone'));
    await fireEvent.press(screen.getByText('Để sau'));

    await waitFor(() => screen.getByText('Quyền hiển thị trên ứng dụng khác'));
    await fireEvent.press(screen.getByText('Mở Cài đặt cấp quyền'));

    // Giả lập người dùng bật quyền ở Settings rồi quay lại app (AppState active)
    AppState._emit('change', 'active');

    await waitFor(() => {
      expect(screen.getByText('Đã cấp quyền — Tiếp tục')).toBeTruthy();
    });
  });
});

describe('Phase 3 — SettingsScreen.jsx', () => {
  beforeEach(() => {
    resetStorage();
  });

  it('bật overlay khi đã có quyền: gọi startOverlay và persist isOverlayEnabled: true', async () => {
    NativeModules.TomoNativeModule.isOverlayPermissionGranted = vi.fn(async () => true);
    NativeModules.TomoNativeModule.startOverlay = vi.fn(async () => true);

    await render(<SettingsScreen navigation={{ goBack: vi.fn() }} />);

    await waitFor(() => {
      expect(screen.getByText('Bong bóng nổi (Overlay)')).toBeTruthy();
    });

    const switchEl = screen.getByTestId('overlay-switch');
    await fireEvent(switchEl, 'change', { target: { checked: true } });

    await waitFor(async () => {
      expect(NativeModules.TomoNativeModule.startOverlay).toHaveBeenCalled();
      expect(useAppStore.getState().isOverlayEnabled).toBe(true);
    });
  });

  it('tắt overlay: gọi stopOverlay và persist isOverlayEnabled: false', async () => {
    useAppStore.setState({ isOverlayEnabled: true });
    NativeModules.TomoNativeModule.stopOverlay = vi.fn(async () => true);

    await render(<SettingsScreen navigation={{ goBack: vi.fn() }} />);

    await waitFor(() => {
      expect(screen.getByText('Bong bóng nổi (Overlay)')).toBeTruthy();
    });

    const switchEl = screen.getByTestId('overlay-switch');
    await fireEvent(switchEl, 'change', { target: { checked: false } });

    await waitFor(async () => {
      expect(NativeModules.TomoNativeModule.stopOverlay).toHaveBeenCalled();
      expect(useAppStore.getState().isOverlayEnabled).toBe(false);
    });
  });
});

describe('Phase 3 — App.jsx routing', () => {
  beforeEach(() => {
    resetStorage();
  });

  it('hiển thị OnboardingScreen khi onboarded = false', async () => {
    useAppStore.setState({ onboarded: false, isHydrated: true });

    await render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Chào bạn, tớ là Tomo!')).toBeTruthy();
    });
  });

  it('không hiển thị ChatScreen khi onboarded = false kể cả khi isOverlayMode = true', async () => {
    useAppStore.setState({ onboarded: false, isHydrated: true });

    await render(<App isOverlayMode={true} />);

    await waitFor(() => {
      expect(screen.getByText('Chào bạn, tớ là Tomo!')).toBeTruthy();
      expect(screen.queryByPlaceholderText('Nhắn cho Tomo...')).toBeNull();
    });
  });

  it('hiển thị ChatScreen khi onboarded = true', async () => {
    await useAppStore.getState().patchState({ onboarded: true });

    await render(<App />);

    await waitFor(() => {
      expect(screen.getByText('⚙️ Cài đặt')).toBeTruthy();
      expect(screen.getByPlaceholderText('Nhắn cho Tomo...')).toBeTruthy();
    });
  });

  it('hoàn tất toàn bộ Onboarding ngay trong App.jsx -> UI tự động chuyển sang ChatScreen', async () => {
    useAppStore.setState({ onboarded: false, isHydrated: true });

    await render(<App />);

    // Xác nhận đang hiển thị Onboarding Bước 1
    await waitFor(() => {
      expect(screen.getByText('Chào bạn, tớ là Tomo!')).toBeTruthy();
    });

    // B1 -> B2
    await fireEvent.press(screen.getByText('Làm quen với Tomo'));

    // B2: Nhập tên -> B3
    await waitFor(() => screen.getByPlaceholderText('Ví dụ: Duy, An, Minh...'));
    await fireEvent.changeText(screen.getByPlaceholderText('Ví dụ: Duy, An, Minh...'), 'Duy');
    await fireEvent.press(screen.getByText('Tiếp tục'));

    // B3 (Mic) -> B4
    await waitFor(() => screen.getByText('Quyền Microphone'));
    await fireEvent.press(screen.getByText('Để sau'));

    // B4 (Overlay) -> B5
    await waitFor(() => screen.getByText('Quyền hiển thị trên ứng dụng khác'));
    await fireEvent.press(screen.getByText('Để sau'));

    // B5 (Notif) -> B6
    await waitFor(() => screen.getByText('Quyền Thông báo'));
    await fireEvent.press(screen.getByText('Để sau'));

    // B6 (Summary): Nhấn "Bắt đầu trò chuyện"
    await waitFor(() => screen.getByText('Bắt đầu trò chuyện'));
    await fireEvent.press(screen.getByText('Bắt đầu trò chuyện'));

    // Xác nhận UI tự động chuyển sang ChatScreen, hiển thị khung chat và nút Cài đặt
    await waitFor(() => {
      expect(screen.getByText('⚙️ Cài đặt')).toBeTruthy();
      expect(screen.getByPlaceholderText('Nhắn cho Tomo...')).toBeTruthy();
      expect(screen.queryByText('Chào bạn, tớ là Tomo!')).toBeNull();
    });
  });
});

describe('Phase 3 — ChatScreen overlay mode', () => {
  beforeEach(() => {
    resetStorage();
  });

  it('tự động chuyển về Onboarding nếu chưa hoàn tất onboarding (onboarded = false)', async () => {
    useAppStore.setState({ onboarded: false });
    const mockNavigation = { replace: vi.fn(), goBack: vi.fn() };
    await render(<ChatScreen navigation={mockNavigation} />);

    expect(mockNavigation.replace).toHaveBeenCalledWith('Onboarding');
  });

  it('hiển thị nút Đóng khi chạy trong OverlayChatActivity (isOverlay = true)', async () => {
    useAppStore.setState({ onboarded: true });
    await render(
      <ChatScreen navigation={{ goBack: vi.fn() }} route={{ params: { isOverlay: true } }} />,
    );

    await waitFor(() => {
      expect(screen.getByText('✕ Đóng')).toBeTruthy();
      expect(screen.queryByText('⚙️ Cài đặt')).toBeNull();
    });
  });

  it('đóng cửa sổ nổi khi chạm vào nền mờ (backdrop) hoặc bấm ✕ Đóng', async () => {
    useAppStore.setState({ onboarded: true });
    const mockGoBack = vi.fn();
    const mockNavigation = { goBack: mockGoBack, canGoBack: vi.fn(() => true) };

    await render(
      <ChatScreen navigation={mockNavigation} route={{ params: { isOverlay: true } }} />,
    );

    const backdrop = screen.getByTestId('overlay-backdrop');
    expect(backdrop).toBeTruthy();

    await fireEvent.press(backdrop);
    expect(mockGoBack).toHaveBeenCalledTimes(1);

    const closeBtn = screen.getByText('✕ Đóng');
    await fireEvent.press(closeBtn);
    expect(mockGoBack).toHaveBeenCalledTimes(2);
  });
});
