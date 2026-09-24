import { File as ExpoFile } from 'expo-file-system';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
    async write(content) {
      files.set(this.uri, content);
    }
  }
  File.__files = files;
  return { File, Paths: { document: { uri: 'file:///tmp' } } };
});

import { readAppState } from '../src/services/storage/appStateStorage.js';
import { useAppStore } from '../src/store/useAppStore.js';

beforeEach(() => {
  ExpoFile.__files.clear();
  useAppStore.setState({
    evolutionPoints: 0,
    evolutionStage: 1,
    moodEntries: [],
    stressEntries: [],
    focusSessions: [],
    completedMicroActions: [],
  });
});

describe('Phase 6 - emotional care and effort tracking', () => {
  it('persists mood and stress locally without sending them to the backend', async () => {
    await useAppStore.getState().checkInMood('lo');
    await useAppStore.getState().saveStressEntry('Hôm nay mình thấy quá tải.');

    expect(useAppStore.getState().moodEntries).toHaveLength(1);
    expect(useAppStore.getState().stressEntries[0].text).toBe('Hôm nay mình thấy quá tải.');
    await expect(readAppState()).resolves.toMatchObject({
      moodEntries: [{ mood: 'lo' }],
      stressEntries: [{ text: 'Hôm nay mình thấy quá tải.' }],
    });
  });

  it('awards one effort point per micro-action each day and records focus minutes', async () => {
    const store = useAppStore.getState();
    await store.completeMicroAction('water');
    await store.completeMicroAction('water');
    await store.recordFocusSession(25);

    expect(useAppStore.getState()).toMatchObject({
      evolutionPoints: 2,
      focusSessions: [{ minutes: 25 }],
    });
    expect(useAppStore.getState().completedMicroActions).toHaveLength(1);
  });
});
