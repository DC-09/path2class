import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import corridor from '../data/corridor.json';
import { GlassCard, GlassChip, Icon, type IconName } from '../components/glass';
import { AssistantFab } from '../components/assistant/AssistantFab';
import { useSessionStore } from '../stores/useSessionStore';
import { storageService } from '../services/storageService';

/**
 * Landing — shows current location, language/accessibility chips, search,
 * recents (when present), and a static Nearby list.
 *
 * QR entry: ?loc=<locationKey>. For MVP only `entrance_b_corridor_2w` is
 * valid; anything else renders an error card.
 */
export default function Landing() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const [showResult, setShowResult] = useState(false);

  const language = useSessionStore((s) => s.language);
  const accessibility = useSessionStore((s) => s.accessibility);
  const cycleLanguage = useSessionStore((s) => s.cycleLanguage);
  const toggleAccessibility = useSessionStore((s) => s.toggleAccessibility);
  const setLocationKey = useSessionStore((s) => s.setLocationKey);

  const loc = params.get('loc');
  const invalidLoc = loc && loc !== corridor.locationKey ? loc : null;
  const recents = useMemo(() => storageService.getRecents(), []);

  useEffect(() => {
    if (loc && loc === corridor.locationKey) setLocationKey(loc);
  }, [loc, setLocationKey]);

  if (invalidLoc) {
    return (
      <div className="warm-bg relative min-h-[100dvh] flex items-center justify-center px-6 py-8 fade-in">
        <GlassCard className="p-6 w-full max-w-[360px] text-center" strong radius="4xl">
          <div
            className="w-14 h-14 rounded-2xl coral-glow flex items-center justify-center mx-auto"
            style={{ background: 'linear-gradient(180deg,#F59287,#E86A5C)', color: '#fff' }}
          >
            <Icon name="alert" size={26} />
          </div>
          <div className="text-[20px] font-semibold tight text-[color:var(--navy)] mt-4">
            {t('landing.invalid_loc_title')}
          </div>
          <div className="text-[13px] text-[color:var(--navy)]/70 mt-1.5 leading-[1.5]">
            {t('landing.invalid_loc_body', { loc: invalidLoc })}
          </div>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="glass rounded-full px-4 py-2 mt-5 text-[13px] font-semibold text-[color:var(--navy)] press transition-smooth"
          >
            {t('landing.invalid_loc_back')}
          </button>
        </GlassCard>
      </div>
    );
  }

  const nearby: Array<{ key: string; icon: IconName }> = [
    { key: 'notice_board', icon: 'bookmark' },
    { key: 'elevator', icon: 'elevator' },
    { key: 'emergency_exit', icon: 'flag' },
  ];

  return (
    <div className="warm-bg relative min-h-[100dvh] fade-in pb-28">
      {/* Status header */}
      <div className="relative z-10 px-5 pt-14 pb-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-1.5 text-[10px] trk-wide uppercase text-[color:var(--navy)]/60">
            <Icon name="pin" size={12} /> {t('common.you_are_at')}
          </div>
          <div className="text-[20px] font-semibold tight text-[color:var(--navy)] mt-1">
            {t('landing.location_title')}
            <br />
            <span className="text-[color:var(--navy)]/80 font-medium text-[15px]">
              {t('landing.location_sub')}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <GlassChip
              icon="globe"
              onClick={cycleLanguage}
              aria-label={t('landing.change_language_aria')}
            >
              {language.toUpperCase()}
            </GlassChip>
            <GlassChip
              icon="wheelchair"
              active={accessibility}
              tone="amber"
              onClick={toggleAccessibility}
            >
              {t('landing.accessible_route')}
            </GlassChip>
          </div>
        </GlassCard>
      </div>

      {/* Search */}
      <div className="relative z-10 px-5">
        <GlassCard className="px-4 py-3.5 flex items-center gap-3">
          <Icon name="search" size={18} className="text-[color:var(--navy)]/50" />
          <input
            placeholder={t('landing.search_placeholder')}
            onFocus={() => setShowResult(true)}
            aria-label={t('landing.search_aria')}
            className="bg-transparent outline-none flex-1 text-[15px] placeholder:text-[color:var(--navy)]/40 text-[color:var(--navy)]"
          />
        </GlassCard>

        {showResult && (
          <div className="mt-3 fade-in">
            <button
              onClick={() => navigate('/destination')}
              className="glass rounded-3xl w-full p-3 flex items-center gap-3 press transition-smooth text-left"
            >
              <div className="w-12 h-12 rounded-2xl overflow-hidden glass-dim flex items-center justify-center">
                <Icon name="door" size={22} className="text-[color:var(--navy)]" />
              </div>
              <div className="flex-1">
                <div className="text-[15px] font-semibold text-[color:var(--navy)] tight">
                  {t('landing.room_124')}
                </div>
                <div className="text-[12px] text-[color:var(--navy)]/60">
                  {t('landing.room_124_meta')}
                </div>
              </div>
              <Icon name="chevron-right" size={18} className="text-[color:var(--navy)]/50" />
            </button>
          </div>
        )}
      </div>

      {recents.length > 0 && (
        <div className="relative z-10 px-5 mt-6">
          <div className="text-[10px] trk-wide uppercase text-[color:var(--navy)]/50 mb-2 px-1">
            {t('common.recents')}
          </div>
          <div className="space-y-2">
            {recents.map((r) => (
              <button
                key={r.nodeId}
                onClick={() => navigate('/destination')}
                className="glass rounded-3xl w-full p-3 flex items-center gap-3 press transition-smooth text-left"
              >
                <div className="w-10 h-10 rounded-xl glass-dim flex items-center justify-center">
                  <Icon name="door" size={18} className="text-[color:var(--navy)]/70" />
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-medium text-[color:var(--navy)] tight">
                    {r.label}
                  </div>
                  <div className="text-[11px] text-[color:var(--navy)]/55">{r.meta}</div>
                </div>
                <Icon name="chevron-right" size={16} className="text-[color:var(--navy)]/40" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative z-10 px-5 mt-6">
        <div className="text-[10px] trk-wide uppercase text-[color:var(--navy)]/50 mb-2 px-1">
          {t('common.nearby')}
        </div>
        <div className="space-y-2">
          {nearby.map((r) => (
            <GlassCard key={r.key} className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl glass-dim flex items-center justify-center">
                <Icon name={r.icon} size={18} className="text-[color:var(--navy)]/70" />
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-medium text-[color:var(--navy)] tight">
                  {t(`landing.nearby_items.${r.key}.name`)}
                </div>
                <div className="text-[11px] text-[color:var(--navy)]/55">
                  {t(`landing.nearby_items.${r.key}.meta`)}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      <AssistantFab />
    </div>
  );
}
