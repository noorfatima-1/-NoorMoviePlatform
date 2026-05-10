import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const createWatchParty = async (req: AuthRequest, res: Response): Promise<void> => {
  const { movie_id } = req.body;

  try {
    const roomCode = generateRoomCode();

    const { data, error } = await supabaseAdmin
      .from('watch_parties')
      .insert({
        host_id: req.user!.id,
        movie_id,
        room_code: roomCode,
        is_active: true,
        playback_time: 0,
        is_playing: false,
      })
      .select()
      .single();

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    // Add host as member
    await supabaseAdmin.from('watch_party_members').insert({
      party_id: data.id,
      user_id: req.user!.id,
    });

    res.status(201).json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to create watch party' });
  }
};

export const joinWatchParty = async (req: AuthRequest, res: Response): Promise<void> => {
  const { room_code } = req.body;

  try {
    const { data: party, error: partyError } = await supabaseAdmin
      .from('watch_parties')
      .select('*, movies(*)')
      .eq('room_code', room_code)
      .eq('is_active', true)
      .single();

    if (partyError || !party) {
      res.status(404).json({ success: false, error: 'Watch party not found or inactive' });
      return;
    }

    // Add member
    await supabaseAdmin.from('watch_party_members').upsert({
      party_id: party.id,
      user_id: req.user!.id,
    });

    // Get all members
    const { data: members } = await supabaseAdmin
      .from('watch_party_members')
      .select('*, profiles(username, avatar_url)')
      .eq('party_id', party.id);

    res.json({ success: true, data: { ...party, members } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to join watch party' });
  }
};

export const updatePartyState = async (req: AuthRequest, res: Response): Promise<void> => {
  const { partyId } = req.params;
  const { playback_time, is_playing } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from('watch_parties')
      .update({ playback_time, is_playing })
      .eq('id', partyId)
      .eq('host_id', req.user!.id)
      .select()
      .single();

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update party state' });
  }
};

export const endWatchParty = async (req: AuthRequest, res: Response): Promise<void> => {
  const { partyId } = req.params;

  try {
    const { error } = await supabaseAdmin
      .from('watch_parties')
      .update({ is_active: false })
      .eq('id', partyId)
      .eq('host_id', req.user!.id);

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.json({ success: true, message: 'Watch party ended' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to end watch party' });
  }
};

export const getActiveParties = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('watch_parties')
      .select('*, movies(title, poster_url), profiles(username)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch active parties' });
  }
};
