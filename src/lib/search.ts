import type { SearchGroup, SearchResult } from '@orangecheck/app-design/components';

import { SITE_CONFIG } from '@/lib/site.config';

import { DOCS_NAV, findDocsPage, findSectionFor } from '@/components/docs/nav';

/*
 * Search over the docs' own pages. The index (public/search-index.json, from
 * scripts/gen-search-index.mjs) is fetched the first time someone types, then
 * kept. Every word must appear; a word in a title counts most, then in a
 * heading, then in the text, and the last word may be the start of one.
 */

type Section = [id: string, heading: string, text: string];
type Page = [route: string, title: string, sections: Section[]];

interface Entry {
    route: string;
    title: string;
    group: string;
    sdk: boolean;
    /** In the sidebar: a page someone wrote, not a generated one. */
    guide: boolean;
    /** A package the sidebar marks deprecated. */
    deprecated: boolean;
    /** What a generated page documents: "verify" for "Function: verify()". */
    symbol: string;
    titleLc: string;
    sections: { id: string; heading: string; headingLc: string; text: string; textLc: string }[];
}

let loading: Promise<Entry[]> | null = null;

/** Packages the sidebar labels "(deprecated)". */
const DEPRECATED = new Set(
    DOCS_NAV.flatMap((s) => s.items)
        .filter((i) => i.label.includes('(deprecated)'))
        .map((i) => i.href.match(/^\/sdk\/([^/]+)\//)?.[1])
        .filter(Boolean)
);

/** The group a page sits in: its sidebar section, or its SDK package. */
function groupOf(route: string): string {
    const sdk = route.match(/^\/sdk\/([^/]+)\//);
    if (sdk) return `@orangecheck/${sdk[1]}`;
    const section = findSectionFor(route);
    if (section) return section.label;
    const top = route.split('/')[1];
    return top ? top.charAt(0).toUpperCase() + top.slice(1) : 'Docs';
}

function load(): Promise<Entry[]> {
    loading ??= fetch(`${SITE_CONFIG.basePath}/search-index.json`)
        .then((r) => {
            if (!r.ok) throw new Error(`search index ${r.status}`);
            return r.json() as Promise<{ pages: Page[] }>;
        })
        .then(({ pages }) =>
            pages.map(([route, title, sections]) => ({
                route,
                title,
                group: groupOf(route),
                sdk: route.startsWith('/sdk/') && route.split('/').length > 3,
                guide: findDocsPage(route) !== undefined,
                deprecated: DEPRECATED.has(route.match(/^\/sdk\/([^/]+)\//)?.[1] ?? ''),
                symbol: title
                    .toLowerCase()
                    .replace(/^(function|interface|class|type alias|variable|enumeration):\s*/, '')
                    .replace(/^@orangecheck\//, '')
                    .replace(/\(\)$|<.*$/, ''),
                titleLc: title.toLowerCase(),
                sections: sections.map(([id, heading, text]) => ({
                    id,
                    heading,
                    headingLc: heading.toLowerCase(),
                    text,
                    textLc: text.toLowerCase(),
                })),
            }))
        )
        .catch((e) => {
            loading = null;
            throw e;
        });
    return loading;
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Words of the query; the last may be the start of a word. */
function terms(query: string): string[] {
    return query
        .toLowerCase()
        .split(/[^\p{L}\p{N}@/._-]+/u)
        .map((t) => t.replace(/^[._/-]+|[._/-]+$/g, ''))
        .filter((t) => t.length > 0);
}

/** A window of the text around the first match, with every match marked. */
function excerpt(text: string, textLc: string, words: string[]): string | undefined {
    const at = Math.min(...words.map((w) => textLc.indexOf(w)).filter((i) => i >= 0));
    if (!Number.isFinite(at)) return undefined;
    const start = Math.max(0, text.lastIndexOf(' ', Math.max(0, at - 60)) + 1);
    let end = Math.min(text.length, at + 160);
    if (end < text.length) end = Math.max(at + 1, text.lastIndexOf(' ', end));
    const slice = text.slice(start, end);
    const marked = escapeHtml(slice).replace(
        new RegExp(`(${words.map((w) => escapeRe(escapeHtml(w))).join('|')})`, 'gi'),
        '<mark>$1</mark>'
    );
    return `${start > 0 ? '… ' : ''}${marked}${end < text.length ? ' …' : ''}`;
}

interface Word {
    text: string;
    /** The word on its own: "verify" in "verify()", not in "verifyPledge". */
    whole: RegExp;
    /** The start of a word: "verif" in "verify". */
    start: RegExp;
}

const word = (text: string): Word => ({
    text,
    whole: new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRe(text)}($|[^\\p{L}\\p{N}])`, 'u'),
    start: new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRe(text)}`, 'u'),
});

/** How well one field holds a word: on its own, as the start of one, anywhere. */
const tier = (hay: string, w: Word, [whole, start, any]: [number, number, number]) =>
    !hay.includes(w.text) ? 0 : w.whole.test(hay) ? whole : w.start.test(hay) ? start : any;

function score(entry: Entry, words: Word[], phrase: string) {
    // Every word must be on the page; each section is scored to choose the link.
    const pageHay =
        entry.titleLc + ' ' + entry.sections.map((s) => s.headingLc + ' ' + s.textLc).join(' ');
    if (!words.every((w) => pageHay.includes(w.text))) return null;
    let title = words.reduce((t, w) => t + tier(entry.titleLc, w, [20, 10, 4]), 0);
    // The page is named by the query: "Charter", "Function: verify()".
    const bare = entry.titleLc.replace(/^.*·\s*/, '');
    if (bare === phrase || entry.symbol === phrase) title += 30;
    const named = words.every((w) => w.whole.test(entry.titleLc));
    let best: { section: Entry['sections'][number] | null; score: number } = {
        section: null,
        score: 0,
    };
    for (const section of entry.sections) {
        let heading = 0;
        let text = 0;
        for (const w of words) {
            heading += tier(section.headingLc, w, [8, 5, 2]);
            const n = section.textLc.split(w.text).length - 1;
            if (n > 0) text += tier(section.textLc, w, [2, 1.5, 1]) + Math.min(3, n - 1) * 0.5;
        }
        if (words.length > 1 && section.headingLc.includes(phrase)) heading += 8;
        if (words.length > 1 && section.textLc.includes(phrase)) text += 4;
        if (heading + text > best.score) best = { section, score: heading + text };
    }
    // Link to the section that holds the words, unless the page itself is named and
    // the section only mentions them.
    if (named && best.section && !words.some((w) => best.section!.headingLc.includes(w.text))) {
        best = { section: null, score: best.score };
    }
    best.score += title;
    if (words.length > 1 && entry.titleLc.includes(phrase)) best.score += 12;
    // A guide before a generated reference page, unless the query names it.
    if (entry.sdk && entry.symbol !== phrase) best.score *= 0.45;
    if (entry.deprecated) best.score *= 0.5;
    if (entry.guide) best.score *= 1.15;
    return best;
}

const LIMIT = 24;
/** A group shows its best few, so one package cannot push a better match off the list. */
const PER_GROUP = 4;

export async function searchDocs(query: string, signal?: AbortSignal): Promise<SearchGroup[]> {
    const words = terms(query).map(word);
    if (words.length === 0) return [];
    const entries = await load();
    if (signal?.aborted) return [];
    const phrase = words.map((w) => w.text).join(' ');
    const hits: { entry: Entry; section: Entry['sections'][number] | null; score: number }[] = [];
    for (const entry of entries) {
        const s = score(entry, words, phrase);
        if (s && s.score > 0) hits.push({ entry, ...s });
    }
    hits.sort((a, b) => b.score - a.score || a.entry.route.length - b.entry.route.length);
    const groups = new Map<string, SearchResult[]>();
    let shown = 0;
    for (const { entry, section } of hits) {
        if (shown === LIMIT) break;
        if ((groups.get(entry.group)?.length ?? 0) === PER_GROUP) continue;
        shown++;
        const deep = section && section.id ? section : null;
        const src = section ?? entry.sections[0];
        const result: SearchResult = {
            id: entry.route + (deep ? `#${deep.id}` : ''),
            href: `${SITE_CONFIG.basePath}${entry.route === '/' ? '' : entry.route}${deep ? `#${deep.id}` : ''}`,
            title: entry.title,
            section: deep ? deep.heading : undefined,
            excerptHtml: src
                ? excerpt(
                      src.text,
                      src.textLc,
                      words.map((w) => w.text)
                  )
                : undefined,
        };
        const list = groups.get(entry.group) ?? [];
        list.push(result);
        groups.set(entry.group, list);
    }
    return [...groups].map(([label, results]) => ({ label, results }));
}

/** The address a result opens, without the base path the router adds. */
export function routeOf(href: string): string {
    const base = SITE_CONFIG.basePath;
    return href.startsWith(base) ? href.slice(base.length) || '/' : href;
}
