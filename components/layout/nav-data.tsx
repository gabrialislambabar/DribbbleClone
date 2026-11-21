import type { ComponentType } from "react";

import {
  BagIcon,
  BlogIcon,
  BookOpenIcon,
  BriefcaseIcon,
  BuildingIcon,
  HelpCircleIcon,
  InstagramIcon,
  PinterestIcon,
  PlusSquareIcon,
  SendIcon,
  SparkleIcon,
  TagIcon,
  ThreadsIcon,
  TikTokIcon,
  TrendUpIcon,
  TrophyIcon,
  UsersIcon,
  XIcon,
  YouTubeIcon,
} from "@/components/ui/icons";

type IconComponent = ComponentType<{ className?: string }>;

export type NavItem = {
  label: string;
  description?: string;
  href: string;
  icon?: IconComponent;
  badge?: string;
};

export type NavSection = {
  items: NavItem[];
  divider?: boolean;
};

export type NavGroup = {
  id: "explore" | "hire" | "hired" | "community";
  label: string;
  variant: "simple" | "mega" | "wide";
  align?: "left" | "right";
  sections: NavSection[];
  asideLinks?: { label: string; href: string }[];
  learnMore?: { label: string; href: string };
  socials?: boolean;
};

export const COMMUNITY_SOCIALS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/your-page",
    icon: InstagramIcon,
  },
  { label: "X", href: "https://x.com/your-page", icon: XIcon },
  {
    label: "Pinterest",
    href: "https://www.pinterest.com/your-page",
    icon: PinterestIcon,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@your-page",
    icon: YouTubeIcon,
  },
  { label: "TikTok", href: "https://www.tiktok.com/@your-page", icon: TikTokIcon },
  {
    label: "Threads",
    href: "https://www.threads.net/@your-page",
    icon: ThreadsIcon,
  },
];

export const NAV_MENUS: NavGroup[] = [
  {
    id: "explore",
    label: "Explore",
    variant: "simple",
    align: "left",
    sections: [
      {
        items: [
          { label: "Popular", href: "/explore?sort=popular", icon: TrendUpIcon },
          {
            label: "New and Noteworthy",
            href: "/explore?sort=newest",
            icon: SparkleIcon,
          },
        ],
      },
      {
        divider: true,
        items: [
          { label: "Product Design", href: "/explore?category=product-design" },
          { label: "Web Design", href: "/explore?category=web-design" },
          { label: "Animation", href: "/explore?category=animation" },
          { label: "Branding", href: "/explore?category=branding" },
          { label: "Illustration", href: "/explore?category=illustration" },
          { label: "Mobile", href: "/explore?category=mobile" },
          { label: "Typography", href: "/explore?category=typography" },
          { label: "Print", href: "/explore?category=print" },
        ],
      },
    ],
  },
  {
    id: "hire",
    label: "Hire Talent",
    variant: "mega",
    sections: [
      {
        items: [
          {
            label: "Start Project Brief",
            description: "Get recommendations and proposals",
            href: "/contact?topic=project-brief",
            icon: BriefcaseIcon,
          },
          {
            label: "Browse Profiles",
            description: "Find and message talent directly",
            href: "/designers",
            icon: UsersIcon,
          },
          {
            label: "Explore Services",
            description: "Hire quickly with pre-packaged services",
            href: "/services",
            icon: TagIcon,
          },
          {
            label: "Managed Creative Services",
            description: "We run the work, you pick the designers",
            href: "/managed-creative-services",
            icon: BuildingIcon,
          },
        ],
      },
    ],
    asideLinks: [
      { label: "Browse Design Agencies", href: "/designers?agencies=1" },
      { label: "Post a Full-Time Job", href: "/contact?topic=job-post" },
    ],
    learnMore: {
      label: "Learn more about how hiring works",
      href: "/designers",
    },
  },
  {
    id: "hired",
    label: "Get Hired",
    variant: "mega",
    sections: [
      {
        items: [
          {
            label: "Browse Project Briefs",
            description: "Pitch clients ready to hire now",
            href: "/search?tab=shots",
            icon: BagIcon,
          },
          {
            label: "Send Outbound Proposal",
            description: "Send proposals to any client",
            href: "#",
            icon: SendIcon,
            badge: "NEW",
          },
          {
            label: "Add Service",
            description: "Let clients purchase your services",
            href: "#",
            icon: PlusSquareIcon,
          },
        ],
      },
    ],
    asideLinks: [
      { label: "Full-Time Jobs", href: "#" },
      { label: "Upgrade to Pro", href: "#" },
      { label: "Advertise with Us", href: "#" },
    ],
    learnMore: {
      label: "Learn more about getting hired",
      href: "#",
    },
  },
  {
    id: "community",
    label: "Community",
    variant: "wide",
    align: "right",
    sections: [
      {
        items: [
          {
            label: "Blog",
            description: "Design inspiration, stories, and tips",
            href: "#",
            icon: BlogIcon,
          },
          {
            label: "Playoffs",
            description: "Join creative challenges and show your skills",
            href: "#",
            icon: TrophyIcon,
          },
          {
            label: "Help Center",
            description: "Get quick answers and learn how to use the app",
            href: "#",
            icon: HelpCircleIcon,
          },
        ],
      },
    ],
    socials: true,
  },
];

export const LEARN_MORE_ICON = BookOpenIcon;
