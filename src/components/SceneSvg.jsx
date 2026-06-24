export function SceneSvg({ room, riftsIntensity, strayWoke }) {
  const isBridge = room?.id === 'bridge';
  const isBay = room?.id === 'glazing_bay';
  const isMaw = room?.id === 'maw';

  const riftOpacity = 0.3 + (riftsIntensity / 100) * 0.5;

  return (
    <svg viewBox="0 0 800 450" className="scene-svg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="riftGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF00FF" stopOpacity={riftOpacity} />
          <stop offset="100%" stopColor="#FF00FF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00C8FF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#00C8FF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0A0014" />
          <stop offset="50%" stopColor="#1a0533" />
          <stop offset="100%" stopColor="#0D0020" />
        </linearGradient>
        <filter id="glitch">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width="800" height="450" fill="url(#bgGrad)" />

      {/* Stars */}
      {Array.from({ length: 40 }).map((_, i) => (
        <circle key={i} cx={Math.random() * 800} cy={Math.random() * 450} r={0.5 + Math.random() * 1.5}
          fill="white" opacity={0.3 + Math.random() * 0.5}>
          <animate attributeName="opacity" values={`${0.2 + Math.random() * 0.3};${0.5 + Math.random() * 0.5};${0.2 + Math.random() * 0.3}`} dur={`${1 + Math.random() * 3}s`} repeatCount="indefinite" />
        </circle>
      ))}

      {/* Rifts */}
      {Array.from({ length: Math.max(1, Math.floor(riftsIntensity / 15)) }).map((_, i) => (
        <ellipse key={`rift-${i}`} cx={200 + Math.random() * 400} cy={100 + Math.random() * 200}
          rx={20 + Math.random() * 40} ry={40 + Math.random() * 60}
          fill="none" stroke="#FF00FF" strokeWidth="2" opacity={riftOpacity} filter="url(#glow)">
          <animate attributeName="rx" values={`${20 + Math.random() * 30};${30 + Math.random() * 40};${20 + Math.random() * 30}`} dur={`${1 + Math.random()}s`} repeatCount="indefinite" />
          <animate attributeName="ry" values={`${40 + Math.random() * 40};${50 + Math.random() * 50};${40 + Math.random() * 40}`} dur={`${1.2 + Math.random()}s`} repeatCount="indefinite" />
        </ellipse>
      ))}

      {/* Bridge Scene */}
      {isBridge && (
        <g>
          {/* Ship console */}
          <rect x="150" y="200" width="500" height="200" rx="10" fill="#1a0a2e" stroke="#4B1A8C" strokeWidth="2" />
          <rect x="180" y="220" width="150" height="40" rx="4" fill="#0a0014" stroke="#00C8FF" strokeWidth="1" opacity="0.6" />
          <text x="255" y="245" textAnchor="middle" fill="#00C8FF" fontSize="10" fontFamily="monospace">WARNING: RIFT DETECTED</text>
          <rect x="350" y="220" width="100" height="40" rx="4" fill="#0a0014" stroke="#FF4444" strokeWidth="1" />
          <text x="400" y="245" textAnchor="middle" fill="#FF4444" fontSize="10" fontFamily="monospace">INTEGRITY: {Math.max(0, Math.round(100 - riftsIntensity * 1.2))}%</text>
          <rect x="470" y="220" width="150" height="40" rx="4" fill="#0a0014" stroke="#FFAA00" strokeWidth="1" />
          <text x="545" y="245" textAnchor="middle" fill="#FFAA00" fontSize="10" fontFamily="monospace">PASTRY DRIVE: OFFLINE</text>

          {/* Viewport */}
          <ellipse cx="400" cy="140" rx="200" ry="60" fill="#0D0020" stroke="#4B1A8C" strokeWidth="2" />
          <ellipse cx="400" cy="140" rx="180" ry="50" fill="url(#riftGlow)" />

          {/* Alert lights */}
          {Array.from({ length: 5 }).map((_, i) => (
            <circle key={`alert-${i}`} cx={200 + i * 100} cy="190" r="4" fill="#FF4444">
              <animate attributeName="opacity" values="1;0.2;1" dur={`${0.5 + (i % 3) * 0.3}s`} repeatCount="indefinite" />
            </circle>
          ))}

          {/* Hatch (objective) */}
          <rect x="720" y="280" width="60" height="90" rx="5" fill="#2D0E52" stroke="#00C8FF" strokeWidth="2">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
          </rect>
          <text x="750" y="350" textAnchor="middle" fill="#00C8FF" fontSize="9" fontFamily="monospace">HATCH</text>
        </g>
      )}

      {/* Glazing Bay */}
      {isBay && (
        <g>
          {/* Doughnut forge */}
          <rect x="100" y="250" width="600" height="180" rx="15" fill="#1a0a2e" stroke="#4B1A8C" strokeWidth="2" />
          <rect x="130" y="270" width="540" height="140" rx="10" fill="#0D0020" stroke="#6B2FAF" strokeWidth="1" />

          {/* Glaze Cores */}
          {Array.from({ length: 4 }).map((_, i) => (
            <g key={`core-${i}`} transform={`translate(${200 + i * 110}, 310)`}>
              <circle cx="0" cy="0" r="18" fill="#4B1A8C" stroke="#00C8FF" strokeWidth="2" filter="url(#glow)">
                <animate attributeName="r" values="16;20;16" dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" />
              </circle>
              <circle cx="0" cy="0" r="8" fill="#00C8FF" opacity="0.8" />
              <circle cx="0" cy="0" r="3" fill="white" opacity="0.9" />
            </g>
          ))}

          {/* Stray cat sleeping */}
          <g transform="translate(550, 340)">
            {strayWoke ? (
              <g>
                <text x="0" y="0" textAnchor="middle" fontSize="35">😾</text>
                <circle cx="-10" cy="-5" r="3" fill="#FF4444">
                  <animate attributeName="opacity" values="1;0;1" dur="0.5s" repeatCount="indefinite" />
                </circle>
                <text x="0" y="25" textAnchor="middle" fill="#FF4444" fontSize="8" fontFamily="monospace">⚠️ CHROME STRAY ACTIVE</text>
              </g>
            ) : (
              <g>
                <text x="0" y="0" textAnchor="middle" fontSize="30">😺</text>
                <text x="35" y="5" fontSize="10" fill="#00C8FF">Zzz</text>
                <text x="0" y="25" textAnchor="middle" fill="#8870A0" fontSize="8" fontFamily="monospace">💤 DORMANT</text>
              </g>
            )}
          </g>
        </g>
      )}

      {/* The Maw */}
      {isMaw && (
        <g>
          {/* Rift in center */}
          <ellipse cx="400" cy="200" rx="120" ry="160" fill="url(#riftGlow)" filter="url(#glow)">
            <animate attributeName="rx" values="110;130;110" dur="2s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="400" cy="200" rx="60" ry="100" fill="#FF00FF" opacity="0.15">
            <animate attributeName="ry" values="90;110;90" dur="3s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="400" cy="200" rx="20" ry="50" fill="white" opacity="0.1" />

          {/* Vermious the Glazeworm */}
          <g transform="translate(150, 320)">
            <ellipse cx="0" cy="0" rx="100" ry="30" fill="#2D0E52" stroke="#4B1A8C" strokeWidth="2" />
            <ellipse cx="0" cy="-5" rx="95" ry="25" fill="#3a1a6e" />
            <ellipse cx="60" cy="-8" rx="40" ry="18" fill="#4B1A8C" />
            {/* Eyes */}
            <circle cx="-30" cy="-12" r="5" fill="#00FF88" filter="url(#glow)">
              <animate attributeName="r" values="4;6;4" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="-15" cy="-12" r="5" fill="#00FF88" filter="url(#glow)">
              <animate attributeName="r" values="6;4;6" dur="2.5s" repeatCount="indefinite" />
            </circle>
            {/* Mouth */}
            <ellipse cx="40" cy="5" rx="15" ry="5" fill="#0a0014" />
            {/* Worm body coils */}
            <path d="M 100 0 Q 130 -30 160 0 Q 190 30 220 0" fill="none" stroke="#4B1A8C" strokeWidth="8" strokeLinecap="round">
              <animate attributeName="d" values="M 100 0 Q 130 -30 160 0 Q 190 30 220 0;M 100 -5 Q 130 -25 160 -5 Q 190 25 220 -5;M 100 0 Q 130 -30 160 0 Q 190 30 220 0" dur="4s" repeatCount="indefinite" />
            </path>
          </g>

          {/* Portal (objective) */}
          <g transform="translate(650, 200)">
            <ellipse cx="0" cy="0" rx="40" ry="70" fill="none" stroke="#00C8FF" strokeWidth="3" opacity="0.6" filter="url(#glow)">
              <animate attributeName="rx" values="35;45;35" dur="3s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="0" cy="0" rx="20" ry="50" fill="#00C8FF" opacity="0.1" />
            <text x="0" y="90" textAnchor="middle" fill="#00C8FF" fontSize="9" fontFamily="monospace">PORTAL</text>
          </g>
        </g>
      )}

      {/* Rift tear overlay */}
      {riftsIntensity > 30 && Array.from({ length: Math.floor(riftsIntensity / 20) }).map((_, i) => (
        <line key={`tear-${i}`} x1={Math.random() * 800} y1={Math.random() * 450}
          x2={Math.random() * 800} y2={Math.random() * 450}
          stroke="#FF00FF" strokeWidth={1 + Math.random() * 2} opacity={0.3 + Math.random() * 0.3}>
          <animate attributeName="opacity" values={`${0.2};${0.5};${0.2}`} dur={`${0.5 + Math.random()}s`} repeatCount="indefinite" />
        </line>
      ))}

      {/* Vignette */}
      <rect width="800" height="450" fill="url(#bgGrad)" opacity="0.3" pointerEvents="none" />
    </svg>
  );
}
