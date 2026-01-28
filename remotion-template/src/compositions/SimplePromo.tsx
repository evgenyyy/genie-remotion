import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';
import {z} from 'zod';

export const simplePromoSchema = z.object({
  headline: z.string().describe('Main headline'),
  subhead: z.string().optional(),
  bullets: z.array(z.string()).max(5).optional(),
  theme: z.enum(['navy', 'green', 'blue']).optional(),
});

export const defaultSimplePromoProps = {
  headline: 'Remotion renders video from code.',
  subhead: 'Genie can automate editing, captions, and demos.',
  bullets: ['Render MP4 via MCP tool', 'Pass props as JSON', 'Iterate fast'],
  theme: 'navy',
};

type Props = z.infer<typeof simplePromoSchema>;

export const SimplePromo: React.FC<Props> = ({headline, subhead, bullets, theme}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, 20], [20, 0], {extrapolateRight: 'clamp'});

  const bg =
    theme === 'green'
      ? 'radial-gradient(1200px 700px at 20% 20%, rgba(0,255,170,0.25) 0%, rgba(0,0,0,0) 60%), #071018'
      : theme === 'blue'
      ? 'radial-gradient(1200px 700px at 20% 20%, rgba(80,140,255,0.28) 0%, rgba(0,0,0,0) 60%), #070b15'
      : 'radial-gradient(1200px 700px at 20% 20%, rgba(120,180,255,0.18) 0%, rgba(0,0,0,0) 60%), #070b15';

  return (
    <AbsoluteFill style={{background: bg, color: 'white', fontFamily: 'Inter, system-ui, sans-serif'}}>
      <div style={{position: 'absolute', top: 160, left: 140, right: 140, transform: `translateY(${t}px)`}}>
        <div style={{fontSize: 74, fontWeight: 900, letterSpacing: -1}}>{headline}</div>
        {subhead ? <div style={{marginTop: 18, fontSize: 34, opacity: 0.85}}>{subhead}</div> : null}
        {bullets?.length ? (
          <div style={{marginTop: 44, fontSize: 30, opacity: 0.9, lineHeight: 1.4}}>
            {bullets.slice(0, 5).map((b, i) => (
              <div key={i} style={{display: 'flex', gap: 12}}>
                <div style={{opacity: 0.7}}>•</div>
                <div>{b}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div style={{position: 'absolute', bottom: 120, left: 140, fontSize: 26, opacity: 0.75}}>
        12s promo — 1920×1080 — 30fps
      </div>
    </AbsoluteFill>
  );
};
