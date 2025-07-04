// Global storage for media sessions (in production, use Redis or database)
export interface MediaSessionTemp {
  id: string;
  sessionCode: string;
  mediaUrls: string[];
  createdAt: Date;
  expiresAt: Date;
}

// Use a global variable to persist across requests
const globalForMediaSessions = globalThis as unknown as {
  mediaSessions: Map<string, MediaSessionTemp> | undefined;
};

export const mediaSessions = globalForMediaSessions.mediaSessions ?? new Map<string, MediaSessionTemp>();

if (process.env.NODE_ENV !== 'production') {
  globalForMediaSessions.mediaSessions = mediaSessions;
}

// Generate a unique session code
export function generateSessionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Clean up expired sessions
export function cleanupExpiredSessions() {
  const now = new Date();
  for (const [code, session] of mediaSessions) {
    if (now > session.expiresAt) {
      mediaSessions.delete(code);
    }
  }
}
