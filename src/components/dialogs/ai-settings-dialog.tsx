/**
 * AI কনফিগারেশন ডায়ালগ (BYOK — Bring Your Own Key)
 * ─────────────────────────────────────────────────
 * ব্যবহারকারী নিজের API Key বসায় — প্রোভাইডার প্রিসেট কার্ড, মাস্কড কি
 * ইনপুট, সংযোগ পরীক্ষা, কি কোথায় পাব গাইড (তিন ভাষায়) ও নিরাপত্তা-নোট।
 * কি শুধু localStorage-এ থাকে — সার্ভারে কখনো সংরক্ষিত হয় না।
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BadgeCheck, CircleAlert, Copy, Eye, EyeOff, ExternalLink, KeyRound,
  ListChecks, Loader2, Search, ShieldCheck, Sparkles, Trash2, Video,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AI_PROVIDERS, providerPreset, useAiStore } from '@/lib/ai-store';
import type { AiProviderId } from '@/lib/ai-store';
import { fetchModelList, testAiConnection } from '@/lib/ai-client';
import { useUiStore } from '@/lib/ui-store';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type TestState = { phase: 'idle' | 'testing' | 'ok' | 'fail'; message?: string; hintKey?: string; detail?: string };
type ModelsState = { phase: 'idle' | 'loading' | 'ok' | 'fail'; models?: string[]; message?: string; hintKey?: string; detail?: string };

/** প্রোভাইডার টাইলের রং — ব্র্যান্ড-অনুপ্রাণিত (কোনো লোগো ছবি নেই, লিটার টাইল) */
const PROVIDER_TILE: Record<AiProviderId, string> = {
  zai: 'linear-gradient(135deg, oklch(0.62 0.18 285), oklch(0.52 0.2 300))',
  openai: 'linear-gradient(135deg, oklch(0.55 0.12 220), oklch(0.45 0.14 240))',
  gemini: 'linear-gradient(135deg, oklch(0.68 0.13 250), oklch(0.6 0.18 200))',
  claude: 'linear-gradient(135deg, oklch(0.66 0.13 60), oklch(0.6 0.15 40))',
  openrouter: 'linear-gradient(135deg, oklch(0.6 0.16 340), oklch(0.52 0.18 0))',
  groq: 'linear-gradient(135deg, oklch(0.62 0.16 160), oklch(0.55 0.16 180))',
  custom: 'linear-gradient(135deg, oklch(0.55 0.05 260), oklch(0.48 0.06 280))',
};

export function AiSettingsDialog() {
  const open = useUiStore((s) => s.openDialog === 'aiSettings');
  const close = useUiStore((s) => s.close);
  const tt = useT();
  const config = useAiStore((s) => s.config);
  const setConfig = useAiStore((s) => s.setConfig);
  const applyPreset = useAiStore((s) => s.applyPreset);
  const clearKey = useAiStore((s) => s.clearKey);

  const [keyDraft, setKeyDraft] = useState(config.apiKey);
  const [showKey, setShowKey] = useState(false);
  const [test, setTest] = useState<TestState>({ phase: 'idle' });
  const [models, setModels] = useState<ModelsState>({ phase: 'idle' });
  const [modelFilter, setModelFilter] = useState('');
  const modelsRef = useRef<HTMLDivElement | null>(null);

  // ডায়ালগ খোলার সময় সেভ করা কি দিয়ে ড্রাফট শুরু (টাইমারে ডিফার — cascading render এড়াতে)
  useEffect(() => {
    if (!open) return;
    const t1 = window.setTimeout(() => {
      setKeyDraft(useAiStore.getState().config.apiKey);
      setTest({ phase: 'idle' });
      setModels({ phase: 'idle' });
      setModelFilter('');
    }, 0);
    return () => window.clearTimeout(t1);
  }, [open]);

  const preset = providerPreset(config.provider);
  const configured = useMemo(
    () => !!(keyDraft.trim() && config.baseUrl.trim() && config.model.trim()),
    [keyDraft, config.baseUrl, config.model],
  );

  const pickProvider = (id: AiProviderId) => {
    const changed = useAiStore.getState().config.provider !== id;
    applyPreset(id); // প্রোভাইডার বদলালে ai-store এখন পুরনো কি বহন করে না
    setModels({ phase: 'idle' }); // নতুন প্রোভাইডার — তালিকা আবার লোড করতে হবে
    setModelFilter('');
    if (changed) setKeyDraft(''); // নতুন প্রোভাইডারে পুরনো কি/ড্রাফট অর্থহীন
  };

  /** প্রোভাইডার থেকে উপলব্ধ মডেলের তালিকা — 404-মুক্ত বাছাইয়ের মূল পথ */
  const loadModels = async () => {
    if (models.phase === 'loading') return;
    if (!keyDraft.trim()) {
      setModels({ phase: 'fail', hintKey: 'ai.err.config' });
      return;
    }
    setModels({ phase: 'loading' });
    // ড্রাফট কি সাময়িকভাবে বসাই — সেভ না করেও তালিকা আনা যায়
    const prev = useAiStore.getState().config;
    setConfig({ apiKey: keyDraft });
    const res = await fetchModelList(keyDraft);
    if (res.ok) {
      setModels({ phase: 'ok', models: res.models });
      toast.success(`${res.models.length} ${tt('ai.set.models.loaded')}`);
      window.setTimeout(() => modelsRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 60);
    } else {
      setConfig({ apiKey: prev.apiKey });
      setModels({ phase: 'fail', message: res.error, hintKey: res.hintKey ?? 'ai.err.title', detail: res.detail });
    }
  };

  const filteredModels = useMemo(() => {
    const list = models.models ?? [];
    const q = modelFilter.trim().toLowerCase();
    if (!q) return list;
    return list.filter((m) => m.toLowerCase().includes(q));
  }, [models.models, modelFilter]);

  const runTest = async () => {
    if (!config.baseUrl.trim() || !config.model.trim() || !keyDraft.trim()) {
      setTest({ phase: 'fail', hintKey: 'ai.err.config' });
      return;
    }
    // টেস্টের আগে ড্রাফট কি সাময়িকভাবে বসাই — সেভ না করেও পরীক্ষা সম্ভব
    const prev = useAiStore.getState().config;
    setConfig({ apiKey: keyDraft });
    setTest({ phase: 'testing' });
    const res = await testAiConnection(false);
    if (res.ok) {
      setTest({ phase: 'ok' });
      toast.success(tt('ai.set.test.ok'));
    } else {
      setConfig({ apiKey: prev.apiKey }); // ব্যর্থ হলে পুরনো কিতে ফেরত
      setTest({ phase: 'fail', message: res.error, hintKey: res.hintKey, detail: res.detail });
    }
  };

  const save = () => {
    const hadKey = !!useAiStore.getState().config.apiKey.trim();
    setConfig({ apiKey: keyDraft });
    toast.success(tt('ai.set.saved'));
    // প্রথমবার কি সেট → "কিভাবে ব্যবহার করবেন" গাইড (একবারই, দীর্ঘ দেখানো)
    if (!hadKey && keyDraft.trim()) {
      try {
        if (!window.localStorage.getItem('bps-ai-onboarded')) {
          window.localStorage.setItem('bps-ai-onboarded', '1');
          toast(tt('ai.onboard.title'), {
            description: tt('ai.onboard.desc'),
            duration: 15000,
          });
        }
      } catch { /* প্রাইভেট মোড */ }
    }
    close();
  };

  const removeKey = () => {
    setKeyDraft('');
    clearKey();
    setTest({ phase: 'idle' });
    toast.success(tt('ai.set.cleared'));
  };

  const openKeyPage = () => {
    if (preset.keyUrl) window.open(preset.keyUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="ai-set-dialog max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="ai-set-head">
          <DialogTitle className="flex items-center gap-2">
            <span className="ai-head-tile" aria-hidden="true"><Sparkles size={16} /></span>
            {tt('ai.set.title')}
            <span
              className={cn('ai-state-pill', configured && 'ai-state-pill-on')}
              role="status"
            >
              <BadgeCheck size={12} aria-hidden="true" />
              {configured ? tt('ai.set.state.on') : tt('ai.set.state.off')}
            </span>
          </DialogTitle>
          <DialogDescription>{tt('ai.set.desc')}</DialogDescription>
        </DialogHeader>

        {/* প্রোভাইডার বাছাই — প্রিমিয়াম কার্ড গ্রিড */}
        <section aria-label={tt('ai.set.provider')}>
          <Label className="ai-field-label">{tt('ai.set.provider')}</Label>
          <div className="ai-prov-grid" role="radiogroup" aria-label={tt('ai.set.provider')}>
            {AI_PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={config.provider === p.id}
                onClick={() => pickProvider(p.id)}
                className={cn('ai-prov-card', config.provider === p.id && 'ai-prov-card-on')}
              >
                <span className="ai-prov-tile" style={{ background: PROVIDER_TILE[p.id] }} aria-hidden="true">
                  {p.name.slice(0, 1)}
                </span>
                <span className="ai-prov-meta">
                  <span className="ai-prov-name">{p.name}</span>
                  <span className="ai-prov-desc">{tt(p.descKey)}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* সংযোগ বিবরণ */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="ai-field">
            <Label htmlFor="ai-baseurl" className="ai-field-label">{tt('ai.set.baseurl')}</Label>
            <Input
              id="ai-baseurl"
              value={config.baseUrl}
              onChange={(e) => setConfig({ baseUrl: e.target.value })}
              placeholder="https://api.example.com/v1/"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className="ai-field">
            <Label htmlFor="ai-model" className="ai-field-label">{tt('ai.set.model')}</Label>
            <div className="flex gap-1.5">
              <Input
                id="ai-model"
                value={config.model}
                onChange={(e) => setConfig({ model: e.target.value })}
                placeholder="glm-4.5v"
                autoComplete="off"
                spellCheck={false}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ai-models-btn shrink-0"
                onClick={() => void loadModels()}
                disabled={models.phase === 'loading'}
                title={tt('ai.set.models.load')}
              >
                {models.phase === 'loading'
                  ? <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                  : <ListChecks size={13} aria-hidden="true" />}
                <span className="hidden sm:inline">{tt('ai.set.models.load')}</span>
              </Button>
            </div>
            <p className="ai-field-hint">{tt('ai.set.models.hint')}</p>
          </div>
        </div>

        {/* মডেল তালিকা — প্রোভাইডার থেকে সরাসরি (404-মুক্ত বাছাই) */}
        {models.phase === 'ok' && models.models ? (
          <div className="ai-models-panel" ref={modelsRef}>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={13} className="ai-key-icon" aria-hidden="true" />
                <Input
                  value={modelFilter}
                  onChange={(e) => setModelFilter(e.target.value)}
                  placeholder={tt('ai.set.models.filterPh')}
                  className="ai-key-input pl-8 h-8 text-xs"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{models.models.length}</span>
            </div>
            <div className="ai-models-list" role="listbox" aria-label={tt('ai.set.models.load')}>
              {filteredModels.slice(0, 120).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="option"
                  aria-selected={config.model === m}
                  className={cn('ai-models-item', config.model === m && 'ai-models-item-on')}
                  onClick={() => {
                    setConfig({ model: m });
                    toast.success(`${tt('ai.set.model')}: ${m}`);
                  }}
                >
                  {m}
                </button>
              ))}
              {filteredModels.length === 0 ? (
                <p className="px-2 py-3 text-xs text-muted-foreground">{tt('ai.set.models.none')}</p>
              ) : null}
            </div>
          </div>
        ) : null}
        {models.phase === 'fail' ? (
          <div className="ai-test-result ai-test-fail" role="alert">
            <CircleAlert size={13} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              {tt(models.hintKey ?? 'ai.err.title')}
              {models.detail ? ` — ${models.detail}` : ''}
            </span>
          </div>
        ) : null}

        <div className="ai-field">
          <Label htmlFor="ai-key" className="ai-field-label">{tt('ai.set.key')}</Label>
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <KeyRound size={14} className="ai-key-icon" aria-hidden="true" />
              <Input
                id="ai-key"
                type={showKey ? 'text' : 'password'}
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                placeholder={tt('ai.set.key.ph')}
                autoComplete="off"
                spellCheck={false}
                className="ai-key-input pl-8 pr-9"
              />
              <button
                type="button"
                className="ai-key-eye"
                aria-label={showKey ? tt('ai.set.hide') : tt('ai.set.show')}
                onClick={() => setShowKey((v) => !v)}
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <Button variant="outline" size="sm" className="ai-paste-btn" onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                if (text.trim()) setKeyDraft(text.trim());
              } catch { /* ক্লিপবোর্ড অনুমতি নেই — ম্যানুয়াল পেস্ট */ }
            }}>
              <Copy size={13} aria-hidden="true" />
              <span className="sr-only">paste</span>
            </Button>
          </div>
        </div>

        {/* টেস্ট + অ্যাকশন */}
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" className="ai-test-btn" onClick={() => void runTest()} disabled={test.phase === 'testing'}>
            {test.phase === 'testing' ? tt('ai.set.testing') : tt('ai.set.test')}
          </Button>
          <Button size="sm" className="ai-save-btn" onClick={save} disabled={!configured}>
            {tt('ai.set.save')}
          </Button>
          {config.apiKey ? (
            <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={removeKey}>
              <Trash2 size={13} aria-hidden="true" /> {tt('ai.set.clear')}
            </Button>
          ) : null}
          {test.phase === 'ok' ? (
            <span className="ai-test-result ai-test-ok" role="status"><BadgeCheck size={13} aria-hidden="true" /> {tt('ai.set.test.ok')}</span>
          ) : null}
          {test.phase === 'fail' ? (
            <span className="ai-test-result ai-test-fail" role="alert">
              <CircleAlert size={13} aria-hidden="true" /> {tt('ai.set.test.fail')}
              {test.hintKey ? ` — ${tt(test.hintKey)}` : ''}
            </span>
          ) : null}
        </div>
        {test.phase === 'fail' && test.message ? (
          <p className="ai-test-detail">{test.message}{test.detail ? ` — ${test.detail}` : ''}</p>
        ) : null}

        {/* কি কোথায় পাব — ধাপে ধাপে গাইড */}
        <section className="ai-help" aria-label={tt('ai.set.help.title')}>
          <p className="ai-help-title">{tt('ai.set.help.title')}</p>
          <ol className="ai-help-steps">
            <li>{tt('ai.set.help.step1')}</li>
            <li>{tt('ai.set.help.step2')}</li>
            <li>{tt('ai.set.help.step3')}</li>
          </ol>
          <div className="flex flex-wrap items-center gap-2">
            {preset.keyUrl ? (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={openKeyPage}>
                <ExternalLink size={13} aria-hidden="true" /> {preset.name} — {tt('ai.set.help.link')}
              </Button>
            ) : (
              <span className="ai-custom-note">{tt('ai.set.customNote')}</span>
            )}
            <span className="ai-video-pill" title={tt('ai.set.video')}>
              <Video size={12} aria-hidden="true" /> {tt('ai.set.video')}
            </span>
          </div>
        </section>

        {/* নিরাপত্তা নোট */}
        <p className="ai-security-note">
          <ShieldCheck size={14} aria-hidden="true" /> {tt('ai.set.security')}
        </p>
      </DialogContent>
    </Dialog>
  );
}
