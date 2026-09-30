import type { SVGProps } from 'react'

type IconName = 'plus' | 'chat' | 'doc' | 'arrow-up' | 'check' | 'list' | 'spark' | 'menu' | 'alert' | 'link'

const PATHS: Record<IconName, string> = {
  plus: 'M12 5v14M5 12h14',
  chat: 'M4 5h16v11H8l-4 4z',
  doc: 'M7 3h7l5 5v13H7zM14 3v5h5M9 13h6M9 17h6',
  'arrow-up': 'M12 19V5M5 12l7-7 7 7',
  check: 'M5 12l4 4L19 6',
  list: 'M9 6h11M9 12h11M9 18h11M4 6h1M4 12h1M4 18h1',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6',
  menu: 'M4 7h16M4 12h16M4 17h16',
  alert: 'M12 9v4M12 17h.01M10.3 3.9L2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
}

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
  size?: number
}

/** Inline stroke icon so the page needs no icon font. */
export function Icon({ name, size = 16, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
