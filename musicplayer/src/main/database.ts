import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

// Store the database file in the user's hidden AppData/Application Support folder
// so it persists even if they update or reinstall the app!
const dbPath = path.join(app.getPath('userData'), 'music_library.db')
const db: DatabaseType = new Database(dbPath)

// Enforce foreign key constraints (crucial for our playlist junction table)
db.pragma('journal_mode = WAL') // Write-Ahead Logging for better performance
db.pragma('foreign_keys = ON')

function ensureColumnExists(tableName: string, columnName: string, columnDefinition: string) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>
  const hasColumn = columns.some((column) => column.name === columnName)

  if (!hasColumn) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`)
  }
}

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS artists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      sort_name TEXT,
      image_path TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      album_artist_id INTEGER,
      year INTEGER,
      genre TEXT,
      cover_image_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(title, album_artist_id),
      FOREIGN KEY (album_artist_id) REFERENCES artists(id) ON DELETE SET NULL
    );
  `)

  // 1. Create the Tracks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT UNIQUE NOT NULL,
      filename TEXT NOT NULL,
      title TEXT,
      artist TEXT,
      album_artist TEXT,
      album TEXT,
      artist_id INTEGER,
      album_id INTEGER,
      duration INTEGER,
      year INTEGER,
      genre TEXT,
      bit_rate INTEGER,
      num_listens INTEGER DEFAULT 0,
      is_favorite INTEGER DEFAULT 0,
      track_num INTEGER,
      disc_num INTEGER,
      album_image_path TEXT,
      FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE SET NULL,
      FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL
    );
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS playlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      desc TEXT,
      cover_image_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS playlist_tracks (
      playlist_id INTEGER,
      track_id INTEGER,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      track_order INTEGER DEFAULT 0,
      PRIMARY KEY (playlist_id, track_id),
      FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
    );
  `)

  ensureColumnExists('artists', 'sort_name', 'sort_name TEXT')
  ensureColumnExists('artists', 'image_path', 'image_path TEXT')
  ensureColumnExists('artists', 'description', 'description TEXT')
  ensureColumnExists('playlist_tracks', 'track_order', 'track_order INTEGER DEFAULT 0')
  ensureColumnExists('tracks', 'year', 'year INTEGER')
  ensureColumnExists('tracks', 'album_artist', 'album_artist TEXT')
  ensureColumnExists('tracks', 'artist_id', 'artist_id INTEGER REFERENCES artists(id) ON DELETE SET NULL')
  ensureColumnExists('tracks', 'album_id', 'album_id INTEGER REFERENCES albums(id) ON DELETE SET NULL')
  ensureColumnExists('tracks', 'genre', 'genre TEXT')
  ensureColumnExists('tracks', 'bit_rate', 'bit_rate INTEGER')
  ensureColumnExists('tracks', 'num_listens', 'num_listens INTEGER DEFAULT 0')
  ensureColumnExists('tracks', 'is_favorite', 'is_favorite INTEGER DEFAULT 0')
  ensureColumnExists('tracks', 'track_num', 'track_num INTEGER')
  ensureColumnExists('tracks', 'disc_num', 'disc_num INTEGER')
  ensureColumnExists('tracks', 'album_image_path', 'album_image_path TEXT')

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tracks_artist_id ON tracks(artist_id);
    CREATE INDEX IF NOT EXISTS idx_tracks_album_id ON tracks(album_id);
    CREATE INDEX IF NOT EXISTS idx_albums_album_artist_id ON albums(album_artist_id);
    CREATE INDEX IF NOT EXISTS idx_artists_name ON artists(name COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track_id ON playlist_tracks(track_id);
  `)

  backfillTrackAlbumRelations()
  
  console.log("Database initialized at:", dbPath)
}

export default db

// --- LIBRARY FUNCTIONS ---

const normalizeMusicName = (value: string | undefined | null, fallback: string): string => {
  const normalized = value?.trim()
  return normalized || fallback
}

export function findOrCreateArtist(name: string | undefined | null): number {
  const artistName = normalizeMusicName(name, 'Unknown Artist')

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO artists (name, sort_name)
    VALUES (?, ?)
  `)
  insertStmt.run(artistName, artistName)

  const selectStmt = db.prepare('SELECT id FROM artists WHERE name = ?')
  const artist = selectStmt.get(artistName) as { id: number } | undefined

  if (!artist) {
    throw new Error(`Failed to find or create artist: ${artistName}`)
  }

  return artist.id
}

export function findOrCreateAlbum(
  title: string | undefined | null,
  albumArtistId: number,
  year?: number,
  genre?: string,
  coverImagePath?: string | null
): number {
  const albumTitle = normalizeMusicName(title, 'Unknown Album')

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO albums (title, album_artist_id, year, genre, cover_image_path)
    VALUES (?, ?, ?, ?, ?)
  `)
  insertStmt.run(albumTitle, albumArtistId, year ?? null, genre || null, coverImagePath || null)

  const updateStmt = db.prepare(`
    UPDATE albums
    SET
      year = COALESCE(?, year),
      genre = COALESCE(?, genre),
      cover_image_path = COALESCE(?, cover_image_path)
    WHERE title = ? AND album_artist_id = ?
  `)
  updateStmt.run(year ?? null, genre || null, coverImagePath || null, albumTitle, albumArtistId)

  const selectStmt = db.prepare('SELECT id FROM albums WHERE title = ? AND album_artist_id = ?')
  const album = selectStmt.get(albumTitle, albumArtistId) as { id: number } | undefined

  if (!album) {
    throw new Error(`Failed to find or create album: ${albumTitle}`)
  }

  return album.id
}

export function insertTrack(
  filePath: string,
  filename: string,
  duration?: number,
  title?: string,
  artist?: string,
  album?: string,
  year?: number,
  albumImagePath?: string | null,
  albumArtist?: string,
  genre?: string,
  bitrate?: number,
  trackNum?: number,
  discNum?: number
) {
  const artistName = normalizeMusicName(artist, 'Unknown Artist')
  const albumArtistName = normalizeMusicName(albumArtist || artistName, 'Unknown Artist')
  const albumTitle = normalizeMusicName(album, 'Unknown Album')
  const artistId = findOrCreateArtist(artistName)
  const albumArtistId = findOrCreateArtist(albumArtistName)
  const albumId = findOrCreateAlbum(albumTitle, albumArtistId, year, genre, albumImagePath)

  const stmt = db.prepare(`
    INSERT INTO tracks (
      file_path,
      filename,
      duration,
      title,
      artist,
      album_artist,
      album,
      artist_id,
      album_id,
      year,
      genre,
      bit_rate,
      track_num,
      disc_num,
      album_image_path
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(file_path) DO UPDATE SET
      filename = excluded.filename,
      duration = excluded.duration,
      title = excluded.title,
      artist = excluded.artist,
      album_artist = excluded.album_artist,
      album = excluded.album,
      artist_id = excluded.artist_id,
      album_id = excluded.album_id,
      year = excluded.year,
      genre = excluded.genre,
      bit_rate = excluded.bit_rate,
      track_num = excluded.track_num,
      disc_num = excluded.disc_num,
      album_image_path = excluded.album_image_path
  `)
  stmt.run(
    filePath,
    filename,
    duration ?? null,
    title || null,
    artistName,
    albumArtistName,
    albumTitle,
    artistId,
    albumId,
    year ?? null,
    genre || null,
    bitrate ?? null,
    trackNum ?? null,
    discNum ?? null,
    albumImagePath || null
  )
}

function backfillTrackAlbumRelations() {
  const tracks = db.prepare(`
    SELECT
      id,
      artist,
      album_artist,
      album,
      year,
      genre,
      album_image_path
    FROM tracks
    WHERE artist_id IS NULL OR album_id IS NULL
  `).all() as Array<{
    id: number
    artist?: string | null
    album_artist?: string | null
    album?: string | null
    year?: number | null
    genre?: string | null
    album_image_path?: string | null
  }>

  if (tracks.length === 0) return

  const updateStmt = db.prepare(`
    UPDATE tracks
    SET
      artist = ?,
      album_artist = ?,
      album = ?,
      artist_id = ?,
      album_id = ?
    WHERE id = ?
  `)

  const backfillMany = db.transaction(() => {
    for (const track of tracks) {
      const artistName = normalizeMusicName(track.artist, 'Unknown Artist')
      const albumArtistName = normalizeMusicName(track.album_artist || artistName, 'Unknown Artist')
      const albumTitle = normalizeMusicName(track.album, 'Unknown Album')
      const artistId = findOrCreateArtist(artistName)
      const albumArtistId = findOrCreateArtist(albumArtistName)
      const albumId = findOrCreateAlbum(
        albumTitle,
        albumArtistId,
        track.year ?? undefined,
        track.genre ?? undefined,
        track.album_image_path ?? null
      )

      updateStmt.run(artistName, albumArtistName, albumTitle, artistId, albumId, track.id)
    }
  })

  backfillMany()
  console.log(`Backfilled album relationships for ${tracks.length} tracks`)
}

export function getAllTracks() {
  const stmt = db.prepare('SELECT * FROM tracks ORDER BY filename ASC')
  return stmt.all()
}

// --- ARTIST FUNCTIONS ---

export function getAllArtists() {
  const stmt = db.prepare(`
    SELECT
      artists.id,
      artists.name,
      artists.sort_name,
      artists.image_path AS artist_image_path,
      artists.description,
      COALESCE(track_stats.track_count, 0) AS track_count,
      COALESCE(album_stats.album_count, 0) AS album_count,
      COALESCE(track_stats.total_duration, 0) AS total_duration
    FROM artists
    LEFT JOIN (
      SELECT artist_id, COUNT(*) AS track_count, COALESCE(SUM(duration), 0) AS total_duration
      FROM tracks
      GROUP BY artist_id
    ) AS track_stats ON track_stats.artist_id = artists.id
    LEFT JOIN (
      SELECT album_artist_id, COUNT(*) AS album_count
      FROM albums
      GROUP BY album_artist_id
    ) AS album_stats ON album_stats.album_artist_id = artists.id
    GROUP BY artists.id
    ORDER BY COALESCE(artists.sort_name, artists.name) COLLATE NOCASE ASC
  `)
  return stmt.all()
}

export function getArtistTracks(artistId: number) {
  const stmt = db.prepare(`
    SELECT
      tracks.*,
      track_artists.name AS artist,
      albums.title AS album,
      album_artists.name AS album_artist,
      albums.cover_image_path AS album_image_path
    FROM tracks
    LEFT JOIN artists AS track_artists ON track_artists.id = tracks.artist_id
    LEFT JOIN albums ON albums.id = tracks.album_id
    LEFT JOIN artists AS album_artists ON album_artists.id = albums.album_artist_id
    WHERE tracks.artist_id = ? OR albums.album_artist_id = ?
    ORDER BY albums.year ASC, albums.title COLLATE NOCASE ASC, COALESCE(tracks.disc_num, 1) ASC, COALESCE(tracks.track_num, 0) ASC, tracks.filename ASC
  `)
  return stmt.all(artistId, artistId)
}

export function getArtistAlbums(artistId: number) {
  const stmt = db.prepare(`
    SELECT
      albums.id,
      albums.title,
      albums.album_artist_id,
      artists.name AS album_artist,
      albums.year,
      albums.genre,
      albums.cover_image_path,
      COUNT(tracks.id) AS track_count,
      COALESCE(SUM(tracks.duration), 0) AS total_duration
    FROM albums
    LEFT JOIN artists ON artists.id = albums.album_artist_id
    LEFT JOIN tracks ON tracks.album_id = albums.id
    WHERE albums.album_artist_id = ?
    GROUP BY albums.id
    ORDER BY albums.year ASC, albums.title COLLATE NOCASE ASC
  `)
  return stmt.all(artistId)
}

export function updateArtist(id: number, name: string, description: string, imagePath: string | null) {
  const artistName = normalizeMusicName(name, 'Unknown Artist')
  const stmt = db.prepare(`
    UPDATE artists
    SET name = ?, sort_name = ?, description = ?, image_path = ?
    WHERE id = ?
  `)
  stmt.run(artistName, artistName, description || null, imagePath || null, id)
  return true
}

// --- ALBUM FUNCTIONS ---

export function getAllAlbums() {
  const stmt = db.prepare(`
    SELECT
      albums.id,
      albums.title,
      albums.album_artist_id,
      artists.name AS album_artist,
      albums.year,
      albums.genre,
      albums.cover_image_path,
      COUNT(tracks.id) AS track_count,
      COALESCE(SUM(tracks.duration), 0) AS total_duration
    FROM albums
    LEFT JOIN artists ON artists.id = albums.album_artist_id
    LEFT JOIN tracks ON tracks.album_id = albums.id
    GROUP BY albums.id
    ORDER BY artists.name ASC, albums.year ASC, albums.title ASC
  `)
  return stmt.all()
}

export function getAlbumTracks(albumId: number) {
  const stmt = db.prepare(`
    SELECT
      tracks.*,
      track_artists.name AS artist,
      albums.title AS album,
      album_artists.name AS album_artist,
      albums.cover_image_path AS album_image_path
    FROM tracks
    LEFT JOIN artists AS track_artists ON track_artists.id = tracks.artist_id
    LEFT JOIN albums ON albums.id = tracks.album_id
    LEFT JOIN artists AS album_artists ON album_artists.id = albums.album_artist_id
    WHERE tracks.album_id = ?
    ORDER BY COALESCE(tracks.disc_num, 1) ASC, COALESCE(tracks.track_num, 0) ASC, tracks.filename ASC
  `)
  return stmt.all(albumId)
}

// --- PLAYLIST FUNCTIONS ---

export function createPlaylist(name: string, desc: string, coverImagePath: string | null) {
  const stmt = db.prepare('INSERT INTO playlists (name, desc, cover_image_path) VALUES (?, ?, ?)')
  const info = stmt.run(name, desc, coverImagePath)
  return info.lastInsertRowid // Returns the new playlist's ID
}

export function addTracksToPlaylist(playlistId: number, trackIds: number[]) {
  // Use a transaction so if one fails, they all fail (keeps data safe)
  const insertMany = db.transaction((pId: number, tIds: number[]) => {
    const stmt = db.prepare('INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id) VALUES (?, ?)')
    for (const tId of tIds) {
      stmt.run(pId, tId)
    }
  })
  
  insertMany(playlistId, trackIds)
}

export function updatePlaylist(id: number, name: string, desc: string, coverImage: string | null) {
  const stmt = db.prepare('UPDATE playlists SET name = ?, desc = ?, cover_image_path = ? WHERE id = ?')
  stmt.run(name, desc, coverImage, id)
  return true
}

export function getPlaylistTracks(playlistId: number) {
  // This JOIN statement is the magic that combines the junction table with the track data
  const stmt = db.prepare(`
    SELECT tracks.*, playlist_tracks.track_order 
    FROM tracks 
    JOIN playlist_tracks ON tracks.id = playlist_tracks.track_id 
    WHERE playlist_tracks.playlist_id = ? 
    ORDER BY COALESCE(playlist_tracks.track_order, 0) ASC, playlist_tracks.added_at ASC
  `)
  return stmt.all(playlistId)
}

export function getAllPlaylists() {
  const stmt = db.prepare('SELECT * FROM playlists ORDER BY name ASC')
  return stmt.all()
}

export function deletePlaylist(id: number) {
  const stmt = db.prepare('DELETE FROM playlists WHERE id = ?')
  stmt.run(id)
  return true
}

export function removeTrackFromPlaylist(playlistId: number, trackId: number) {
  const stmt = db.prepare('DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?')
  stmt.run(playlistId, trackId)
  return true
}

export function deleteTrack(trackId: number) {
  const stmt = db.prepare('DELETE FROM tracks WHERE id = ?')
  stmt.run(trackId)
  return true
}