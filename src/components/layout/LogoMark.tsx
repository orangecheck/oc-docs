interface LogoMarkProps {
    size?: number;
    className?: string;
}

/**
 * The OC Docs mark: a filled square with three horizontal text-lines inside,
 * suggesting a page of documentation. Same boxy cypherpunk language as the
 * sibling product marks (OCHK check, OC Lock padlock, OC Stamp anchor, OC
 * Vote scale, OC Agent grid, OC Pledge clasp) — visually a peer in the
 * family rather than a sub-mark of any one product.
 *
 * The third line is intentionally shorter than the first two — reads as
 * "page of text," and gives the eye an asymmetric anchor point.
 */
export function LogoMark({ size = 22, className }: LogoMarkProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden="true"
        >
            {/* outer page body — filled square */}
            <rect x="3" y="3" width="18" height="18" fill="var(--brand)" />
            {/* inner frame — the page edge */}
            <rect
                x="6"
                y="6"
                width="12"
                height="12"
                fill="none"
                stroke="var(--brand-foreground)"
                strokeWidth="1.5"
            />
            {/* three horizontal text-lines stacked inside the frame */}
            <rect x="8" y="9" width="8" height="1.25" fill="var(--brand-foreground)" />
            <rect x="8" y="11.5" width="8" height="1.25" fill="var(--brand-foreground)" />
            <rect x="8" y="14" width="5" height="1.25" fill="var(--brand-foreground)" />
        </svg>
    );
}
