import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import corridor from '../data/corridor.json';
import { AssistantFab } from '../components/assistant/AssistantFab';
import { DoorArt } from '../components/art/DoorArt';
import { GlassButton, GlassCard, Icon, type IconName } from '../components/glass';
import { storageService } from '../services/storageService';

interface ConfettiPiece {
  left: number;
  color: string;
  delay: number;
  dur: number;
  size: number;
}

function makeConfetti(): ConfettiPiece[] {
  return Array.from({ length: 26 }).map(() => ({
    left: Math.random() * 100,
    color: Math.random() > 0.55 ? '#7BC4D9' : '#F5B946',
    delay: Math.random() * 2.5,
    dur: 3 + Math.random() * 2,
    size: 6 + Math.random() * 6,
  }));
}

export default function Arrived() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPieces(makeConfetti());
    // Recents copy mirrors the language active at arrival time. If the user
    // later switches languages, older entries keep their original strings.
    storageService.pushRecent({
      nodeId: corridor.destination.nodeId,
      label: t('destination.title'),
      meta: t('destination.meta'),
    });
  }, [t]);

  const actions: Array<{ icon: IconName; key: 'save' | 'report' | 'feedback' }> = [
    { icon: 'bookmark', key: 'save' },
    { icon: 'alert', key: 'report' },
    { icon: 'message', key: 'feedback' },
  ];

  return (
    <div className="warm-bg relative min-h-[100dvh] fade-in flex flex-col overflow-hidden">
      <div aria-hidden className="absolute inset-0 pointer-events-none z-[5]">
        {pieces.map((p, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${p.left}%`,
              background: p.color,
              width: p.size,
              height: p.size,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
              opacity: 0.85,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <div
          className="w-[92px] h-[92px] rounded-full glass-strong flex items-center justify-center"
          style={{
            boxShadow:
              '0 0 40px rgba(123,196,217,0.55), inset 0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          <div className="w-[68px] h-[68px] rounded-full cyan-glow flex items-center justify-center">
            <Icon name="check" size={36} stroke={2.4} />
          </div>
        </div>
        <div className="text-[28px] font-semibold tight text-[color:var(--navy)] mt-5 text-center">
          {t('arrived.title')}
        </div>
        <div className="text-[15px] text-[color:var(--navy)]/75 mt-1">
          {t('arrived.subtitle')}
        </div>

        <GlassCard className="mt-6 p-3 flex items-center gap-3 w-full max-w-[320px]">
          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
            <DoorArt number="21 W" />
          </div>
          <div className="flex-1">
            <div className="text-[12px] font-semibold text-[color:var(--navy)]">
              {t('arrived.matches_title')}
            </div>
            <div className="text-[11px] text-[color:var(--navy)]/60">
              {t('arrived.matches_body')}
            </div>
          </div>
          <div className="w-7 h-7 rounded-full cyan-glow flex items-center justify-center">
            <Icon name="check" size={14} stroke={2.5} />
          </div>
        </GlassCard>

        <div className="grid grid-cols-3 gap-2 w-full max-w-[320px] mt-5">
          {actions.map((a) => (
            <button
              key={a.key}
              className="glass rounded-2xl p-3 flex flex-col items-center gap-1.5 press transition-smooth"
            >
              <Icon name={a.icon} size={18} className="text-[color:var(--navy)]" />
              <span className="text-[11px] font-medium text-[color:var(--navy)]">
                {t(`arrived.actions.${a.key}`)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 px-5 pb-8 space-y-2">
        <GlassButton
          variant="cyan"
          onClick={() => navigate('/landing')}
          className="w-full py-3.5 text-[14px] font-semibold"
        >
          {t('arrived.navigate_elsewhere')}
        </GlassButton>
        <GlassButton onClick={() => navigate('/')} className="w-full py-3 text-[13px]">
          {t('common.close')}
        </GlassButton>
      </div>

      <AssistantFab />
    </div>
  );
}
