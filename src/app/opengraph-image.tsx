import { ImageResponse } from 'next/og';

/**
 * The card people see when notestify.com is pasted into Discord, LinkedIn,
 * Slack or iMessage. Generated rather than a static PNG so it stays in sync
 * with the brand without maintaining an asset.
 *
 * Drawn with plain divs and inline styles: Satori supports only a subset of
 * CSS — no Tailwind classes, no external stylesheets, flexbox only.
 */
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Notestify — Turn your notes into flashcards, quizzes and an AI tutor';

const ESPRESSO = '#2E1A0E';
const PAPER = '#FFFBF4';
const CITRUS = '#F2A61E';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#F7E9D6',
          padding: 72,
          fontFamily: 'sans-serif',
        }}
      >
        {/* Wordmark with the notebook mark redrawn at OG scale. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <svg width="64" height="64" viewBox="0 0 128 128">
            <rect x="40" y="18" width="58" height="92" rx="6" fill={ESPRESSO} />
            <rect x="26" y="12" width="12" height="10" rx="3" fill={ESPRESSO} />
            <rect x="26" y="20" width="12" height="70" fill={CITRUS} />
            <path d="M26 90 H38 L32 106 Z" fill={ESPRESSO} />
            <path d="M28.6 99 H35.4 L32 106 Z" fill={PAPER} />
            <g fill={PAPER}>
              <rect x="26" y="30" width="22" height="5" rx="2.5" />
              <rect x="26" y="48" width="22" height="5" rx="2.5" />
              <rect x="26" y="66" width="22" height="5" rx="2.5" />
              <rect x="26" y="84" width="22" height="5" rx="2.5" />
            </g>
            <g transform="translate(30 24) scale(0.62)">
              <path
                d="M34 96 V32 H47 L81 74 V32 H83 L94 43 V96 H81 L47 54 V96 Z"
                fill={PAPER}
              />
            </g>
          </svg>
          <div style={{ fontSize: 44, fontWeight: 800, color: ESPRESSO, letterSpacing: -1.5 }}>
            Notestify
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              fontSize: 76,
              fontWeight: 800,
              color: ESPRESSO,
              lineHeight: 1.08,
              letterSpacing: -3,
            }}
          >
            Study smarter,
          </div>
          <div style={{ display: 'flex', marginTop: 8 }}>
            <div
              style={{
                display: 'flex',
                fontSize: 76,
                fontWeight: 800,
                color: ESPRESSO,
                lineHeight: 1.08,
                letterSpacing: -3,
                background: CITRUS,
                padding: '2px 16px',
                borderRadius: 8,
              }}
            >
              one note at a time.
            </div>
          </div>
          <div style={{ display: 'flex', marginTop: 28, fontSize: 30, color: '#5A4331' }}>
            Flashcards, quizzes and an AI tutor from your own PDFs and notes.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {['SM-2 spaced repetition', 'PDF · DOCX · PPTX', 'AI tutor'].map((label) => (
            <div
              key={label}
              style={{
                display: 'flex',
                border: `3px solid ${ESPRESSO}`,
                borderRadius: 999,
                padding: '10px 22px',
                fontSize: 24,
                fontWeight: 700,
                color: ESPRESSO,
                background: PAPER,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
