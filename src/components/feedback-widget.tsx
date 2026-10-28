'use client';

/**
 * ফিডব্যাক উইজেট — সাইকেল-১ (ইউজার-ফিডব্যাক-চালিত উন্নয়ন চক্র)
 *
 * নিচে-বামে ভাসমান ট্রিগার → ডায়ালগ (স্টার রেটিং, বিভাগ চিপ, ফ্রি-টেক্সট) →
 * POST /api/feedback → Sonner টোস্ট। ui-store-এর feedbackOpen দিয়ে সব
 * পৃষ্ঠ (ল্যান্ডিং/স্টুডিও/হেল্প-ডায়ালগ) থেকে খোলা যায়।
 *
 * প্রাইভেসি: ইমেইল নেই, IP নেই — সাইন-ইন থাকলে শুধু userId লিংক হয়।
 * বট-ট্র্যাপ: অদৃশ্য 'website' ফিল্ড (হানিপট)।
 */

import { useEffect, useState } from 'react';
import { MessageSquarePlus, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useUiStore } from '@/lib/ui-store';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const CATEGORIES = ['bug', 'idea', 'praise', 'question', 'other'] as const;
type Category = (typeof CATEGORIES)[number];

const CAT_TONE: Record<Category, string> = {
  bug: 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
  idea: 'bg-amber-50 text-amber-700 border-amber-300 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  praise: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  question: 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
  other: 'border-stone-300 bg-stone-50 text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300',
};

export function FeedbackWidget() {
  const tt = useT();
  const open = useUiStore((s) => s.feedbackOpen);
  const setOpen = useUiStore((s) => s.setFeedbackOpen);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [category, setCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [sending, setSending] = useState(false);

  // ডায়ালগ বন্ধ হলে ফর্ম রিসেট (পরের বার তাজা শুরু)
  useEffect(() => {
    if (!open) {
      setRating(0);
      setHover(0);
      setCategory(null);
      setMessage('');
      setHoneypot('');
      setSending(false);
    }
  }, [open]);

  const valid = rating >= 1 && category !== null && message.trim().length >= 3;

  const submit = async () => {
    if (!valid || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          rating,
          category,
          message: message.trim().slice(0, 2000),
          page: location.pathname === '/' ? 'landing' : 'studio',
          website: honeypot, // বট-ট্র্যাপ — মানুষ লিখতে পারে না
        }),
      });
      if (res.ok) {
        toast.success(tt('fb.thanks'));
        setOpen(false);
      } else {
        toast.error(tt('fb.error'));
      }
    } catch {
      toast.error(tt('fb.error'));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* ভাসমান ট্রিগার — নিচে-বামে (ইনস্টল ব্যানার নিচে-ডানে) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={tt('fb.action')}
        title={tt('fb.action')}
        className="fixed bottom-4 left-4 z-40 inline-flex h-11 items-center gap-2 rounded-full border bg-card/95 px-4 text-xs font-semibold text-foreground shadow-md backdrop-blur transition-all hover:bg-accent hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-sm:bottom-3 max-sm:left-3 max-sm:h-10 max-sm:px-3"
        style={{ paddingBottom: 0 }}
      >
        <MessageSquarePlus className="h-4 w-4 text-primary" aria-hidden="true" />
        <span className="hidden sm:inline">{tt('fb.action')}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquarePlus className="h-4 w-4 text-primary" aria-hidden="true" />
              {tt('fb.title')}
            </DialogTitle>
            <DialogDescription>{tt('fb.desc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* স্টার রেটিং */}
            <div>
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{tt('fb.rating')}</p>
              <div className="flex items-center gap-1" role="radiogroup" aria-label={tt('fb.rating')}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rating === n}
                    aria-label={tt(`fb.star.${n}` as 'fb.star.1')}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(n)}
                    className="rounded-md p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Star
                      className={cn(
                        'h-6 w-6 transition-colors',
                        (hover || rating) >= n
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground/40',
                      )}
                      aria-hidden="true"
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-xs font-medium text-muted-foreground">
                    {tt(`fb.star.${rating}` as 'fb.star.1')}
                  </span>
                )}
              </div>
            </div>

            {/* বিভাগ চিপ */}
            <div>
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{tt('fb.category')}</p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={category === c}
                    onClick={() => setCategory(c)}
                    className={cn(
                      'inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      category === c
                        ? CAT_TONE[c]
                        : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    {tt(`fb.cat.${c}` as 'fb.cat.bug')}
                  </button>
                ))}
              </div>
            </div>

            {/* ফ্রি-টেক্সট */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="fb-message" className="text-xs font-semibold text-muted-foreground">
                  {tt('fb.message')}
                </label>
                <span className="text-[10px] text-muted-foreground">
                  {message.length}/2000 {tt('fb.chars')}
                </span>
              </div>
              <Textarea
                id="fb-message"
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
                placeholder={tt('fb.message.ph')}
                rows={4}
                maxLength={2000}
                className="resize-none text-sm"
              />
            </div>

            {/* হানিপট — স্ক্রিন-রিডারে লুকানো, ট্যাব-বাইপাস */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Website
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </label>
            </div>

            {/* অ্যাকশন */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!valid || sending}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? tt('fb.sending') : tt('fb.send')}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
