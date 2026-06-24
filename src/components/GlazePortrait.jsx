export function GlazePortrait({ expression, mood }) {
  const exp = expression || mood?.toLowerCase() || 'neutral';

  const expAttrs = {
    neutral: { eyeO: 0, eyeH: 14, eyeW: 10, mouth: 'M -10 20 Q 0 25 10 20', browY: 0 },
    nervous: { eyeO: 0.7, eyeH: 16, eyeW: 9, mouth: 'M -12 22 Q 0 28 12 22', browY: -3 },
    terrified: { eyeO: 1, eyeH: 18, eyeW: 12, mouth: 'M -14 25 Q 0 32 14 25', browY: -6, browTilt: true },
    pleased: { eyeO: 0.3, eyeH: 12, eyeW: 8, mouth: 'M -12 18 Q 0 10 12 18', browY: 2, eyelids: 0.3 },
    smug: { eyeO: 0.4, eyeH: 11, eyeW: 7, mouth: 'M -10 16 Q 0 8 10 16', browY: 4, oneBrow: true },
    frustrated: { eyeO: 0.6, eyeH: 13, eyeW: 8, mouth: 'M -12 24 Q 0 30 12 24', browY: -5, browDown: true },
    suspicious: { eyeO: 0.5, eyeH: 12, eyeW: 7, mouth: 'M -10 22 Q 0 26 10 22', browY: -4, oneBrow: true },
    triumphant: { eyeO: 0, eyeH: 16, eyeW: 10, mouth: 'M -14 16 Q 0 4 14 16', browY: 3 },
    cooperative: { eyeO: 0.2, eyeH: 13, eyeW: 9, mouth: 'M -10 17 Q 0 12 10 17', browY: 1 },
    hangry: { eyeO: 0.8, eyeH: 15, eyeW: 9, mouth: 'M -12 26 Q 0 34 12 26', browY: -5, browDown: true },
    preening: { eyeO: 0.3, eyeH: 13, eyeW: 8, mouth: 'M -10 16 Q 0 6 10 16', browY: 3, eyelids: 0.5 },
    sulking: { eyeO: 0.5, eyeH: 14, eyeW: 8, mouth: 'M -10 24 Q 0 30 10 24', browY: -2 },
  };

  const a = expAttrs[exp] || expAttrs.neutral;
  const glowColor = {
    terrified: '#FF4444', nervous: '#FFAA00', pleased: '#44FF88',
    smug: '#00C8FF', frustrated: '#FF8800', suspicious: '#FF8800',
    triumphant: '#FF00FF', cooperative: '#00C8FF', hangry: '#FF6600',
    preening: '#44FF88', sulking: '#6B2FAF', neutral: '#4B1A8C',
  }[exp] || '#4B1A8C';

  return (
    <svg viewBox="0 0 120 140" className="glaze-portrait" style={{ filter: `drop-shadow(0 0 12px ${glowColor}40)` }}>
      <defs>
        <radialGradient id="headGrad" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#3a1a6e" />
          <stop offset="100%" stopColor="#1a0a3e" />
        </radialGradient>
        <filter id="portraitGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Captain's hat */}
      <rect x="30" y="8" width="60" height="18" rx="3" fill="#0A0014" stroke="#4B1A8C" strokeWidth="1.5" />
      <rect x="40" y="2" width="40" height="12" rx="2" fill="#0A0014" stroke="#4B1A8C" strokeWidth="1" />
      <rect x="50" y="4" width="20" height="8" rx="2" fill="#FFD700" opacity="0.8" />
      <circle cx="60" cy="8" r="3" fill="#FFD700" opacity="0.9" />

      {/* Head */}
      <ellipse cx="60" cy="60" rx="38" ry="42" fill="url(#headGrad)" stroke="#4B1A8C" strokeWidth="1.5" />

      {/* Ears */}
      <ellipse cx="28" cy="40" rx="10" ry="14" fill="#1a0a3e" stroke="#4B1A8C" strokeWidth="1" transform="rotate(-15 28 40)" />
      <ellipse cx="92" cy="40" rx="10" ry="14" fill="#1a0a3e" stroke="#4B1A8C" strokeWidth="1" transform="rotate(15 92 40)" />

      {/* Eyes */}
      <g transform={`translate(0, ${a.browY || 0})`}>
        {/* Left eye */}
        <ellipse cx="45" cy="52" rx="7" ry={a.eyeH ? a.eyeH / 2 : 7} fill="white" opacity={0.9} />
        <circle cx="45" cy="52" r={a.eyeO > 0.5 ? 5 : 4} fill="#00C8FF" filter="url(#portraitGlow)">
          <animate attributeName="r" values={a.eyeO > 0.5 ? "4;6;4" : "3;4;3"} dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="45" cy="52" r="2" fill="white" opacity="0.8" />
        {a.eyelids > 0 && <rect x="38" y="48" width="14" height={a.eyelids * 8} rx="1" fill="#1a0a3e" opacity={a.eyelids * 0.6} />}

        {/* Right eye */}
        <ellipse cx="75" cy="52" rx="7" ry={a.eyeH ? a.eyeH / 2 : 7} fill="white" opacity={0.9} />
        <circle cx="75" cy="52" r={a.eyeO > 0.5 ? 5 : 4} fill="#00C8FF" filter="url(#portraitGlow)">
          <animate attributeName="r" values={a.eyeO > 0.5 ? "4;6;4" : "3;4;3"} dur="3.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="75" cy="52" r="2" fill="white" opacity="0.8" />
        {a.eyelids > 0 && <rect x="68" y="48" width="14" height={a.eyelids * 8} rx="1" fill="#1a0a3e" opacity={a.eyelids * 0.6} />}

        {/* Eyebrows */}
        <line x1="37" y1={a.browDown ? 41 : 43} x2="53" y2={a.browDown ? 47 : 43}
          stroke="#4B1A8C" strokeWidth={a.oneBrow ? 0 : 2.5} strokeLinecap="round" />
        <line x1={a.oneBrow ? 65 : 67} y1={a.oneBrow ? 41 : 43} x2={a.oneBrow ? 75 : 83} y2={a.oneBrow ? 41 : 43}
          stroke="#4B1A8C" strokeWidth={2.5} strokeLinecap="round" />
      </g>

      {/* Nose */}
      <ellipse cx="60" cy="62" rx="3" ry="4" fill="#2D0E52" />

      {/* Mouth */}
      <path d={a.mouth} fill="none" stroke="#6B2FAF" strokeWidth="2" strokeLinecap="round" />

      {/* Cheek blush */}
      <ellipse cx="35" cy="65" rx="8" ry="5" fill="#FF00FF" opacity={exp === 'terrified' ? 0.2 : 0.08} />
      <ellipse cx="85" cy="65" rx="8" ry="5" fill="#FF00FF" opacity={exp === 'terrified' ? 0.2 : 0.08} />

      {/* Body / uniform collar */}
      <rect x="35" y="95" width="50" height="20" rx="3" fill="#0A0014" stroke="#4B1A8C" strokeWidth="1" />
      <rect x="50" y="98" width="20" height="14" fill="#FFD700" opacity="0.6" rx="2" />
    </svg>
  );
}
