'use client';

import { useEffect } from 'react';

/**
 * PWA সার্ভিস ওয়ার্কার রেজিস্ট্রেশন কম্পোনেন্ট।
 * কোনো UI আউটপুট নেই (null)। ব্যর্থ হলে নীরবে fail করে —
 * dev পরিবেশ বা অসমর্থক ব্রাউজারেও নিরাপদ।
 */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch {
        // নীরবে ব্যর্থ: dev পরিবেশে SW না চললেও অ্যাপ স্বাভাবিক থাকবে
      }
    };

    register();
  }, []);

  return null;
}
