/**
 * প্রিমিয়াম ডিজাইন-সিস্টেম প্রিমিটিভ — "Aurora Studio" ভাষা
 * ─────────────────────────────────────────────────────────────
 * ClassForge-অনুপ্রাণিত প্রিমিয়াম রং-সংযোগ ও গ্রাফিক্স, প্ল্যাটফর্মের
 * সব টুল-পৃষ্ঠে (রিবন, ডায়ালগ, গ্যালারি) একরকম প্রয়োগের জন্য:
 *   • PTile   — রঙিন গ্রেডিয়েন্ট আইকন-টাইল (সাইডবার/কার্ডের বর্ণাঢ্য চিপ)
 *   • PPill   — টিন্টেড ব্যাজ (নতুন / জনপ্রিয় / AI / PRO)
 *   • PHero   — নরম গ্রেডিয়েন্ট ওয়াশ-সহ হিরো প্যানেল (ডায়ালগ-শিরোনাম)
 *   • PSection — টাইল-সহ সেকশন-শিরোনাম (টুল-ক্যাটাগরি শৈলী)
 *
 * সব রং CSS-ক্লাসে (globals.css-এর .ptile-*, .ppill-*, .phero) — থিম
 * (লাইট/ডার্ক) স্বয়ংক্রিয়ভাবে মানে। কম্পোনেন্টে কোনো হার্ডকোড রং নেই।
 */

import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** গ্রেডিয়েন্ট টাইলের কিউরেটেড হিউ-কী (CSS-এ .ptile-<tone> সংজ্ঞায়িত) */
export type PTone =
  | 'violet'   // রয়্যাল ভায়োলেট — ব্র্যান্ড
  | 'purple'   // অ্যামেথিস্ট
  | 'fuchsia'  // অর্কিড — AI
  | 'pink'     // ব্লশ
  | 'rose'     // গোলাপ
  | 'orange'   // অ্যাম্বার-কমলা
  | 'amber'    // সোনালি
  | 'lime'     // লাইম
  | 'teal'     // টিল
  | 'cyan'     // সায়ান
  | 'emerald'  // এমারেল্ড — সাফল্য
  | 'slate';   // গ্রাফাইট — নিরপেক্ষ

const TILE_ICON: Record<'sm' | 'md' | 'lg' | 'xl', number> = { sm: 13, md: 17, lg: 22, xl: 26 };

/**
 * PTile — গ্রেডিয়েন্ট আইকন-টাইল। ClassForge-এর বর্ণাঢ্য টুল-চিপের মতো
 * নরম গ্লো-শ্যাডো + উপরে সাদা হাইলাইট-বর্ডার। সাজসজ্জা মাত্র — aria-hidden।
 */
export function PTile({
  tone = 'violet',
  icon: Icon,
  size = 'md',
  className,
  style,
}: {
  tone?: PTone;
  icon: LucideIcon;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={cn('ptile', `ptile-${tone}`, `ptile-${size}`, className)}
      style={style}
      aria-hidden="true"
    >
      <Icon size={TILE_ICON[size]} strokeWidth={2.1} />
    </span>
  );
}

/** PPill-এর টোন — 'new' সবুজ, 'hot' অ্যাম্বার (জনপ্রিয়), 'ai' ফাক্সিয়া, 'info' ভায়োলেট, 'pro' গোল্ড */
export type PPillTone = 'new' | 'hot' | 'ai' | 'info' | 'pro';

/** PPill — নরম টিন্টেড ব্যাজ-পিল ("নতুন" / "জনপ্রিয়" / "AI") */
export function PPill({
  tone = 'info',
  children,
  className,
}: {
  tone?: PPillTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('ppill', `ppill-${tone}`, className)}>
      {children}
    </span>
  );
}

/**
 * PHero — ডায়ালগের প্রিমিয়াম হিরো-প্যানেল। বাঁয়ে বড় গ্রেডিয়েন্ট টাইল +
 * গ্রেডিয়েন্ট-শিরোনাম + বিবরণ + ঐচ্ছিক ব্যাজ/অ্যাকশন — ClassForge-হিরোর
 * সংকুচিত রূপ (ডায়ালগের মাথায় বসে)।
 */
export function PHero({
  tone = 'violet',
  icon,
  title,
  desc,
  badge,
  actions,
  className,
}: {
  tone?: PTone;
  icon: LucideIcon;
  title: string;
  desc?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('phero', className)}>
      <span className="phero-glow phero-glow-a" aria-hidden="true" />
      <span className="phero-glow phero-glow-b" aria-hidden="true" />
      <div className="phero-main">
        <PTile tone={tone} icon={icon} size="lg" className="phero-tile" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h2 className="phero-title">{title}</h2>
            {badge}
          </div>
          {desc ? <p className="phero-desc">{desc}</p> : null}
          {actions ? <div className="mt-2 flex flex-wrap gap-1.5">{actions}</div> : null}
        </div>
      </div>
    </div>
  );
}

/**
 * PSection — সেকশন-শিরোনাম: ছোট রঙিন টাইল + অর্ধ-বোল্ড লেবেল + ঐচ্ছিক
 * গণনা-ব্যাজ (ClassForge "Tool Categories" শিরোনামের মতো)।
 */
export function PSection({
  tone = 'violet',
  icon,
  title,
  count,
  className,
  children,
}: {
  tone?: PTone;
  icon: LucideIcon;
  title: string;
  count?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <PTile tone={tone} icon={icon} size="sm" />
      <span className="psection-title">{title}</span>
      {count ? <span className="psection-count">{count}</span> : null}
      {children}
    </div>
  );
}
