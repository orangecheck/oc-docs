import type { OcPopupOutcome } from '@orangecheck/me-client/react';
import type { CSSProperties } from 'react';

import { OrangecheckMark } from '@orangecheck/mark/react';
import { OUTCOME_COPY, SignInWithOrangecheck } from '@orangecheck/me-client/react';
import { useState } from 'react';

/*
 * Three made-up sites, each with its own button style, light and dark. The
 * orangecheck button takes the same class as the site's own button and draws
 * nothing of its own: font, colour, radius, height, hover and focus are the
 * site's. Each shows it with words and as the mark alone (the site's icon
 * button: no padding, a 44px square). Signing in here opens the real
 * orangecheck window.
 */
const HOST_CSS = `
[data-demo-host] { border-radius: 14px; padding: 20px; }
[data-demo-host] .demo-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 12px; }
[data-demo-host] .demo-name { display: block; font-size: 12px; line-height: 16px; letter-spacing: .04em; text-transform: uppercase; opacity: .7; }
[data-demo-host] .demo-note { font-size: 13px; margin: 0; }
[data-demo-host] .demo-note:not(:empty) { margin-top: 12px; }
[data-demo-host] .host-btn.host-icon { padding: 0; min-width: 44px; }

[data-demo-host='ledger'] { background: #fbfaf7; color: #1c1917; font-family: system-ui, sans-serif; border: 1px solid #e7e5e4; }
[data-demo-host='ledger'] .host-btn { font: 640 16px/1.2 system-ui, sans-serif; color: #1c1917; background: transparent; border: 1px solid #d6d3d1; border-radius: 10px; padding: 9px 20px; min-height: 44px; }
[data-demo-host='ledger'] .host-btn:hover { background: #f5f5f4; }
[data-demo-host='ledger'] .host-btn.solid { background: #1c1917; color: #fafaf9; border-color: #1c1917; }
:is(.dark *) [data-demo-host='ledger'] { background: #1c1917; color: #fafaf9; border-color: #292524; }
:is(.dark *) [data-demo-host='ledger'] .host-btn { color: #fafaf9; border-color: #44403c; }
:is(.dark *) [data-demo-host='ledger'] .host-btn:hover { background: #292524; }
:is(.dark *) [data-demo-host='ledger'] .host-btn.solid { background: #fafaf9; color: #1c1917; border-color: #fafaf9; }

[data-demo-host='studio'] { background: #ffffff; color: #18181b; font-family: Inter, system-ui, sans-serif; border: 1px solid #e4e4e7; }
[data-demo-host='studio'] .host-btn { font: 500 14px/1 Inter, system-ui, sans-serif; color: #18181b; background: #ffffff; border: 1px solid #d4d4d8; border-radius: 2px; padding: 0 14px; min-height: 44px; }
[data-demo-host='studio'] .host-btn:hover { border-color: #0a7d8e; }
[data-demo-host='studio'] .host-btn:focus-visible { outline: 2px solid #0a7d8e; outline-offset: 1px; }
[data-demo-host='studio'] .host-btn.solid { background: #0a7d8e; color: #ffffff; border-color: #0a7d8e; }
:is(.dark *) [data-demo-host='studio'] { background: #09090b; color: #fafafa; border-color: #27272a; }
:is(.dark *) [data-demo-host='studio'] .host-btn { color: #fafafa; background: #09090b; border-color: #3f3f46; }
:is(.dark *) [data-demo-host='studio'] .host-btn.solid { background: #22c8dd; color: #09090b; border-color: #22c8dd; }

[data-demo-host='lantern'] { background: #fff8ec; color: #2b1d05; font-family: Inter, system-ui, sans-serif; border: 1px solid #f3dfb8; }
[data-demo-host='lantern'] .host-btn { font: 600 15px/1.2 Inter, system-ui, sans-serif; color: #2b1d05; background: #f2b04a; border: 0; border-radius: 11px; padding: 12px 18px; min-height: 46px; }
[data-demo-host='lantern'] .host-btn:hover { filter: brightness(1.06); }
[data-demo-host='lantern'] .host-btn.quiet { background: transparent; box-shadow: inset 0 0 0 1px #e8c27a; }
[data-demo-host='lantern'] .host-btn.host-icon { min-width: 46px; }
:is(.dark *) [data-demo-host='lantern'] { background: #17120a; color: #f8ecd6; border-color: #3a2c12; }
:is(.dark *) [data-demo-host='lantern'] .host-btn.quiet { color: #f8ecd6; box-shadow: inset 0 0 0 1px #6b5023; }
`;

function useOutcome() {
    const [note, setNote] = useState('');
    return {
        note,
        onSignedIn: ({ account }: { account: { did_oc?: string } }) =>
            setNote(`Signed in as ${account.did_oc ?? 'an orangecheck account'}.`),
        onOutcome: (o: OcPopupOutcome) => {
            if (o.status === 'blocked' || o.status === 'closed' || o.status === 'failed')
                setNote(OUTCOME_COPY[o.status]);
        },
    };
}

function Host({
    id,
    name,
    own,
    ownClass,
    mark,
}: {
    id: string;
    name: string;
    own: string;
    ownClass: string;
    mark?: 'mono' | 'tile';
}) {
    const { note, onSignedIn, onOutcome } = useOutcome();
    return (
        <section data-demo-host={id} aria-label={`${name}, a made-up site`}>
            <span className="demo-name">{name}</span>
            <div className="demo-row">
                <button type="button" className={ownClass}>
                    {own}
                </button>
                <SignInWithOrangecheck
                    className="host-btn"
                    mark={mark}
                    onSignedIn={onSignedIn}
                    onOutcome={onOutcome}
                />
                <SignInWithOrangecheck
                    className="host-btn host-icon"
                    label={false}
                    mark={mark}
                    onSignedIn={onSignedIn}
                    onOutcome={onOutcome}
                />
            </div>
            <p className="demo-note" role="status">
                {note}
            </p>
        </section>
    );
}

/** The three made-up sites, one above another. */
export function SignInButtonHosts() {
    return (
        <div data-demo="hosts" className="not-prose my-6 grid gap-4">
            <style>{HOST_CSS}</style>
            <Host id="ledger" name="Ledger" own="Email me a code" ownClass="host-btn solid" />
            <Host id="studio" name="Studio" own="Continue with email" ownClass="host-btn solid" />
            <Host
                id="lantern"
                name="Lantern"
                own="Use email instead"
                ownClass="host-btn quiet"
                mark="mono"
            />
        </div>
    );
}

/** orangecheck's own button, as drawn and themed. */
export function SignInButtonBrand() {
    const plain = useOutcome();
    const themed = useOutcome();
    return (
        <div data-demo="brand" className="not-prose my-6 flex flex-wrap items-center gap-4">
            <SignInWithOrangecheck
                appearance="brand"
                mark="brand"
                onSignedIn={plain.onSignedIn}
                onOutcome={plain.onOutcome}
            />
            <span
                style={
                    {
                        '--oc-button-bg': '#1d2a44',
                        '--oc-button-hover-bg': '#2a3a5c',
                        '--oc-button-border': '#1d2a44',
                        '--oc-button-radius': '999px',
                    } as CSSProperties
                }
            >
                <SignInWithOrangecheck
                    appearance="brand"
                    mark="brand"
                    label="Continue with orangecheck"
                    onSignedIn={themed.onSignedIn}
                    onOutcome={themed.onOutcome}
                />
            </span>
            <p className="m-0 text-sm" role="status">
                {plain.note || themed.note}
            </p>
        </div>
    );
}

/** The mark's three variants, each on the ground it is for. */
export function MarkVariants() {
    const cell = 'flex flex-col items-center gap-2 rounded-xl p-4 text-xs';
    return (
        <div data-demo="marks" className="not-prose my-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div
                className={cell}
                style={{ background: '#ffffff', color: '#18181b', border: '1px solid #e4e4e7' }}
            >
                <OrangecheckMark variant="mono" size="48px" title="orangecheck, mono" />
                mono on light
            </div>
            <div className={cell} style={{ background: '#0a0a0a', color: '#fafafa' }}>
                <OrangecheckMark variant="mono" size="48px" title="orangecheck, mono" />
                mono on dark
            </div>
            <div className={cell} style={{ background: '#0a0a0a', color: '#fafafa' }}>
                <OrangecheckMark variant="brand" size="48px" title="orangecheck" />
                brand, dark only
            </div>
            <div
                className={cell}
                style={{ background: '#ffffff', color: '#18181b', border: '1px solid #e4e4e7' }}
            >
                <OrangecheckMark variant="tile" size="40px" title="orangecheck" />
                tile, any ground
            </div>
        </div>
    );
}
