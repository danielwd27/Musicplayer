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
      duration INTEGER
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
      PRIMARY KEY (playlist_id, track_id),
      FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
    );
  `)
  
  console.log("Database initialized at:", dbPath)
}

export default db

// --- LIBRARY FUNCTIONS ---

export function insertTrack(filePath: string, filename: string) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO tracks (file_path, filename) 
    VALUES (?, ?)
  `)
  stmt.run(filePath, filename)
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
    ORDER BY playlist_tracks.track_order ASC
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