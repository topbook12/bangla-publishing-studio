/**
 * BrandMark — "Grand Ink" ব্র্যান্ড চিহ্ন
 * খোলা বই + সোনালি বুকমার্ক ফিতা। আইকন-গ্রিড বেস্ট প্র্যাকটিস অনুযায়ী
 * সামঞ্জস্যপূর্ণ 2px স্ট্রোক, অপটিক্যাল ব্যালান্স, currentColor সাপোর্ট।
 */

export function BrandMark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* খোলা বইয়ের দুই পাতা */}
      <path d="M12 6.8C10.2 5.1 7.7 4.3 4.5 4.3a1 1 0 0 0-1 1v11.4a1 1 0 0 0 1 1c3.2 0 5.7.8 7.5 2.5 1.8-1.7 4.3-2.5 7.5-2.5a1 1 0 0 0 1-1V5.3a1 1 0 0 0-1-1c-3.2 0-5.7.8-7.5 2.5Z" />
      {/* স্পাইন */}
      <path d="M12 6.8v13.4" />
      {/* সোনালি বুকমার্ক ফিতা (অ্যাম্বার — ফয়েল স্ট্যাম্পিং) */}
      <path
        d="M15.5 4.6v4.9l1.75-1.4 1.75 1.4V4.9"
        stroke="oklch(0.72 0.14 78)"
        fill="oklch(0.72 0.14 78)"
        fillOpacity={0.25}
      />
    </svg>
  );
}
