/**
 * AI কনফিগারেশন (BYOK — Bring Your Own Key)
 * ─────────────────────────────────────────
 * ব্যবহারকারীর নিজের API Key — শুধু ব্রাউজারের localStorage-এ থাকে,
 * আমাদের সার্ভারে কখনো সংরক্ষিত হয় না। AI কলের সময় শুধু পাস-থ্রু হয়
 * (নির্বাচিত প্রোভাইডারে পৌঁছায়) — ফলে কোম্পানির কোনো AI খরচ নেই।
 *
 * প্রিসেটগুলো OpenAI-সামঞ্জস্য (chat/completions) এন্ডপয়েন্ট — Z.AI,
 * OpenAI, Gemini (compat), Claude (compat), OpenRouter, Groq সব একই
 * তারে চলে; "custom" দিয়ে যেকোনো OpenAI-compatible সার্ভার (Ollama,
 * LM Studio, vLLM…) যোগ করা যায়।
 */

'use client';

import { create } from 'zustand';

export type AiProviderId = 'zai' | 'openai' | 'gemini' | 'claude' | 'openrouter' | 'groq' | 'custom';

export interface AiProviderPreset {
  id: AiProviderId;
  /** ব্র্যান্ড নাম (অনূদিত হয় না) */
  name: string;
  descKey: string;
  baseUrl: string;
  /** টেক্সট জেনারেশনের ডিফল্ট মডেল */
  model: string;
  /** ছবি বোঝার (ভিশন) ডিফল্ট মডেল */
  visionModel: string;
  /** API Key সংগ্রহের অফিসিয়াল লিংক */
  keyUrl: string;
}

export const AI_PROVIDERS: AiProviderPreset[] = [
  {
    id: 'zai',
    name: 'Z.AI (GLM)',
    descKey: 'ai.prov.zai.desc',
    baseUrl: 'https://api.z.ai/api/paas/v4/',
    model: 'glm-4.6',
    visionModel: 'glm-4.5v',
    keyUrl: 'https://z.ai/manage-apikey/apikey-list',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    descKey: 'ai.prov.openai.desc',
    baseUrl: 'https://api.openai.com/v1/',
    model: 'gpt-4o-mini',
    visionModel: 'gpt-4o',
    keyUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    descKey: 'ai.prov.gemini.desc',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    // gemini-2.5-flash নতুন ব্যবহারকারীদের জন্য বন্ধ — প্রোভাইডারের সুপারিশমতো
    // বর্তমান ফ্ল্যাশ মডেল; পুরনো সেভ করা মডেল হলে কলে স্বয়ং-নিরাময় সেটাকেই বদলে দেয়
    model: 'gemini-3.8-flash',
    visionModel: 'gemini-3.8-flash',
    keyUrl: 'https://aistudio.google.com/apikey',
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    descKey: 'ai.prov.claude.desc',
    baseUrl: 'https://api.anthropic.com/v1/',
    model: 'claude-sonnet-4-5',
    visionModel: 'claude-sonnet-4-5',
    keyUrl: 'https://console.anthropic.com/settings/keys',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    descKey: 'ai.prov.openrouter.desc',
    baseUrl: 'https://openrouter.ai/api/v1/',
    model: 'openai/gpt-4o-mini',
    visionModel: 'google/gemini-2.5-flash',
    keyUrl: 'https://openrouter.ai/keys',
  },
  {
    id: 'groq',
    name: 'Groq',
    descKey: 'ai.prov.groq.desc',
    baseUrl: 'https://api.groq.com/openai/v1/',
    model: 'llama-3.3-70b-versatile',
    visionModel: 'meta-llama/llama-4-scout-17b-16e-instruct',
    keyUrl: 'https://console.groq.com/keys',
  },
  {
    id: 'custom',
    name: 'OpenAI-Compatible',
    descKey: 'ai.prov.custom.desc',
    baseUrl: '',
    model: '',
    visionModel: '',
    keyUrl: '',
  },
];

export const providerPreset = (id: AiProviderId): AiProviderPreset =>
  AI_PROVIDERS.find((p) => p.id === id) ?? AI_PROVIDERS[0];

export interface AiConfig {
  provider: AiProviderId;
  baseUrl: string;
  apiKey: string;
  model: string;
}

const STORAGE_KEY = 'bps-ai-config-v1';

const DEFAULT_CONFIG: AiConfig = {
  provider: 'zai',
  baseUrl: providerPreset('zai').baseUrl,
  apiKey: '',
  model: providerPreset('zai').visionModel,
};

function loadConfig(): AiConfig {
  try {
    if (typeof window === 'undefined') return DEFAULT_CONFIG;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<AiConfig>;
    if (!parsed || typeof parsed !== 'object') return DEFAULT_CONFIG;
    return {
      provider: (parsed.provider as AiProviderId) in providerListMap() ? (parsed.provider as AiProviderId) : 'zai',
      baseUrl: typeof parsed.baseUrl === 'string' ? parsed.baseUrl : DEFAULT_CONFIG.baseUrl,
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      model: typeof parsed.model === 'string' ? parsed.model : DEFAULT_CONFIG.model,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function providerListMap(): Record<string, true> {
  return Object.fromEntries(AI_PROVIDERS.map((p) => [p.id, true as const]));
}

function persist(config: AiConfig): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // প্রাইভেট মোড/কোটা — মেমোরিতেই থাকবে
  }
}

interface AiState {
  config: AiConfig;
  setConfig: (patch: Partial<AiConfig>) => void;
  applyPreset: (id: AiProviderId) => void;
  clearKey: () => void;
}

export const useAiStore = create<AiState>((set, get) => ({
  config: loadConfig(),

  setConfig: (patch) => {
    const next = { ...get().config, ...patch };
    persist(next);
    set({ config: next });
  },

  applyPreset: (id) => {
    const p = providerPreset(id);
    const next: AiConfig = {
      provider: id,
      baseUrl: p.baseUrl,
      apiKey: get().config.apiKey,
      model: p.visionModel || p.model,
    };
    persist(next);
    set({ config: next });
  },

  clearKey: () => {
    const next = { ...get().config, apiKey: '' };
    persist(next);
    set({ config: next });
  },
}));

/** কি সেট করা আছে কি না (কম্পোনেন্টের বাইরেও ব্যবহারযোগ্য) */
export function isAiConfigured(): boolean {
  const c = useAiStore.getState().config;
  return c.apiKey.trim().length > 0 && c.baseUrl.trim().length > 0 && c.model.trim().length > 0;
}
