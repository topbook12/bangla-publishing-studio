/**
 * Read Aloud (পড়ে শোনানো) — ব্রাউজারের speechSynthesis দিয়ে প্রুফরিডিং সহায়ক।
 * সম্পূর্ণ ক্লায়েন্ট-সাইড: সিলেকশন থাকলে শুধু সিলেকশন, নইলে সক্রিয় পাতার পুরো লেখা।
 * লম্বা লেখা ~২০০০ অক্ষরে বাক্য-সীমায় ভেঙে কিউ করা হয় (Chrome-এর লম্বা-স্ট্রিং সমস্যা এড়াতে)।
 */

import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';

export interface ReadAloudState {
  speaking: boolean;
  paused: boolean;
}

/** পড়ার গতি (0.5–1.5) — পরের utterance থেকে প্রযোজ্য */
let rate = 1;
let speaking = false;
let paused = false;

const listeners = new Set<() => void>();

function emit(): void {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      /* লিসেনার ব্যর্থ হলেও মূল কাজ আটকাবে না */
    }
  }
}

/** ব্রাউজার সাপোর্ট (SSR-নিরাপদ — window গার্ড) */
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// ── ভয়েস ক্যাশ ──
let voicesCache: SpeechSynthesisVoice[] = [];
let voicesHooked = false;

function hookVoices(): void {
  if (voicesHooked || !isSpeechSupported()) return;
  voicesHooked = true;
  const synth = window.speechSynthesis;
  const sync = (): void => {
    voicesCache = synth.getVoices();
  };
  sync();
  // Chrome-এ ভয়েস লিস্ট অ্যাসিঙ্ক লোড হয় — onvoiceschanged-এ ক্যাশ রিফ্রেশ
  synth.addEventListener?.('voiceschanged', sync);
}

/** বাংলা ভয়েস পছন্দ: bn → hi → null (null হলে lang='bn-BD' দিয়ে ব্রাউজারের ডিফল্ট) */
export function getBanglaVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;
  hookVoices();
  const voices = voicesCache.length ? voicesCache : window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang?.toLowerCase().startsWith('bn')) ??
    voices.find((v) => v.lang?.toLowerCase().startsWith('hi')) ??
    null
  );
}

/** ফুটনোট গ্লিফ (▾) পড়া এড়াতে বাদ */
function cleanForSpeech(text: string): string {
  return text.replace(/▾/g, ' ');
}

/** ~২০০০ অক্ষরে বাক্য-সীমায় ভাগ (বাংলা দাঁড়ি সহ) */
function chunkText(text: string, max = 2000): string[] {
  if (text.length <= max) return [text];
  const sentences = text.match(/[^।!?.\n]+[।!?.\n]*/g) ?? [text];
  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    if (current && current.length + sentence.length > max) {
      chunks.push(current);
      current = '';
    }
    if (sentence.length > max) {
      // একক বাক্যই খুব লম্বা হলে জোর করে কাটা
      for (let i = 0; i < sentence.length; i += max) chunks.push(sentence.slice(i, i + max));
    } else {
      current += sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function finishAll(): void {
  if (speaking || paused) {
    speaking = false;
    paused = false;
    emit();
  }
}

/** টেক্সট পড়ে শোনানো শুরু (আগের কিউ বাতিল করে); খালি টেক্সটে false */
export function speak(text: string): boolean {
  if (!isSpeechSupported()) return false;
  stop();
  const clean = cleanForSpeech(text).trim();
  if (!clean) return false;

  const synth = window.speechSynthesis;
  const voice = getBanglaVoice();
  const chunks = chunkText(clean);
  let finished = 0;
  const onDone = (): void => {
    finished += 1;
    if (finished >= chunks.length) finishAll();
  };

  for (const part of chunks) {
    const utterance = new SpeechSynthesisUtterance(part);
    utterance.lang = voice?.lang ?? 'bn-BD';
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.onend = onDone;
    utterance.onerror = onDone; // stop/interrupt-ও onerror দিয়ে আসে — কিউ শেষ হলে স্টেট মিলিয়ে দিই
    synth.speak(utterance);
  }

  speaking = true;
  paused = false;
  emit();
  return true;
}

/** থামিয়ে রাখা */
export function pauseSpeech(): void {
  if (!isSpeechSupported() || !speaking || paused) return;
  window.speechSynthesis.pause();
  paused = true;
  emit();
}

/** আবার চালু */
export function resumeSpeech(): void {
  if (!isSpeechSupported() || !paused) return;
  window.speechSynthesis.resume();
  paused = false;
  emit();
}

/** সম্পূর্ণ বন্ধ */
export function stopSpeech(): void {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
  finishAll();
}

/** গতি নির্ধারণ (পরের পড়া থেকে প্রযোজ্য) */
export function setSpeechRate(r: number): void {
  rate = Math.min(1.5, Math.max(0.5, r));
  emit();
}

export function getSpeechRate(): number {
  return rate;
}

export function getReadAloudState(): ReadAloudState {
  return { speaking, paused };
}

/** এডিটর থেকে পড়ার টেক্সট — সিলেকশন, নইলে পুরো পাতা */
function editorSpeechText(editor: Editor): string {
  const { selection, doc } = editor.state;
  const selected = doc.textBetween(selection.from, selection.to, ' ', ' ');
  if (selected.trim()) return selected;
  return doc.textBetween(0, doc.content.size, ' ', ' ');
}

export type PlayResult = 'unsupported' | 'empty' | 'playing';

/** সিলেকশন/পাতা পড়া শুরু — কলার টোস্টের জন্য অবস্থা ফেরত দেয় */
export function playFromEditor(editor: Editor): PlayResult {
  if (!isSpeechSupported()) return 'unsupported';
  const ok = speak(editorSpeechText(editor));
  return ok ? 'playing' : 'empty';
}

export type ToggleResult = 'unsupported' | 'empty' | 'ok';

/** Play/Pause টগল — চলছে থামায়, থেমে থাকলে চালু, নইলে নতুন করে পড়ে */
export function toggleReadAloud(editor: Editor): ToggleResult {
  if (!isSpeechSupported()) return 'unsupported';
  if (speaking && !paused) {
    pauseSpeech();
    return 'ok';
  }
  if (paused) {
    resumeSpeech();
    return 'ok';
  }
  const result = playFromEditor(editor);
  return result === 'playing' ? 'ok' : result;
}

/**
 * React হুক — মডিউল-স্টেটের ওপর সাবস্ক্রিপশন + স্পিকিং অবস্থায় ৫০০ms পোল
 * (ব্রাউজার-লেভেল pause/cancel-ও ধরা পড়ে)।
 */
export function useReadAloud(): {
  speaking: boolean;
  paused: boolean;
  rate: number;
  supported: boolean;
  play: (editor: Editor) => PlayResult;
  toggle: (editor: Editor) => ToggleResult;
  pause: typeof pauseSpeech;
  resume: typeof resumeSpeech;
  stop: typeof stopSpeech;
  setRate: typeof setSpeechRate;
} {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const listener = (): void => forceUpdate((v) => v + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const { speaking: isSpeaking } = getReadAloudState();
  useEffect(() => {
    if (!isSpeaking) return;
    const timer = window.setInterval(() => {
      if (!isSpeechSupported()) return;
      const synth = window.speechSynthesis;
      const nowSpeaking = synth.speaking || synth.pending;
      const nowPaused = synth.paused;
      if (nowSpeaking !== speaking || nowPaused !== paused) {
        speaking = nowSpeaking;
        paused = nowPaused;
        emit();
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [isSpeaking]);

  return {
    speaking,
    paused,
    rate,
    supported: isSpeechSupported(),
    play: playFromEditor,
    toggle: toggleReadAloud,
    pause: pauseSpeech,
    resume: resumeSpeech,
    stop: stopSpeech,
    setRate: setSpeechRate,
  };
}
