/**
 * Utility to generate robust avatar URLs with graceful fallback.
 * Prioritizes:
 * 1. Custom uploaded avatarUrl from Firestore
 * 2. Firebase Auth photoURL (e.g. from Google sign-in)
 * 3. Seeded UI-Avatar SVG with AliBank gold theme
 */
export function getAvatarUrl(
  avatarUrl?: string | null,
  photoURL?: string | null,
  name?: string | null,
  email?: string | null
): string {
  if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim() !== '') {
    return avatarUrl;
  }
  if (photoURL && typeof photoURL === 'string' && photoURL.trim() !== '') {
    return photoURL;
  }
  
  const seed = (name && name.trim()) || (email && email.split('@')[0]) || 'AliBank';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(seed)}&background=F59E0B&color=000000&bold=true&size=256`;
}
