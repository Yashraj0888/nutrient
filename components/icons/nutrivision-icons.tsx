/** Custom inline SVG icons — no third-party icon packs. */

type IconProps = { className?: string; size?: number };

function Svg({ className, size = 24, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function IconHome({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path
        d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9V20.5H5.5A1.5 1.5 0 0 1 4 19v-8.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconProgress({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <rect x="4" y="5" width="16" height="15" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3.5v3M16 3.5v3M4 10h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="8" y="13" width="3" height="3" rx="0.8" fill="currentColor" />
    </Svg>
  );
}

export function IconScan({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path
        d="M7 4H5a1 1 0 0 0-1 1v2M17 4h2a1 1 0 0 1 1 1v2M7 20H5a1 1 0 0 1-1-1v-2M17 20h2a1 1 0 0 0 1-1v-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect x="8.5" y="8.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </Svg>
  );
}

export function IconForum({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 12h16M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16" stroke="currentColor" strokeWidth="1.5" />
    </Svg>
  );
}

export function IconAccount({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <circle cx="12" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5.5 19.5c.8-3 3.2-4.5 6.5-4.5s5.7 1.5 6.5 4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function IconMenu({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M5 7h12M5 12h9M5 17h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function IconFlame({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path
        d="M12 21c4-2.5 6-5.5 6-9a6 6 0 0 0-10.5-4 5 5 0 0 0-1.5 6.5C8.5 17 10 19 12 21Z"
        fill="currentColor"
        opacity="0.9"
      />
    </Svg>
  );
}

export function IconForkKnife({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M8 3v8.5a2 2 0 1 1-4 0V3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6 3v18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16 3v7h2v10h-4V10h2V3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconCarbs({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <ellipse cx="12" cy="14" rx="7" ry="4" fill="currentColor" opacity="0.25" />
      <path
        d="M5 14c0-3.5 3.1-6 7-6s7 2.5 7 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M9 10.5V8M15 10.5V8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

export function IconFats({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <rect x="6" y="8" width="12" height="10" rx="2" fill="currentColor" opacity="0.3" />
      <path d="M8 8V6.5A4 4 0 0 1 16 6.5V8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 13h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

export function IconProtein({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path
        d="M8 6c0 2.5 1.5 4 4 4s4-1.5 4-4-1.5-4-4-4-4 1.5-4 4Z"
        fill="currentColor"
        opacity="0.3"
      />
      <path
        d="M8 6c0 2.5 1.5 4 4 4s4-1.5 4-4-1.5-4-4-4-4 1.5-4 4Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M12 10v11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function IconChevronLeft({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M14 6 8 12l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconChevronRight({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M10 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconCalendar({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <rect x="4" y="5" width="16" height="15" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3.5v3M16 3.5v3M4 10h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function IconPlus({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function IconClose({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function IconBack({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M14 6 8 12l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconCamera({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <rect x="3" y="7" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="13.5" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 7V5.5h6V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function IconRefresh({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path
        d="M20 12a8 8 0 1 1-2.3-5.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M20 4v5h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconFlash({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path
        d="M13 2 4 14h7l-1 8 10-14H13V2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconGallery({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="8.5" cy="10" r="1.5" fill="currentColor" />
      <path d="m3 16 5-4.5 4 3.5 3-2.5 6 5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconCheck({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M5 12.5 9.5 17 19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconTrash({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M4 7h16M9 7V5h6v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 7v12h10V7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconMinus({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function IconUser({ className, size }: IconProps) {
  return IconAccount({ className, size });
}

export function IconLogout({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14 16l4-4-4-4M18 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconEdit({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M4 20h4l10-10-4-4L4 16v4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconSparkle({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="m7 7 2 2M15 15l2 2M17 7l-2 2M9 15l-2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

export function IconUpload({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 15V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m8 9 4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 19h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}
