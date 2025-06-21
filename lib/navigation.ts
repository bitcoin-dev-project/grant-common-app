/**
 * Navigation utility that handles routing correctly when served through proxy
 */

// Check if we're being served through the main site proxy
export function isServedThroughProxy(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if current URL contains bitcoindevs.xyz and we're under /grants
  return window.location.hostname === 'bitcoindevs.xyz' && 
         window.location.pathname.startsWith('/grants');
}

// Get the correct navigation path
export function getNavigationPath(path: string): string {
  // If served through proxy, add /grants prefix
  // If standalone, use path as-is
  if (isServedThroughProxy()) {
    // Don't double-prefix if already has /grants
    if (path.startsWith('/grants')) return path;
    return `/grants${path}`;
  }
  
  return path;
}

// Custom navigation function
export function navigateTo(path: string) {
  const correctPath = getNavigationPath(path);
  window.location.href = correctPath;
} 