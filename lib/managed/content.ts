import type { ReactNode } from "react";

export const MANAGED_ROUTE = "/managed-creative-services";

export const MANAGED_SECTION_LINKS = [
  { href: "#why-managed", label: "Why Studio" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#what-we-design", label: "What we design" },
  { href: "#faq", label: "FAQ" },
];

export const MANAGED_METRICS = [
  {
    value: "100K+",
    label: "designers and design teams to pick from",
  },
  {
    value: "20–30",
    label: "vetted designers on your roster",
  },
  {
    value: "3 days",
    label: "to your shortlist of 7–8",
  },
  {
    value: "2 weeks",
    label: "from signing to first brief",
  },
];

export const MANAGED_BENEFITS = [
  {
    title: "Reach beyond any agency’s network",
    description:
      "The right designer or design team from the wider community, not the roster one agency happens to have.",
    icon: "network",
  },
  {
    title: "You stay in control",
    description:
      "A shortlist of 7–8 for every brief. You pick who does the work, and you can ask for replacements until the shortlist is right.",
    icon: "control",
  },
  {
    title: "Marketplace reach without the admin",
    description:
      "One account manager handles the coordination: briefs, agreements, payouts and purchase orders.",
    icon: "admin",
  },
  {
    title: "Built for long collaborations",
    description:
      "Work starts from your brand guidelines, and the designers who know your brand stay on your work where they cover the need.",
    icon: "collaboration",
  },
  {
    title: "One bench for the whole scope",
    description:
      "Banners, HTML5, video, motion and social from one roster, so your core team adds capacity without adding vendors.",
    icon: "bench",
  },
  {
    title: "Ready for enterprise",
    description:
      "NDA and no-AI terms agreed before any brief, an AI-detection check on every concept, and one framework agreement.",
    icon: "enterprise",
  },
];

export const MANAGED_STEPS = [
  {
    step: "Step 1",
    title: "Start with a pilot",
    description:
      "In about two weeks we build a roster matched to your brand guidelines, and agree the milestones for a pilot phase. You approve the roster once.",
    visual: "roster" as const,
  },
  {
    step: "Step 2",
    title: "Pick a designer or design team",
    description:
      "Send a brief and get a shortlist of 7–8 within 3 business days. Not the right fit? Ask for replacements until the shortlist is right.",
    visual: "shortlist" as const,
  },
  {
    step: "Step 3",
    title: "Ship on schedule",
    description:
      "Concept, draft, and final, with a quality check on every file. You get final assets plus editable source files.",
    visual: "tracker" as const,
  },
  {
    step: "Step 4",
    title: "Scale across the calendar",
    description:
      "Run several campaigns a month from the same roster. The designers who know your brand stay on your work where they cover the need.",
    visual: "calendar" as const,
  },
];

export const MANAGED_SERVICES = [
  {
    title: "Promotional campaigns",
    description:
      "Key visuals and full campaign packs for launches, seasonal sales, and special events.",
  },
  {
    title: "Ecommerce assets",
    description:
      "Product pages, PDP graphics, email modules, and storefront banners built to a shared grid.",
  },
  {
    title: "Social and paid ads",
    description:
      "Feed, story, and paid placements cut in the sizes each channel needs, with copy-safe layouts.",
  },
  {
    title: "Motion and video",
    description:
      "Short-form motion, animated banners, and simple video edits handed off with source files.",
  },
  {
    title: "Illustration",
    description:
      "Custom spot and editorial illustration in a consistent style across a campaign.",
  },
  {
    title: "Adaptation and localization",
    description:
      "Resize and re-flow the same campaign for new markets, languages, and placements.",
  },
];

export const MANAGED_COMPARISON_ROWS = [
  {
    label: "Who designs your work",
    studio: "Designers you pick by name, from the community roster",
    inHouse: "The people you hire",
    agency: "Assigned by the agency",
    freelance: "Whoever you find and vet",
  },
  {
    label: "Time to start",
    studio: "Shortlist in 3 business days",
    inHouse: "Months of hiring",
    agency: "Weeks of onboarding",
    freelance: "Fast, but you vet alone",
  },
  {
    label: "Who manages the work",
    studio: "One account manager, admin included",
    inHouse: "Your team",
    agency: "The account team",
    freelance: "You",
  },
  {
    label: "Scaling up",
    studio: "More formats, same roster, no new vendors",
    inHouse: "New headcount",
    agency: "Scope change",
    freelance: "Find more people",
  },
  {
    label: "If someone drops out",
    studio: "Named backup, no extra cost",
    inHouse: "You rehire",
    agency: "The agency reassigns",
    freelance: "You start over",
  },
  {
    label: "How you pay",
    studio: "Fixed price per campaign plus program fee",
    inHouse: "Salaries and overhead",
    agency: "Retainers and fees",
    freelance: "Hourly or per project",
  },
];

export const MANAGED_COMPARISON_OPTIONS = [
  { id: "studio", label: "Dribbble Studio" },
  { id: "inHouse", label: "In-house team" },
  { id: "agency", label: "Creative agency" },
  { id: "freelance", label: "Freelancers" },
];

export const MANAGED_FAQS: { question: string; answer: ReactNode }[] = [
  {
    question: "What is creative as a service?",
    answer:
      "Creative as a service is a way to get ongoing design work from a provider that supplies and manages the creative talent, instead of hiring in-house or briefing an agency project by project.",
  },
  {
    question:
      "How is Dribbble Studio different from other creative-as-a-service companies?",
    answer:
      "In this clone, the pitch is that you see real portfolios and pick your designer or design team by name for every campaign, rather than accepting whoever a pool assigns. The reference product also names a backup designer from day one.",
  },
  {
    question: "How do you choose and vet the designers?",
    answer:
      "The reference product says designers are matched to your brand guidelines, the work, and your calendar, then checked for portfolio quality, availability, and fit. This clone does not run a vetting process; treat this page as illustrative copy.",
  },
  {
    question: "How fast can we start?",
    answer:
      "The reference timeline is about two weeks of setup, then a pilot with agreed milestones, and a shortlist of 7–8 designers within 3 business days of each confirmed brief.",
  },
  {
    question: "How does pricing work?",
    answer:
      "A one-time setup fee, a program fee, and a fixed price per campaign agreed before work starts — no hourly billing. This clone quotes nothing and sells nothing.",
  },
  {
    question: "What happens if a designer misses a deadline or is not the right fit?",
    answer:
      "The reference product names a backup designer from day one, and the backup takes over if quality or a deadline slips. It also offers replacements until the shortlist is right.",
  },
  {
    question: "Do your designers use AI?",
    answer:
      "The reference product says designers agree no-AI terms before seeing a brief, and every concept goes through an AI-detection check. This clone makes no such guarantee.",
  },
  {
    question: "Is there a minimum commitment?",
    answer:
      "Programs start with a three-month pilot with agreed milestones under one framework agreement, per the reference page.",
  },
  {
    question: "Who handles contracts, payouts and purchase orders?",
    answer:
      "In the reference product, one account manager covers vetting, designer agreements, payouts, and purchase orders, so procurement deals with a single vendor. Nothing on this clone is a real contract.",
  },
];

export const MANAGED_FOOTNOTES = [
  "No hourly billing",
  "Backup designer on every campaign",
  "NDA before any brief",
];

export const MANAGED_PROJECT_OPTIONS = [
  "Brand or campaign refresh",
  "Seasonal sale campaign",
  "Launch campaign",
  "Ecommerce assets",
  "Motion and video",
  "Something else",
];
