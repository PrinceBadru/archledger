import type { ThemeName } from "./theme";

/**
 * What the site says about itself: the home page, the sign-in screens' side panels and
 * the page titles read from here. Edit freely.
 */
export const site = {
  name: "ArchLedger",
  tagline: "Your System Architecture, Demystified",
  description: "An interactive System Catalogue that keeps your team's microservices, infrastructure, and architectural decisions organized in a single pane of glass.",
  /**
   * The look of the whole app: sign-in screens, dashboard, admin and home page.
   * One of: default, coral, amber, sky, mono, emerald. FLARE_THEME (shell or .env)
   * overrides it when the app is built or run with `flare dev`.
   */
  theme: "mono" as ThemeName,
  /** How the dashboard behaves. */
  dashboard: {
    /**
     * Where a record is created and edited: in a dialog over the list ("modal", the
     * default, which keeps the list, its filters and your place in it), or on its own
     * page ("page", better for long forms).
     */
    forms: "sheet" as "sheet" | "page",
  },
  /** The small pill above the home page headline; set to null to hide it. */
  announcement: { label: "New", text: "Interactive Obsidian-Style Graph Mapping", href: "/sign-up" } as { label: string; text: string; href: string } | null,
  /** The home page's feature grid (icon names from lucide.dev). */
  features: [
    { icon: "layout-dashboard", title: "Interactive Graph", description: "Zoom, pan, and explore your entire system architecture with our Obsidian-style visual map." },
    { icon: "plug", title: "Component Catalog", description: "Track all your microservices, databases, and APIs with detailed lifecycle stages and metadata." },
    { icon: "users", title: "Dependency Mapping", description: "Instantly understand the blast radius of changes by tracking upstream and downstream dependencies." },
    { icon: "shield-check", title: "Security Events", description: "Monitor and manage security events tied directly to specific infrastructure nodes." },
    { icon: "zap", title: "Architecture Decisions", description: "Log and search historical ADRs so your team always knows why a system was built." },
    { icon: "credit-card", title: "Metrics & Costs", description: "Built-in dashboards to measure operational metrics and visualize infrastructure spending." },
  ],
  /** Placeholder names for the logo strip: replace them with your customers (or remove the strip). */
  customers: ["Acme Corp", "Globex", "Initech", "Massive Dynamic", "Stark Industries"],
  /** Shown beside the sign-up form. */
  highlights: [
    "Interactive map of your entire tech stack",
    "Track Architecture Decision Records (ADRs)",
    "Monitor infrastructure costs and security events",
  ],
  /** Shown on the sign-in screen of themes with a quote panel. */
  testimonial: {
    quote: "To build the ultimate source of truth for engineering teams—where architectural diagrams are always up-to-date, dependencies are never a mystery, and the 'why' behind every system is perfectly preserved.",
    author: "ArchLedger",
    role: "Product Vision",
  },
  links: {
    terms: "/terms",
    privacy: "/privacy",
    support: "mailto:support@archledger.com",
  },
};
