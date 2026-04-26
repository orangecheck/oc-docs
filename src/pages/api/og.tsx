import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

/**
 * Dynamic OG image endpoint for docs.ochk.io. 1200×630 PNG.
 * Engineer-variant tagline — names the technical foundation
 * (BIP-322 + Nostr kind-30078 + OpenTimestamps) since the docs
 * hub's reader is more often a developer than a stranger.
 */
export default function handler() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#0b0909',
                    position: 'relative',
                    fontFamily: 'monospace',
                    color: '#f5efe8',
                    padding: 72,
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage:
                            'linear-gradient(to right, #1e1a19 1px, transparent 1px), linear-gradient(to bottom, #1e1a19 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: 22,
                        fontWeight: 700,
                        letterSpacing: 4,
                        textTransform: 'uppercase',
                        color: '#f97316',
                    }}
                >
                    <span style={{ opacity: 0.5, marginRight: 12 }}>{'>_'}</span>
                    <span>docs.ochk.io</span>
                </div>

                {/* book/braces mark */}
                <div
                    style={{
                        position: 'absolute',
                        right: 96,
                        top: 96,
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <svg
                        width="140"
                        height="140"
                        viewBox="0 0 100 100"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <rect
                            x="6"
                            y="6"
                            width="88"
                            height="88"
                            rx="6"
                            fill="none"
                            stroke="#f97316"
                            strokeWidth="6"
                        />
                        <text
                            x="50"
                            y="64"
                            textAnchor="middle"
                            fontSize="44"
                            fontWeight="700"
                            fontFamily="monospace"
                            fill="#f97316"
                        >
                            {'{·}'}
                        </text>
                    </svg>
                </div>

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        marginTop: 56,
                    }}
                >
                    <div
                        style={{
                            fontSize: 84,
                            fontWeight: 700,
                            letterSpacing: -3,
                            lineHeight: 1.02,
                            color: '#f5efe8',
                        }}
                    >
                        the orangecheck
                    </div>
                    <div
                        style={{
                            fontSize: 84,
                            fontWeight: 700,
                            letterSpacing: -3,
                            lineHeight: 1.02,
                            color: '#f97316',
                        }}
                    >
                        handbook.
                    </div>
                </div>

                <div
                    style={{
                        marginTop: 28,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        fontSize: 22,
                        fontWeight: 600,
                        letterSpacing: 1.5,
                        color: '#a89f97',
                    }}
                >
                    <div>
                        am · whisper · decide · declare · delegate · swear
                    </div>
                    <div style={{ fontSize: 18, color: '#7a716a' }}>
                        identity · confidentiality · legitimacy · provenance · authority · commitment
                    </div>
                </div>

                <div
                    style={{
                        position: 'absolute',
                        left: 72,
                        right: 72,
                        bottom: 52,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 14,
                        borderTop: '1px solid #2a2524',
                        paddingTop: 22,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            fontSize: 18,
                            fontWeight: 700,
                            letterSpacing: 5,
                            color: '#f5efe8',
                        }}
                    >
                        <span>BIP-322</span>
                        <span style={{ color: '#2a2524', margin: '0 14px' }}>·</span>
                        <span>NOSTR KIND-30078</span>
                        <span style={{ color: '#2a2524', margin: '0 14px' }}>·</span>
                        <span>OPENTIMESTAMPS</span>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 16,
                            fontWeight: 600,
                            letterSpacing: 3,
                            color: '#a89f97',
                        }}
                    >
                        <span>DOCS.OCHK.IO</span>
                        <span>§ MIT · CC-BY-4.0</span>
                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}
