import Link from 'next/link'
import { getNavigationPath } from '../lib/navigation'

interface SmartLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  [key: string]: any
}

/**
 * Smart Link component that automatically handles navigation
 * Works correctly both standalone and when served through proxy
 */
export default function SmartLink({ href, children, ...props }: SmartLinkProps) {
  // For external links, use as-is
  if (href.startsWith('http') || href.startsWith('mailto:')) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }
  
  // For internal navigation, use the smart path
  const smartHref = getNavigationPath(href);
  
  return (
    <Link href={smartHref} {...props}>
      {children}
    </Link>
  );
} 