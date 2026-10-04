import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

// Upload file to Supabase Storage
export const uploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { bucket, fileName, fileBase64, contentType } = req.body;

  if (!bucket || !fileName || !fileBase64 || !contentType) {
    res.status(400).json({ success: false, error: 'bucket, fileName, fileBase64, and contentType are required' });
    return;
  }

  const allowedBuckets = ['movie-posters', 'movie-backdrops', 'avatars'];
  if (!allowedBuckets.includes(bucket)) {
    res.status(400).json({ success: false, error: `Invalid bucket. Allowed: ${allowedBuckets.join(', ')}` });
    return;
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(contentType)) {
    res.status(400).json({ success: false, error: 'Only image files are allowed (jpeg, png, webp, gif)' });
    return;
  }

  try {
    // Decode base64
    const buffer = Buffer.from(fileBase64, 'base64');

    // Max 5MB
    if (buffer.length > 5 * 1024 * 1024) {
      res.status(400).json({ success: false, error: 'File size must be under 5MB' });
      return;
    }

    const filePath = `${req.user!.id}/${Date.now()}-${fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      res.status(400).json({ success: false, error: uploadError.message });
      return;
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(filePath);

    res.json({ success: true, data: { url: publicUrl, path: filePath } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to upload file' });
  }
};

// Delete file from Supabase Storage
export const deleteFile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { bucket, path } = req.body;

  if (!bucket || !path) {
    res.status(400).json({ success: false, error: 'bucket and path are required' });
    return;
  }

  try {
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.json({ success: true, message: 'File deleted' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete file' });
  }
};
