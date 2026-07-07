/**
 * Nenos Food — motion tokens, CSS helpers & Framer Motion variants
 * Pareado com `src/styles/nenos-animations.css`
 */

import type { Variants, Transition } from "framer-motion";
import { cn } from "@/lib/utils";

export const nenosEase = [0.16, 1, 0.3, 1] as const;

export const springSoft: Transition = {
  type: "spring",
  stiffness: 360,
  damping: 28,
  mass: 0.8,
};

export const springBouncy: Transition = {
  type: "spring",
  stiffness: 460,
  damping: 16,
  mass: 0.7,
};

export const fadeInMotion: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.26, ease: nenosEase },
  },
};

export const slideUpMotion: Variants = {
  initial: { opacity: 0, y: 28 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.36, ease: nenosEase },
  },
};

/** Orquestra entrada da homepage: busca → banner → categorias → listas */
export const homepageOrchestrator: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.12, delayChildren: 0.06 },
  },
};

export const homepageSection: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.34, ease: nenosEase },
  },
};

export const productHighlightMotion = {
  idle: {
    scale: 1,
    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  },
  added: {
    scale: [1, 1.015, 1],
    boxShadow: [
      "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      "0 8px 24px -4px rgb(249 115 22 / 0.28)",
      "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    ],
    transition: { duration: 0.42, ease: "easeOut" as const },
  },
} satisfies Variants;

export const likeCountMotion: Variants = {
  initial: { opacity: 0, y: 6, scale: 0.85 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: nenosEase },
  },
};

export const dashboardChartMotion: Variants = {
  initial: { opacity: 0, y: 24, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.42, ease: nenosEase, delay: 0.52 },
  },
};

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 18 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: nenosEase },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.22, ease: "easeIn" },
  },
};

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.05, delayChildren: 0.04 },
  },
};

export const cardItem: Variants = {
  initial: { opacity: 0, y: 18, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.34, ease: nenosEase },
  },
};

export const mobileCardItem: Variants = {
  initial: { opacity: 0, y: 16, scale: 0.985 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: nenosEase },
  },
};

export const desktopCardItem: Variants = {
  initial: { opacity: 0, y: 22, scale: 0.975 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.36, ease: nenosEase },
  },
};

export const promoBannerMotion: Variants = {
  initial: { opacity: 0, scale: 1.03, x: 18 },
  animate: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: { duration: 0.52, ease: nenosEase },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    x: -18,
    transition: { duration: 0.28, ease: "easeInOut" },
  },
};

export const bottomNavMotion: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: nenosEase, delay: 0.38 },
  },
};

export const bottomBarMotion: Variants = {
  hidden: { opacity: 0, y: 96, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: springSoft },
  exit: {
    opacity: 0,
    y: 96,
    scale: 0.98,
    transition: { duration: 0.22, ease: "easeIn" },
  },
};

export const cartFabMotion = {
  idle: { scale: 1, y: 0 },
  bounce: {
    scale: [1, 1.12, 0.96, 1],
    y: [0, -10, 3, 0],
    transition: { duration: 0.46, ease: "easeOut" as const },
  },
} satisfies Variants;

export const addButtonMotion = {
  idle: { scale: 1 },
  tap: { scale: 0.9 },
  added: {
    scale: [1, 1.16, 1],
    transition: { duration: 0.26, ease: "easeOut" as const },
  },
} satisfies Variants;

export const likeMotion = {
  idle: { scale: 1, rotate: 0 },
  liked: {
    scale: [1, 1.35, 0.94, 1],
    rotate: [0, -8, 5, 0],
    transition: { duration: 0.38, ease: "easeOut" as const },
  },
} satisfies Variants;

export const saveMotion = {
  idle: { scale: 1 },
  saved: {
    scale: [1, 1.18, 1],
    y: [0, -3, 0],
    transition: { duration: 0.26, ease: "easeOut" as const },
  },
} satisfies Variants;

export const feedPostMotion: Variants = {
  initial: { opacity: 0, y: 24, scale: 0.985 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.38, ease: nenosEase },
  },
};

export const storyMotion: Variants = {
  initial: { opacity: 0, scale: 0.86, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: springSoft },
};

export const tabIndicatorMotion: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
};

export const timelineLineMotion: Variants = {
  inactive: { scaleX: 0, opacity: 0.4 },
  active: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.9, ease: nenosEase },
  },
};

export const timelineStepMotion: Variants = {
  inactive: { scale: 0.92, opacity: 0.5 },
  active: { scale: 1, opacity: 1, transition: springBouncy },
  completed: { scale: 1, opacity: 1 },
};

export const desktopSidebarItemMotion: Variants = {
  initial: { opacity: 0, x: -10 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.24, ease: nenosEase },
  },
};

export const dashboardKpiMotion: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.36, ease: nenosEase },
  },
};

export const tableRowMotion: Variants = {
  initial: { opacity: 0, x: -8 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.24, ease: "easeOut" },
  },
};

export const sheetMotion: Variants = {
  initial: { y: "100%" },
  animate: { y: 0, transition: springSoft },
  exit: { y: "100%", transition: { duration: 0.24, ease: "easeInOut" } },
};

export const modalMotion: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0, transition: springSoft },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 12,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

export const hoverLift = {
  y: -4,
  transition: { duration: 0.18, ease: "easeOut" as const },
};

export const tapScale = { scale: 0.96 };

export const mascotFloat = {
  y: [0, -6, 0],
  transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" as const },
};

export const motionTokens = {
  duration: {
    fade: 260,
    scale: 240,
    addPulse: 260,
    savePop: 260,
    sidebar: 220,
    bottomBar: 300,
    card: 340,
    slide: 360,
    heart: 360,
    cart: 460,
    promo: 520,
    shimmer: 1200,
    storyRing: 2800,
    softFloat: 2600,
    timeline: 900,
  },
  easing: {
    out: "cubic-bezier(0.16, 1, 0.3, 1)",
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    easeOut: "ease-out",
    linear: "linear",
    framer: nenosEase,
  },
  stagger: 50,
} as const;

export const motionClass = {
  cardEnter: "animate-nenos-card-enter",
  fadeIn: "animate-nenos-fade-in",
  slideUp: "animate-nenos-slide-up",
  scaleIn: "animate-nenos-scale-in",
  addPulse: "animate-nenos-add-pulse",
  cartBounce: "animate-nenos-cart-bounce",
  heartPop: "animate-nenos-heart-pop",
  savePop: "animate-nenos-save-pop",
  bottomBarEnter: "animate-nenos-bottom-bar-enter",
  timelineFill: "animate-nenos-timeline-fill",
  shimmer: "animate-nenos-shimmer",
  storyRing: "animate-nenos-story-ring",
  softFloat: "animate-nenos-soft-float",
  promoSlide: "animate-nenos-promo-slide",
  sidebarActive: "animate-nenos-sidebar-active",
  routeDash: "animate-nenos-route-dash",
  hoverLift: "hover-nenos-lift",
  hoverSoft: "hover-nenos-soft",
  staggerContainer: "stagger-children",
} as const;

export type MotionEntrance = "fade-in" | "slide-up" | "scale-in" | "card-enter";

const entranceMap: Record<MotionEntrance, string> = {
  "fade-in": motionClass.fadeIn,
  "slide-up": motionClass.slideUp,
  "scale-in": motionClass.scaleIn,
  "card-enter": motionClass.cardEnter,
};

export function motionEntrance(type: MotionEntrance = "fade-in"): string {
  return entranceMap[type];
}

export function motionStaggerContainer(): string {
  return motionClass.staggerContainer;
}

export function motionStaggerDelay(index: number): number {
  return Math.max(0, index) * motionTokens.stagger;
}

export function motionWithStagger(
  type: MotionEntrance = "card-enter",
  index = 0,
  extra?: string
): { className: string; style: { animationDelay: string } } {
  return {
    className: cn(entranceMap[type], extra),
    style: { animationDelay: `${motionStaggerDelay(index)}ms` },
  };
}

export function withMotion(
  motionKey: string | string[],
  ...rest: (string | false | null | undefined)[]
): string {
  const base = Array.isArray(motionKey) ? motionKey : [motionKey];
  return cn(...base, ...rest);
}

export function triggerMotionPulse(
  setActive: (v: boolean) => void,
  durationMs = motionTokens.duration.addPulse
): void {
  setActive(true);
  window.setTimeout(() => setActive(false), durationMs);
}

/** Classes padrão de componentes Nenos */
export const nenosClass = {
  card: "rounded-3xl border border-orange-100 bg-white shadow-sm transition-all duration-200 hover-nenos-lift",
  buttonPrimary:
    "rounded-full bg-gradient-to-r from-[#F97316] to-[#FBBF24] px-5 py-3 font-bold text-white shadow-orange active:scale-95 transition-transform",
  buttonSecondary:
    "rounded-full border border-orange-200 bg-white px-5 py-3 font-semibold text-[#EA580C] hover:bg-orange-50 transition-colors",
  skeleton: "animate-nenos-shimmer rounded-2xl bg-orange-50",
  routeDash: "animate-nenos-route-dash",
} as const;

/** Variants simplificados quando prefers-reduced-motion */
export const reducedFadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.01 } },
  exit: { opacity: 0, transition: { duration: 0.01 } },
};

export function pickMotion<T extends Variants>(full: T, reduced: boolean): T | typeof reducedFadeVariants {
  return reduced ? reducedFadeVariants : full;
}
