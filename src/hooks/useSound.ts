/**
 * @file useSound.ts
 * @description 音效管理 Hook，提供工具调用、打字机和录音音效播放功能
 * @module hooks/useSound
 * @requires react
 */

import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "lime_sound_enabled";
const SOUND_INTERVAL = 120; // 打字音效间隔 120ms

export interface UseSoundReturn {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  playToolcallSound: () => void;
  playTypewriterSound: () => void;
  playRecordingStartSound: () => void;
  playRecordingStopSound: () => void;
}

export function useSound(): UseSoundReturn {
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "true";
  });

  const toolcallAudioRef = useRef<HTMLAudioElement | null>(null);
  const typewriterAudioRef = useRef<HTMLAudioElement | null>(null);
  const recordingStartAudioRef = useRef<HTMLAudioElement | null>(null);
  const recordingStopAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastSoundTimeRef = useRef<number>(0);

  // 初始化音频
  useEffect(() => {
    if (!toolcallAudioRef.current) {
      toolcallAudioRef.current = new Audio("/sounds/tool-call.mp3");
      toolcallAudioRef.current.volume = 1;
      toolcallAudioRef.current.load();
    }
    if (!typewriterAudioRef.current) {
      typewriterAudioRef.current = new Audio("/sounds/typing.mp3");
      typewriterAudioRef.current.volume = 0.6;
      typewriterAudioRef.current.load();
    }
    if (!recordingStartAudioRef.current) {
      recordingStartAudioRef.current = new Audio("/sounds/recording-start.mp3");
      recordingStartAudioRef.current.volume = 0.8;
      recordingStartAudioRef.current.load();
    }
    if (!recordingStopAudioRef.current) {
      recordingStopAudioRef.current = new Audio("/sounds/recording-stop.mp3");
      recordingStopAudioRef.current.volume = 0.8;
      recordingStopAudioRef.current.load();
    }
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem(STORAGE_KEY, String(enabled));
  }, []);

  const playToolcallSound = useCallback(() => {
    if (!soundEnabled || !toolcallAudioRef.current) return;
    toolcallAudioRef.current.currentTime = 0;
    toolcallAudioRef.current.play().catch(console.error);
  }, [soundEnabled]);

  const playTypewriterSound = useCallback(() => {
    const now = Date.now();
    if (!soundEnabled || !typewriterAudioRef.current) return;
    if (now - lastSoundTimeRef.current > SOUND_INTERVAL) {
      typewriterAudioRef.current.currentTime = 0;
      typewriterAudioRef.current.play().catch(console.error);
      lastSoundTimeRef.current = now;
    }
  }, [soundEnabled]);

  const playRecordingStartSound = useCallback(() => {
    if (!recordingStartAudioRef.current) return;
    recordingStartAudioRef.current.currentTime = 0;
    recordingStartAudioRef.current.play().catch(console.error);
  }, []);

  const playRecordingStopSound = useCallback(() => {
    if (!recordingStopAudioRef.current) return;
    recordingStopAudioRef.current.currentTime = 0;
    recordingStopAudioRef.current.play().catch(console.error);
  }, []);

  return {
    soundEnabled,
    setSoundEnabled,
    playToolcallSound,
    playTypewriterSound,
    playRecordingStartSound,
    playRecordingStopSound,
  };
}
