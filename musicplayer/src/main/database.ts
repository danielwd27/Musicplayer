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
  // 1. Create the Tracks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT UNIQUE NOT NULL,
      filename TEXT NOT NULL,
      title TEXT,
      artist TEXT,
      album TEXT,
      duration INTEGER,
      year INTEGER,
      album_image_path TEXT
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

  ensureColumnExists('playlist_tracks', 'track_order', 'track_order INTEGER DEFAULT 0')
  ensureColumnExists('tracks', 'year', 'year INTEGER')
  ensureColumnExists('tracks', 'album_image_path', 'album_image_path TEXT')
  
  console.log("Database initialized at:", dbPath)
}

export default db

// --- LIBRARY FUNCTIONS ---

export function insertTrack(
  filePath: string,
  filename: string,
  duration?: number,
  title?: string,
  artist?: string,
  album?: string,
  year?: number,
  albumImagePath?: string | null
) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO tracks (file_path, filename, duration, title, artist, album, year, album_image_path) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  stmt.run(filePath, filename, duration || null, title || null, artist || null, album || null, year || null, albumImagePath || null)
}

export function getAllTracks() {
  const stmt = db.prepare('SELECT * FROM tracks ORDER BY filename ASC')
  return stmt.all()
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