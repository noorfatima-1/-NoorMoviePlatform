-- CineVerse Database Schema
-- Run this in your Supabase SQL Editor

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Movies table
CREATE TABLE IF NOT EXISTS movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  poster_url TEXT NOT NULL,
  backdrop_url TEXT NOT NULL,
  trailer_url TEXT,
  video_url TEXT,
  release_date DATE NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  rating DECIMAL(3,1) DEFAULT 0,
  genre TEXT[] NOT NULL DEFAULT '{}',
  director TEXT NOT NULL,
  cast_members TEXT[] DEFAULT '{}',
  language TEXT DEFAULT 'English',
  maturity_rating TEXT DEFAULT 'PG-13',
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watchlist
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

-- Watch History
CREATE TABLE IF NOT EXISTS watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0, -- seconds
  duration INTEGER DEFAULT 0, -- total seconds
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

-- Watch Parties (Realtime)
CREATE TABLE IF NOT EXISTS watch_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  room_code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  playback_time DECIMAL DEFAULT 0,
  is_playing BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watch Party Members
CREATE TABLE IF NOT EXISTS watch_party_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES watch_parties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(party_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_movies_genre ON movies USING GIN(genre);
CREATE INDEX IF NOT EXISTS idx_movies_rating ON movies(rating DESC);
CREATE INDEX IF NOT EXISTS idx_movies_featured ON movies(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_movie ON reviews(movie_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_user ON watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_parties_room ON watch_parties(room_code);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_party_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: users can read all, update own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Movies: everyone can read
CREATE POLICY "Movies are viewable by everyone" ON movies FOR SELECT USING (true);

-- Watchlist: users manage their own
CREATE POLICY "Users can view own watchlist" ON watchlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to own watchlist" ON watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove from own watchlist" ON watchlist FOR DELETE USING (auth.uid() = user_id);

-- Reviews: everyone can read, users manage their own
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can add own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);

-- Watch History: users manage their own
CREATE POLICY "Users can view own history" ON watch_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own history" ON watch_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can modify own history" ON watch_history FOR UPDATE USING (auth.uid() = user_id);

-- Watch Parties
CREATE POLICY "Active parties are viewable" ON watch_parties FOR SELECT USING (true);
CREATE POLICY "Users can create parties" ON watch_parties FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update parties" ON watch_parties FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Party members viewable" ON watch_party_members FOR SELECT USING (true);
CREATE POLICY "Users can join parties" ON watch_party_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave parties" ON watch_party_members FOR DELETE USING (auth.uid() = user_id);

-- Enable Realtime for watch parties
ALTER PUBLICATION supabase_realtime ADD TABLE watch_parties;

-- Seed some sample movies
INSERT INTO movies (title, description, poster_url, backdrop_url, trailer_url, release_date, duration, rating, genre, director, cast_members, language, maturity_rating, is_featured) VALUES
('The Dark Horizon', 'In a world where light is fading, one hero must journey beyond the known universe to reignite the stars.', 'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=400', 'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=1200', NULL, '2024-03-15', 148, 4.8, ARRAY['Sci-Fi', 'Action', 'Adventure'], 'James Chen', ARRAY['Alex Rivera', 'Sarah Kim', 'Marcus Johnson'], 'English', 'PG-13', TRUE),
('Whispers in the Rain', 'A mysterious letter leads a young woman back to the small town she fled years ago, uncovering secrets that change everything.', 'https://images.unsplash.com/photo-1428908728789-d2de25dbd4e2?w=400', 'https://images.unsplash.com/photo-1428908728789-d2de25dbd4e2?w=1200', NULL, '2024-01-20', 124, 4.5, ARRAY['Drama', 'Mystery', 'Thriller'], 'Emma Watson', ARRAY['Lily Chen', 'Robert Blake', 'Diana Morales'], 'English', 'R', TRUE),
('Neon Streets', 'A cyberpunk thriller set in 2089 Tokyo, where a hacker discovers a conspiracy that threatens all of humanity.', 'https://images.unsplash.com/photo-1515634928627-2a4e0dae3ddf?w=400', 'https://images.unsplash.com/photo-1515634928627-2a4e0dae3ddf?w=1200', NULL, '2024-06-10', 136, 4.7, ARRAY['Sci-Fi', 'Thriller', 'Action'], 'Takeshi Yamamoto', ARRAY['Kenji Tanaka', 'Mika Sato', 'John Adams'], 'English', 'R', TRUE),
('The Last Garden', 'After a global ecological disaster, a botanist and her team race to save the last seeds of humanity''s future.', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200', NULL, '2024-04-22', 118, 4.3, ARRAY['Drama', 'Sci-Fi'], 'Maria Rodriguez', ARRAY['Sophie Turner', 'David Park', 'Anna Lee'], 'English', 'PG-13', FALSE),
('Midnight Express', 'A high-speed train. Eight strangers. One murder. Everyone is a suspect.', 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400', 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=1200', NULL, '2024-02-14', 105, 4.6, ARRAY['Thriller', 'Mystery'], 'Christopher Park', ARRAY['Michael Chen', 'Eva Green', 'Tom Hardy'], 'English', 'PG-13', TRUE),
('Ocean''s Lullaby', 'A heartwarming tale of a retired sailor who finds purpose mentoring troubled youth through competitive sailing.', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200', NULL, '2024-05-30', 112, 4.2, ARRAY['Drama', 'Adventure'], 'Sarah Mitchell', ARRAY['Morgan Freeman', 'Zendaya', 'Timothee Chalamet'], 'English', 'PG', FALSE),
('Phantom Code', 'An AI researcher creates an algorithm that can predict crimes before they happen, but at what cost to free will?', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200', NULL, '2024-07-04', 141, 4.4, ARRAY['Sci-Fi', 'Thriller', 'Drama'], 'Denis Park', ARRAY['Oscar Isaac', 'Florence Pugh', 'Rami Malek'], 'English', 'R', FALSE),
('The Wedding Disaster', 'When everything that can go wrong does go wrong at her sister''s wedding, a maid of honor must save the day.', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200', NULL, '2024-02-28', 98, 4.0, ARRAY['Comedy', 'Romance'], 'Nancy Meyers', ARRAY['Jennifer Lawrence', 'Chris Evans', 'Awkwafina'], 'English', 'PG-13', FALSE),
('Dragon''s Peak', 'In ancient China, a young warrior discovers she can communicate with the last surviving dragons.', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200', NULL, '2024-08-16', 155, 4.9, ARRAY['Fantasy', 'Action', 'Adventure'], 'Zhang Wei', ARRAY['Liu Yifei', 'Tony Leung', 'Michelle Yeoh'], 'English', 'PG-13', TRUE),
('Silent Hours', 'A deaf musician must use her unique perception of vibrations to solve a serial case that has baffled the police.', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200', NULL, '2024-09-20', 129, 4.6, ARRAY['Thriller', 'Crime', 'Drama'], 'Park Chan-wook', ARRAY['Saoirse Ronan', 'Daniel Kaluuya', 'Lupita Nyongo'], 'English', 'R', FALSE),
('Starbound Academy', 'A group of misfits at an elite space academy must work together when a real alien threat arrives.', 'https://images.unsplash.com/photo-1462332420958-a33f6f217f60?w=400', 'https://images.unsplash.com/photo-1462332420958-a33f6f217f60?w=1200', NULL, '2024-06-21', 132, 4.1, ARRAY['Sci-Fi', 'Comedy', 'Adventure'], 'Taika Waititi', ARRAY['Tom Holland', 'Zendaya', 'Jacob Batalon'], 'English', 'PG-13', FALSE),
('The Inheritance', 'Three estranged siblings reunite when their wealthy grandmother''s will reveals a shocking family secret.', 'https://images.unsplash.com/photo-1464146072230-91cabc968266?w=400', 'https://images.unsplash.com/photo-1464146072230-91cabc968266?w=1200', NULL, '2024-11-15', 142, 4.5, ARRAY['Drama', 'Mystery'], 'Greta Gerwig', ARRAY['Cate Blanchett', 'Margot Robbie', 'Ryan Gosling'], 'English', 'PG-13', FALSE);
