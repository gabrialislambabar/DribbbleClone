export type DesignerType = "freelancer" | "agency";

export type DesignerCategorySlug =
  | "logo-branding"
  | "web-design"
  | "illustration"
  | "product-design"
  | "mobile"
  | "animation"
  | "typography"
  | "print";

export type DesignerService = {
  id: string;
  category: DesignerCategorySlug;
  name: string;
  scope: string;
  deliveryDays: number;
  startingPrice: number;
  description: string;
};

export type DesignerReview = {
  id: string;
  author: string;
  project: string;
  rating: number;
  body: string;
  date: string;
};

export type DesignerShot = {
  id: string;
  title: string;
  category: string;
  likes: number;
  publishedAt: string;
  /** Key of a CSS gradient fallback used by demo profiles. */
  artwork: "aurora" | "orbit" | "ribbon" | "grid";
  /** Optional project-owned image bundled under /public. */
  image?: string | null;
};

export type Designer = {
  id: string;
  slug: string;
  name: string;
  type: DesignerType;
  avatar: { initials: string; tint: string };
  tagline: string;
  bio: string;
  categories: DesignerCategorySlug[];
  skills: string[];
  location: string;
  startingBudget: number;
  rating: number;
  reviewCount: number;
  completedProjects: number;
  followers: number;
  following: number;
  likes: number;
  availableForWork: boolean;
  respondsQuickly: boolean;
  responseTime: string;
  isPro: boolean;
  website: string | null;
  services: DesignerService[];
  reviews: DesignerReview[];
  shots: DesignerShot[];
};

export type DesignerFilters = {
  category: DesignerCategorySlug | "all";
  budget: BudgetRangeKey;
  location: string;
  rating: number;
  availableOnly: boolean;
  proOnly: boolean;
  fastOnly: boolean;
  agenciesOnly: boolean;
  quickHire: boolean;
  sort: "recommended" | "rating" | "budget" | "projects";
};

export type BudgetRangeKey = "any" | "under-1k" | "1k-3k" | "3k-5k" | "5k-plus";

export const DESIGNER_CATEGORIES: {
  slug: DesignerCategorySlug;
  label: string;
}[] = [
  { slug: "logo-branding", label: "Logo & Branding" },
  { slug: "web-design", label: "Web Design" },
  { slug: "illustration", label: "Illustration" },
  { slug: "product-design", label: "Product Design" },
  { slug: "mobile", label: "Mobile" },
  { slug: "animation", label: "Animation" },
  { slug: "typography", label: "Typography" },
  { slug: "print", label: "Print" },
];

export const BUDGET_RANGES: {
  value: BudgetRangeKey;
  label: string;
  min: number;
  max: number | null;
}[] = [
  { value: "any", label: "Any budget", min: 0, max: null },
  { value: "under-1k", label: "Under $1,000", min: 0, max: 1000 },
  { value: "1k-3k", label: "$1,000 – $3,000", min: 1000, max: 3000 },
  { value: "3k-5k", label: "$3,000 – $5,000", min: 3000, max: 5000 },
  { value: "5k-plus", label: "$5,000+", min: 5000, max: null },
];

export const RATING_OPTIONS = [
  { value: 0, label: "Any rating" },
  { value: 4, label: "4.0+ stars" },
  { value: 4.5, label: "4.5+ stars" },
  { value: 4.8, label: "4.8+ stars" },
];

export const DESIGNER_SORTS: {
  value: DesignerFilters["sort"];
  label: string;
}[] = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Top rated" },
  { value: "projects", label: "Most projects" },
  { value: "budget", label: "Lowest budget" },
];

export const POPULAR_DESIGNER_SEARCHES = [
  "logo design",
  "landing page",
  "mobile app",
  "web design",
  "development",
  "branding",
  "social media",
  "ecommerce",
];

export const DEFAULT_DESIGNER_FILTERS: DesignerFilters = {
  category: "all",
  budget: "any",
  location: "",
  rating: 0,
  availableOnly: false,
  proOnly: false,
  fastOnly: false,
  agenciesOnly: false,
  quickHire: false,
  sort: "recommended",
};
