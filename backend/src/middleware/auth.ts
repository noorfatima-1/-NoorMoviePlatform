import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
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

    req.user = {
      id: data.user.id,
      email: data.user.email!,
    };

    next();
  } catch {
    res.status(401).json({ success: false, error: 'Authentication failed' });
  }
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
        req.user = {
          id: data.user.id,
          email: data.user.email!,
        };
      }
    } catch {
      // Continue without auth
    }
  }

  next();
};
