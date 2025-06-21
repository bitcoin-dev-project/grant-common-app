/**
 * Utility function to add base path prefix to URLs for images/static assets
 * This ensures static assets work correctly when the app is served through a proxy
 */
export function withAssetPrefix(path: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  // Don't add prefix if it's already included or if path is external
  if (path.startsWith('http') || path.startsWith(basePath)) {
    return path;
  }
  return `${basePath}${path}`;
} 