import {
  GlassButton,
  GlassCard,
  GlassChip,
  GlassIconButton,
  Icon,
} from '../components/glass';

/**
 * /debug/glass — renders every glass variant against the warm campus bg so
 * the design reviewer can inspect tokens, blur, glows, and radii in isolation.
 * This route is scaffolding only; it's unused by the production flow.
 */
export default function DebugGlass() {
  return (
    <div className="warm-bg relative min-h-[100dvh]">
      <div className="relative z-10 max-w-[540px] mx-auto px-5 py-14 space-y-6">
        <header>
          <div className="text-[10px] trk-wide uppercase text-navy/60">Path2Class · Step 2</div>
          <h1 className="text-[24px] font-semibold tight text-navy mt-1">
            Liquid Glass primitives
          </h1>
          <p className="text-[13px] text-navy/70 mt-1 leading-[1.55]">
            Visual tokens and glass surfaces ported 1:1 from the prototype.
          </p>
        </header>

        {/* Cards */}
        <section className="space-y-3">
          <SectionLabel>GlassCard · default</SectionLabel>
          <GlassCard className="p-5">
            <div className="text-[13px] font-semibold text-navy tight">Default glass</div>
            <div className="text-[12px] text-navy/60 mt-1">
              rgba(255,255,255,0.32) · blur 24 · rounded-3xl
            </div>
          </GlassCard>

          <SectionLabel>GlassCard · strong, radius 4xl</SectionLabel>
          <GlassCard className="p-5" strong radius="4xl">
            <div className="text-[13px] font-semibold text-navy tight">Strong glass (32px)</div>
            <div className="text-[12px] text-navy/60 mt-1">
              rgba(255,255,255,0.55) · blur 36 · rounded-4xl
            </div>
          </GlassCard>
        </section>

        {/* Buttons */}
        <section className="space-y-3">
          <SectionLabel>GlassButton · variants</SectionLabel>
          <div className="flex flex-wrap gap-2">
            <GlassButton variant="cyan" icon="camera" className="px-5 py-3">
              Start AR navigation
            </GlassButton>
            <GlassButton className="px-5 py-3">Use text directions</GlassButton>
            <GlassButton variant="ghost" className="px-5 py-3">
              Ghost
            </GlassButton>
          </div>
        </section>

        {/* Chips */}
        <section className="space-y-3">
          <SectionLabel>GlassChip · tones</SectionLabel>
          <div className="flex flex-wrap gap-2">
            <GlassChip icon="globe">IT</GlassChip>
            <GlassChip icon="wheelchair" active tone="amber">
              Accessible route
            </GlassChip>
            <GlassChip icon="clock" active tone="cyan">
              ~2 min
            </GlassChip>
          </div>
        </section>

        {/* Icon buttons */}
        <section className="space-y-3">
          <SectionLabel>GlassIconButton</SectionLabel>
          <div className="flex flex-wrap gap-2">
            <GlassIconButton aria-label="Back" size={40}>
              <Icon name="chevron-left" size={20} />
            </GlassIconButton>
            <GlassIconButton aria-label="Close" size={40}>
              <Icon name="x" size={18} />
            </GlassIconButton>
            <GlassIconButton aria-label="Help" size={40}>
              <Icon name="help" size={18} />
            </GlassIconButton>
            <GlassIconButton aria-label="Switch to text mode" size={40}>
              <Icon name="switch" size={18} />
            </GlassIconButton>
          </div>
        </section>

        {/* Color tokens */}
        <section className="space-y-3">
          <SectionLabel>Tokens</SectionLabel>
          <GlassCard className="p-4 grid grid-cols-2 gap-3 text-[11px]">
            {[
              { name: 'navy', hex: '#1E3A5F' },
              { name: 'cyan', hex: '#7BC4D9' },
              { name: 'cyan-glow', hex: '#A8E3F5' },
              { name: 'amber', hex: '#F5B946' },
              { name: 'coral', hex: '#E86A5C' },
              { name: 'sand', hex: '#E8DFC9' },
            ].map((t) => (
              <div key={t.name} className="flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-md border border-white/40"
                  style={{ background: t.hex }}
                />
                <span className="text-navy font-medium">{t.name}</span>
                <span className="text-navy/50">{t.hex}</span>
              </div>
            ))}
          </GlassCard>
        </section>

        {/* Motion */}
        <section className="space-y-3">
          <SectionLabel>Motion</SectionLabel>
          <GlassCard className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full cyan-glow flex items-center justify-center pulse-cyan">
              <Icon name="sparkle" size={18} />
            </div>
            <div className="text-[12px] text-navy/70">
              <strong className="text-navy">pulse-cyan</strong> · 2s ease-in-out
            </div>
          </GlassCard>
          <GlassCard className="p-4 flex items-center gap-4 pulse-amber amber-glow">
            <div className="text-[12px] text-navy/70">
              <strong className="text-navy">pulse-amber</strong> · 1.8s ease-in-out
            </div>
          </GlassCard>
        </section>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="text-[10px] trk-wide uppercase text-navy/55 pl-1">{children}</div>
  );
}
