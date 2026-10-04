import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  const { unread } = req.query;

  try {
    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (unread === 'true') {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user!.id)
      .eq('is_read', false);

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.json({ success: true, data: { count: count || 0 } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch unread count' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', req.user!.id);

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.json({ success: true, message: 'Notification marked as read' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to mark notification' });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user!.id)
      .eq('is_read', false);

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to mark notifications' });
  }
};

// Helper: Create a notification (used internally)
export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string
): Promise<void> => {
  await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    link,
  });
};
