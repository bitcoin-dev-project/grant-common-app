/**
 * Utility function to add base path prefix to URLs
 * This ensures assets and routes work correctly when the app is served under a subpath
 */
export function withBasePath(path: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  // Don't add basePath if it's already included or if path is external
  if (path.startsWith('http') || path.startsWith(basePath)) {
    return path;
  }
  return `${basePath}${path}`;
} 