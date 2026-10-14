import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import AuthPageImage from "../../assets/images/AuthPageImage.webp";
import Logo from "../../assets/images/Logo.webp";

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

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className} width={20} height={20}>
      <path d="m9 6 6 6-6 6" />
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

/* ---------- Left panel dùng chung cho Login / Register ---------- */

type VisualPanelProps = {
  title: ReactNode;
  description: string;
};

export function VisualPanel({ title, description }: VisualPanelProps) {
  return (
    <section className="visual-panel">
      <img
        className="visual-background"
        src={AuthPageImage}
        alt=""
        aria-hidden="true"
      />

      <div className="visual-shade" aria-hidden="true" />

      <Link className="visual-brand" to="/" aria-label="UIT Connect">
        <img className="brand-logo" src={Logo} alt="UIT Connect" />
      </Link>

      <div className="hero-copy">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

    </section>
  );
}