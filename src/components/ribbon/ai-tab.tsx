/**
 * AI ট্যাব — প্রিমিয়াম AI স্যুট: ভিশন (ছবি → কনটেন্ট), AI লেখক, BYOK সেটিংস
 */

'use client';

import { KeyRound, MessageSquare, ScanEye, Sparkles, Wand2 } from 'lucide-react';
import { RibbonButton, RibbonDivider, RibbonGroup } from './ribbon-shell';
import { useUiStore } from '@/lib/ui-store';
import { useAiStore, aiConfiguredSelector } from '@/lib/ai-store';
import { useT } from '@/lib/i18n';

export function AiTab() {
  const tt = useT();
  const openAi = useUiStore((s) => s.openAi);
  const openDialog = useUiStore((s) => s.open);
  const toggleAiChat = useUiStore((s) => s.toggleAiChat);
  const aiChatOpen = useUiStore((s) => s.aiChatOpen);
  const configured = useAiStore(aiConfiguredSelector);
  const providerName = useAiStore((s) => s.config.provider);

  return (
    <>
      <RibbonGroup label={tt('ai.group.vision')} accent="ai vision">
        <RibbonButton
          icon={ScanEye}
          label={tt('ai.btn.vision')}
          title={tt('ai.btn.vision.tip')}
          onClick={() => openAi('vision')}
        />
      </RibbonGroup>

      <RibbonDivider />

      <RibbonGroup label={tt('ai.group.writer')} accent="ai writer">
        <RibbonButton
          icon={Wand2}
          label={tt('ai.btn.write')}
          title={tt('ai.btn.write.tip')}
          onClick={() => openAi('text')}
        />
        <RibbonButton
          icon={MessageSquare}
          label={tt('ai.chat.open')}
          title={tt('ai.chat.tip')}
          active={aiChatOpen}
          onClick={toggleAiChat}
        />
      </RibbonGroup>

      <RibbonDivider />

      <RibbonGroup label={tt('ai.group.config')} accent="ai config">
        <RibbonButton
          icon={configured ? Sparkles : KeyRound}
          label={configured ? tt('ai.btn.settings') : tt('ai.btn.addKey')}
          title={tt('ai.btn.settings.tip')}
          active={configured}
          onClick={() => openDialog('aiSettings')}
        />
      </RibbonGroup>

      {/* স্ক্রিন-রিডার ও সুন্দর টুলটিপের জন্য প্রোভাইডার প্রেক্ষাপট */}
      <span className="sr-only">{configured ? providerName : tt('ai.status.off')}</span>
    </>
  );
}
