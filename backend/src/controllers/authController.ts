import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

export const signup = async (req: Request, res: Response): Promise<void> => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    res.status(400).json({ success: false, error: 'Email, password, and username are required' });
    return;
  }

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    });

    if (authError) {
      res.status(400).json({ success: false, error: authError.message });
      return;
    }

    // Create profile in profiles table
    await supabaseAdmin.from('profiles').insert({
      id: authData.user.id,
      email,
      username,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
    });

    // Sign in to get session token
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      res.status(400).json({ success: false, error: signInError.message });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email,
          username,
        },
        session: signInData.session,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to create account' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password are required' });
    return;
  }

  try {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    res.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          username: profile?.username,
          avatar_url: profile?.avatar_url,
        },
        session: data.session,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Login failed' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user!.id)
      .single();

    if (error) {
      res.status(404).json({ success: false, error: 'Profile not found' });
      return;
    }

    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { username, avatar_url } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ username, avatar_url, updated_at: new Date().toISOString() })
      .eq('id', req.user!.id)
      .select()
      .single();

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
};
