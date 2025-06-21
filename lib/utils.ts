/**
 * Utility function to add asset prefix to URLs for images/static assets
 * This ensures static assets work correctly when the app is served through a proxy
 */
export function withAssetPrefix(path: string): string {
  const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX || '';
  // Don't add prefix if it's already included or if path is external
  if (path.startsWith('http') || path.startsWith(assetPrefix)) {
    return path;
  }
  return `${assetPrefix}${path}`;
} 