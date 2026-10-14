import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/* ---------- Icons (SVG) ---------- */

type IconProps = { className?: string };

const svgProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function MailIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </svg>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

export function EyeIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A10.5 10.5 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4" />
      <path d="M6.6 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7a9.8 9.8 0 0 0 4.4-1" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

export function LogInIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M10 8l-4 4 4 4" />
      <path d="M6 12h10" />
    </svg>
  );
}

type VisualPanelProps = {
  backgroundImage: string;
  description: string;
  title: ReactNode;
  titleId: string;
  variant: "login" | "register";
};

export function VisualPanel({
  backgroundImage,
  description,
  title,
  titleId,
  variant,
}: VisualPanelProps) {
  const isLogin = variant === "login";

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "relative isolate min-h-[clamp(23rem,54svh,30rem)] overflow-hidden md:min-h-svh",
        isLogin ? "text-on-brand" : "text-heading",
      )}
    >
      <img
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-20 size-full object-cover object-[center_52%] md:object-[center_58%]"
        fetchPriority="high"
        src={backgroundImage}
      />

      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 -z-10 bg-linear-to-b",
          isLogin
            ? "from-brand-panel/10 via-brand-panel/20 to-heading/50"
            : "from-white/5 via-transparent to-white/10 max-md:from-white/15 max-md:to-white/35",
        )}
      />

      <div className="absolute inset-x-6 bottom-13 md:inset-x-auto md:top-[clamp(9.5rem,21vh,13rem)] md:bottom-auto md:left-10 md:w-[calc(100%-5rem)] lg:left-[clamp(2rem,6vw,6rem)] lg:w-[min(30rem,calc(100%-clamp(4rem,12vw,12rem)))]">
        <h1
          className="m-0 max-w-[29rem] text-[clamp(2.15rem,9vw,3.25rem)] leading-[1.08] font-extrabold tracking-[-0.045em] [text-wrap:balance] md:text-[clamp(2.25rem,4.5vw,3.4rem)] lg:text-[clamp(2.5rem,4vw,4.5rem)]"
          id={titleId}
        >
          {title}
        </h1>
        <p
          className={cn(
            "mt-3.5 max-w-[29rem] text-[0.95rem] leading-[1.55] md:mt-[1.4rem] lg:text-[clamp(0.95rem,1.15vw,1.12rem)] lg:leading-[1.65]",
            isLogin ? "text-white/90" : "text-foreground-secondary",
          )}
        >
          {description}
        </p>
      </div>
    </section>
  );
}
