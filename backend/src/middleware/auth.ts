import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';

export type UserRole = 'user' | 'admin';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ success: false, error: 'No token provided' });
    return;
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({ success: false, error: 'Invalid token' });
      return;
    }

    // Fetch role from profiles
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    req.user = {
      id: data.user.id,
      email: data.user.email!,
      role: (profile?.role as UserRole) || 'user',
    };

    next();
  } catch {
    res.status(401).json({ success: false, error: 'Authentication failed' });
  }
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }
  next();
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    try {
      const { data } = await supabaseAdmin.auth.getUser(token);
      if (data.user) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        req.user = {
          id: data.user.id,
          email: data.user.email!,
          role: (profile?.role as UserRole) || 'user',
        };
      }
    } catch {
      // Continue without auth
    }
  }

  next();
};
