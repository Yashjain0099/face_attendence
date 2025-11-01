// src/lib/api.ts
// For local development and same-machine usage, always try localhost first
export const API_URL = 'http://localhost:5000';

// Optional: if you want to support both local and remote APIs later
// export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function api(path: string) {
  // returns base + path, normalized
  const base = API_URL.replace(/\/+$/, '');
  const p = path.replace(/^\//, '');
  return `${base}/${p}`;
}