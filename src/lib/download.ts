/**
 * ব্রাউজার ডাউনলোড হেল্পার — Blob/স্ট্রিং ফাইল হিসেবে সেভ
 */

export function saveAs(content: Blob | string, filename: string, mime?: string): void {
  const blob = typeof content === 'string'
    ? new Blob([content], { type: mime ?? 'text/plain;charset=utf-8' })
    : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
