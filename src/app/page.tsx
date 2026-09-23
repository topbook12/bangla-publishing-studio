'use client';

import dynamic from 'next/dynamic';

const EditorApp = dynamic(() => import('@/components/editor-app'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <p className="text-sm text-slate-500">লোড হচ্ছে…</p>
    </div>
  ),
});

export default function Home() {
  return <EditorApp />;
}
