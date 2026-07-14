// The content contract between the data layer (src/data/site.ts) and the
// page/component layer. Cited from agentculture/org and reshaped for
// jetson-arena: the org's framework/agents/engage sections are gone, and the
// site identity (name, url, description) plus a shared nav moved into the
// data layer so Header, Footer, and Layout all read from one place.

export interface NavLink {
  /** Root-relative href, e.g. "/arena/" — or an absolute external URL. */
  href: string;
  label: string;
}

export interface Hero {
  /** Sub-line under the site name: what this is, in one breath. */
  tagline: string;
  /** 1–3 short paragraphs answering "what is jetson-arena" on their own. */
  intro: string[];
}

export interface SiteData {
  /** The site's display name, e.g. "Jetson Arena". */
  name: string;
  /** Canonical origin, no trailing path, e.g. "https://jetson-arena.com". */
  url: string;
  /** Default meta description for the shared shell. */
  description: string;
  /** Primary navigation, shared by Header and Footer. */
  nav: NavLink[];
  hero: Hero;
}
