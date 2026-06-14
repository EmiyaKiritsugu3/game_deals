-- P0-Audit: index playlist_games.gameId for FK reverse lookup + cascade delete performance.
-- Not covered by the existing unique (playlistId, gameId) because queries filter by gameId alone
-- (e.g., "which playlists include this game", cascade delete from games).
CREATE INDEX IF NOT EXISTS "pg_gameId_idx" ON playlist_games ("gameId");
