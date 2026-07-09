import React from 'react'
import { Track } from '../env'
import { formatDuration, formatPlaylistDuration } from '@renderer/utilities/formatting'
import { Playlist } from '../env'


interface PlaylistViewProps {
  playlist: Playlist
  tracks: Track[]
  currentTrack: Track | null
  isPlaying: boolean
  playTrack: (track: Track) => void
  onPlayTrackWithQueue?: (track: Track, index: number) => void
  onAddSongsClick: () => void
  onEditClick: () => void
  onTrackContextMenu: (e: React.MouseEvent, track: Track, index: number) => void
}

export default function PlaylistView({ 
  playlist, 
  tracks, 
  currentTrack, 
  isPlaying, 
  playTrack,
  onPlayTrackWithQueue,
  onAddSongsClick,
  onEditClick,
  onTrackContextMenu
}: PlaylistViewProps) {
  
  const totalDuration = tracks.reduce((sum, track) => sum + (track.duration || 0), 0)
  
  return (
    <div>
      {/* --- PLAYLIST HEADER --- */}
      <div className="header">
        <div style={{ display: 'flex', gap: '30px', marginLeft: '16px'}}>
          <div className="playlist-image" style={{
          width: '200px', height: '200px', borderRadius: '8px', 
          justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
          }}>
            {playlist.cover_image_path ? (
              <img 
                src={`local://stream?path=${encodeURIComponent(playlist.cover_image_path.replace(/\\/g, '/'))}`} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                alt={playlist.name} 
              />
            ) : (
              <span style={{ fontSize: '64px' }}>🎵</span>
            )}
          </div>
          <div style={{display: 'flex', flexDirection: 'column', textAlign: 'left', width: '100%'}}>
            <h1 style={{ fontSize: '48px'}}>{playlist.name}</h1>
            <p>{playlist.desc}</p>
            <span className='text-soft' style={{ fontWeight: 'bold', textAlign: 'left' }}>
              {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}{tracks.length > 0 && ` • ${formatPlaylistDuration(totalDuration)}`}
            </span>
            <div style={{marginTop: 'auto', display:'flex', flexDirection: 'row', gap: '2px'}}>
              <button className='play-btn play-btn-large'>
                <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </button>
              <button className="btn" onClick={onEditClick}>Edit Details</button>
              <button className="btn btn-primary" onClick={onAddSongsClick}>Add Songs</button>
            </div>
          </div>
        </div>
      </div>

      {tracks.length === 0 ? (
        <div className='text-soft' style={{ textAlign: 'center', marginTop: '80px'}}>
          <h2>This playlist is looking a little empty.</h2>
          <p style={{ marginBottom: '24px' }}>Let's find some tracks to add to it.</p>
          <button className="btn btn-primary" onClick={onAddSongsClick}>
            Find Songs
          </button>
        </div>
      ) : (
        <div className="track-list">
          {tracks.map((track, index) => (
            <div 
              key={`${track.id}-${index}`} 
              className={`track-item ${currentTrack?.id === track.id ? 'active' : ''}`}
              onDoubleClick={() => onPlayTrackWithQueue ? onPlayTrackWithQueue(track, index) : playTrack(track)}
              onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => onTrackContextMenu(e, track, index)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <span className='text-soft' style={{ marginRight: '20px'}}>
                  {currentTrack?.id === track.id && isPlaying ? '▶' : index + 1}
                </span>
                <span className='item-title'>{track.title || track.filename}</span>
                  <span className='text-soft track-item-metadata'>
                  <span>{track.artist}</span>
                  <span>{track.album}</span>
                  <span>{track.year}</span>
              </span>
              </div>
              <span className='text-soft'>
                {formatDuration(track.duration)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}