import { NextRequest } from 'next/server';
import { verifyToken, TokenPayload } from '@/lib/utils/jwt';

export interface AuthenticatedRequest extends NextRequest {
  user?: TokenPayload;
}

/**
 * JWT token'ı header'dan al ve doğrula
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7);
}

/**
 * Request'ten user bilgisini al
 */
export function getUserFromRequest(request: NextRequest): TokenPayload | null {
  const token = getTokenFromRequest(request);
  
  if (!token) {
    return null;
  }
  
  return verifyToken(token);
}

/**
 * Auth middleware - Request'i authenticate et
 */
export function authenticateRequest(request: NextRequest): {
  authenticated: boolean;
  user?: TokenPayload;
  error?: string;
} {
  const user = getUserFromRequest(request);
  
  if (!user) {
    return {
      authenticated: false,
      error: 'Unauthorized - Token required',
    };
  }
  
  return {
    authenticated: true,
    user,
  };
}

/**
 * Admin yetkisi kontrolü
 */
export function requireAdmin(user: TokenPayload | null): boolean {
  if (!user) {
    return false;
  }
  
  return user.role === 'admin' || user.role === 'moderator';
}

