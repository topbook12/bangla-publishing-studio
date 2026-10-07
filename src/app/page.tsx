'use client';

import dynamic from 'next/dynamic';

const EditorApp = dynamic(() => import('@/components/editor-app'), {
  ssr: false,
  // ভাষা-নিরপেক্ষ লোডিং — bn/hi/en সবার আগে ব্রাউজারের ভাষা জানা যায় না
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <span
        className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"
        role="status"
        aria-label="Loading"
      />
    </div>
  ),
});

export default function Home() {
  return <EditorApp />;
}
