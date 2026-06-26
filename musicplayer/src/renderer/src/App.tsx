import { useState, useRef, useEffect } from 'react'
import { Track, Playlist } from './env'
import LibraryView from './views/LibraryView'
import PlaylistsView from './views/PlaylistsView'
import PlaylistView from './views/PlaylistView'
import NewPlaylistModal from './components/NewPlaylistModal'
import AddSongsModal from './components/AddSongsModal'
import EditPlaylistModal from './components/EditPlaylistModal'
import QueuePopover from './components/QueuePopover'
import TrackContextMenu, { TrackContextMenuData } from './components/TrackContextMenu'
import PlaylistContextMenu, { PlaylistMenuData } from './components/PlaylistContextMenu'

type ViewState = 
  | { type: 'library' }
  | { type: 'albums'}
  | { type: 'artists'}
  | { type: 'playlists'}
  | { type: 'playlist', id: number, name: string, desc: string, coverImagePath?: string | null }

function App() {
  // Data
  const [tracks, setTracks] = useState<Track[]>([]) // tracks currently in view
  const [libraryCount, setLibraryCount] = useState(0) // total library track count
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [playbackQueue, setPlaybackQueue] = useState<Track[]>([])
  const [allTracks, setAllTracks] = useState<Track[]>([]) // all tracks in library

  // View states
  const [trackContextMenu, setTrackContextMenu] = useState<TrackContextMenuData | null>(null)
  const [playlistContextMenu, setPlaylistContextMenu] = useState<PlaylistMenuData | null>(null)
  const [isQueueOpen, setIsQueueOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPlaylistsExpanded, setIsPlaylistsExpanded] = useState(false)
  const [isAddSongsModalOpen, setIsAddSongsModalOpen] = useState(false)
  const [currentView, setCurrentView] = useState<ViewState>({ type: 'library' })

  // Audioplayer states
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isSeeking, setIsSeeking] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Library
        const savedTracks = await window.api.getLibrary()
        if (savedTracks) {
          setTracks(savedTracks)
          setLibraryCount(savedTracks.length)
          setAllTracks(savedTracks)
        }

        // Playlists
        const savedPlaylists = await window.api.getPlaylists()
        if (savedPlaylists) {
          setPlaylists(savedPlaylists)
        }

        console.log("Loaded database on startup:", { savedTracks, savedPlaylists })
      } catch (error) {
        console.error("Failed to load database:", error)
      }
    }

    loadInitialData()
  }, [])

  useEffect(() => {
    const syncTracksWithView = async () => {
      try {
        if (currentView.type === 'library') {
          setTracks(allTracks)
        } 
        else if (currentView.type === 'playlist') {
          const playlistTracks = await window.api.getPlaylistTracks(currentView.id)
          setTracks(playlistTracks || [])
        }
        else if (currentView.type === 'playlists') {
          setTracks([])
        }
      } catch (error) {
        console.error("Failed to sync view data:", error)
      }
    }

    syncTracksWithView()
  }, [currentView, allTracks])

  const handleScanFolder = async () => {
    const updatedLibrary = await window.api.selectFolder()
    if (updatedLibrary) {
      setTracks(updatedLibrary)
      setLibraryCount(updatedLibrary.length)
      setAllTracks(updatedLibrary)
    }
  }

  const handleCreatePlaylist = async (name: string, desc: string, coverImagePath: string | null) => {
    try {
      const newId = await window.api.createPlaylist(name, desc, coverImagePath)

      const updatedPlaylists = await window.api.getPlaylists()
      setPlaylists(updatedPlaylists || [])

      setIsModalOpen(false)

      setCurrentView({ type: 'playlist', id: newId, name: name, desc:desc, coverImagePath: coverImagePath }) // TODO: maybe needs to pass image???
      
    } catch (error) {
      console.error("Failed to create playlist:", error)
    }
  }

  const handleAddSongsToPlaylist = async (selectedTrackIds: number[]) => {
    if (currentView.type !== 'playlist') return

    try {
      await window.api.addTracksToPlaylist(currentView.id, selectedTrackIds)
      
      const updatedTracks = await window.api.getPlaylistTracks(currentView.id)
      setTracks(updatedTracks || [])
      
      setIsAddSongsModalOpen(false)
    } catch (error) {
      console.error("Failed to add songs:", error)
    }
  }

  const handleEditPlaylist = async (name: string, desc: string, coverImagePath: string | null) => {
    if (currentView.type !== 'playlist') return

    try {
      await window.api.updatePlaylist(currentView.id, name, desc, coverImagePath)
      
      const updatedPlaylists = await window.api.getPlaylists()
      setPlaylists(updatedPlaylists || [])
      
      setCurrentView({ 
        type: 'playlist', 
        id: currentView.id, 
        name: name, 
        desc: desc, 
        coverImagePath: coverImagePath 
      })
      
      // 4. Close the modal
      setIsEditModalOpen(false)
    } catch (error) {
      console.error("Failed to edit playlist:", error)
    }
  }

  const handleDeletePlaylist = async (id: number) => {
    try {
      await window.api.deletePlaylist(id)
      
      // Refresh the sidebar
      const updatedPlaylists = await window.api.getPlaylists()
      setPlaylists(updatedPlaylists || [])

      // If the user is currently LOOKING at the playlist they just deleted, kick them back to the library!
      if (currentView.type === 'playlist' && currentView.id === id) {
        setCurrentView({ type: 'library' })
      }
    } catch (error) {
      console.error("Failed to delete playlist:", error)
    }
  }

  const handleEditPlaylistFromMenu = (pl: Playlist) => {
      setCurrentView({ 
      type: 'playlist', 
      id: pl.id, 
      name: pl.name, 
      desc: pl.desc || '', 
      coverImagePath: pl.cover_image_path || null 
    })
    setIsEditModalOpen(true)
  }

  const handlePlayPlaylist = async (pl: Playlist) => {
    // Fetch the tracks for this specific playlist and add them to the queue
    const plTracks = await window.api.getPlaylistTracks(pl.id)
    if (plTracks && plTracks.length > 0) {
      // Add them right after the currently playing song
      const newQueue = [...playbackQueue]
      const insertIndex = currentTrackIndex !== null ? currentTrackIndex + 1 : 0
      newQueue.splice(insertIndex, 0, ...plTracks)
      setPlaybackQueue(newQueue)
      
      // If nothing was playing, start it immediately
      if (currentTrackIndex === null) {
        setCurrentTrackIndex(0)
      }
    }
  }

  // Listen for scan folder requests from the menu
  useEffect(() => {
    window.api.onScanFolder(() => handleScanFolder())
  }, [handleScanFolder])

  // Queue Controls

  const handlePlayNext = (track: Track) => {
    // If nothing is playing, just start it
    if (currentTrackIndex === null) {
      setPlaybackQueue([track])
      setCurrentTrackIndex(0)
      return
    }
    
    // Otherwise, slice it into the queue right after the current track
    const newQueue = [...playbackQueue]
    newQueue.splice(currentTrackIndex + 1, 0, track)
    setPlaybackQueue(newQueue)
  }

  const handleAddToQueue = (track: Track) => {
    // Add it to the very end of the list
    setPlaybackQueue([...playbackQueue, track])
  }

  // --- PLAYBACK CONTROLS ---

  // Format time in mm:ss
  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  // Poll audio element for consistent time updates
  useEffect(() => {
    if (!isPlaying || isSeeking) return

    const interval = setInterval(() => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime)
      }
    }, 100) 

    return () => clearInterval(interval)
  }, [isPlaying, isSeeking])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const handleSliderMouseDown = () => setIsSeeking(true)
  const handleSliderMouseUp = () => setIsSeeking(false)

const currentAudioSrc = currentTrackIndex !== null && playbackQueue[currentTrackIndex]
    ? `local://stream?path=${encodeURIComponent(playbackQueue[currentTrackIndex].file_path.replace(/\\/g, '/'))}` 
    : ''

  useEffect(() => {
    if (currentAudioSrc && audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true)
      }).catch(err => {
        console.error("Browser blocked playback or file missing:", err)
        setIsPlaying(false)
      })
    }
  }, [currentAudioSrc]) 

  const playTrack = (index: number) => {
    setPlaybackQueue([...tracks]) 
    setCurrentTrackIndex(index)
    setCurrentTime(0)
    setDuration(0)
  }

  const togglePlayPause = () => {
    if (!audioRef.current || currentTrackIndex === null) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch(err => console.error("Playback error:", err))
      setIsPlaying(true)
    }
  }

  const playNext = () => {
    if (currentTrackIndex === null || playbackQueue.length === 0) return
    let nextIndex = currentTrackIndex + 1
    if (nextIndex >= playbackQueue.length) nextIndex = 0 
    
    setCurrentTrackIndex(nextIndex)
    setCurrentTime(0)
    setDuration(0)
  }

  const playPrev = () => {
    if (currentTrackIndex === null || playbackQueue.length === 0) return
    let prevIndex = currentTrackIndex - 1
    if (prevIndex < 0) prevIndex = playbackQueue.length - 1 
    
    setCurrentTrackIndex(prevIndex)
    setCurrentTime(0)
    setDuration(0)
  }

  return (
    <div className="app-container">
      <nav className="sidebar">
        <h2>Library</h2>
        <ul>
          <li onClick={() => setCurrentView({type: 'library'})}>All Songs ({libraryCount})</li>
          <li onClick={() => setCurrentView({type: 'playlists'})}>Playlists ({playlists.length})</li>
          <div className="sidebar-dropdown">
          <button 
            className="dropdown-toggle" 
            onClick={() => setIsPlaylistsExpanded(!isPlaylistsExpanded)}
          >
            <span className={`dropdown-arrow ${isPlaylistsExpanded ? 'open' : ''}`}>
              ▼
            </span>
          </button>
          {isPlaylistsExpanded && (
            <ul className="dropdown-list">
              {playlists.map(pl => (
                <li 
                  key={pl.id}
                  onClick={() => setCurrentView({ type: 'playlist', id: pl.id, name: pl.name, desc: pl.desc || '', coverImagePath: pl.cover_image_path || null })}
                  // @ts-expect-error onContextMenu is valid at runtime but not in React's type definitions
                  onContextMenu={(e: React.MouseEvent<HTMLLIElement>) => {
                    e.preventDefault()
                    setPlaylistContextMenu({ x: e.pageX, y: e.pageY, playlist: pl })
                  }}
                >
                  <div className="sidebar-thumb">
                    {pl.cover_image_path ? (
                      <img 
                        src={`local://stream?path=${encodeURIComponent(pl.cover_image_path.replace(/\\/g, '/'))}`} 
                        alt="cover" 
                      />
                    ) : (
                      <span style={{ fontSize: '10px' }}>🎵</span>
                    )}
                  </div>
                  {pl.name}
                </li>
              ))}
            </ul>
          )}
        </div>

          <li>Albums</li>
          <li>Artists</li>
        </ul>
      </nav>
      <nav className="sidebar" style={{ gridColumn: '4'}}>
        <QueuePopover 
            isOpen={isQueueOpen} 
            queue={playbackQueue} 
            currentIndex={currentTrackIndex} 
            onClose={() => setIsQueueOpen(false)} 
            
            onPlayTrack={(index) => {
              setCurrentTrackIndex(index)
              setCurrentTime(0)
            }}

            onContextMenu={(e, track, index) => {
              e.preventDefault()
              setTrackContextMenu({ x: e.pageX, y: e.pageY, track, index, source: 'queue' })
            }}
          />

      </nav>

      <header className="topbar">
        {/* Playback controls & Audio player */}
        {/* Hidden Audio Element */}
        <audio 
          ref={audioRef} 
          src={currentAudioSrc} 
          onEnded={playNext}
          onLoadedMetadata={handleLoadedMetadata}
        />

        <button className="control-btn" onClick={playPrev}>⏮</button>
        
        <button className="play-btn" onClick={togglePlayPause}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        
        <button className="control-btn" onClick={playNext}>⏭</button>

        <div className="player-container">
          <button className="btn shuffle-btn">⇄</button>
          <div className="player-track">
            {currentTrackIndex !== null && playbackQueue[currentTrackIndex] 
              ? playbackQueue[currentTrackIndex].filename 
              : 'No track selected'}
          </div>
          <div className="player-info">Artist Name - Album Name</div>
          <button className="btn repeat-btn">↺</button>

          {/* Current time */}
          <span className="player-time player-time-current">{formatTime(currentTime)}</span>
          
          {/* Progress slider */}
          <input 
            type="range" 
            className="player-slider"
            min="0" 
            max={duration} 
            value={currentTime}
            onChange={handleSliderChange}
            onMouseDown={handleSliderMouseDown}
            onMouseUp={handleSliderMouseUp}
          />
          
          {/* Duration */}
          <span className="player-time player-time-duration">-{formatTime(duration-currentTime)}</span>
        </div>
        
        {/* --- THE QUEUE BUTTON & POPOVER --- */}
        {/* The relative position here acts as the anchor! */}
        <div style={{ position: 'relative' }}>
          
          <button 
            className="btn" 
            onClick={() => setIsQueueOpen(!isQueueOpen)}
            style={{ color: isQueueOpen ? '#1db954' : 'inherit' }} // Turns green when open!
          >
            <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none">
              <path d="M8 6.00067L21 6.00139M8 12.0007L21 12.0015M8 18.0007L21 18.0015M3.5 6H3.51M3.5 12H3.51M3.5 18H3.51M4 6C4 6.27614 3.77614 6.5 3.5 6.5C3.22386 6.5 3 6.27614 3 6C3 5.72386 3.22386 5.5 3.5 5.5C3.77614 5.5 4 5.72386 4 6ZM4 12C4 12.2761 3.77614 12.5 3.5 12.5C3.22386 12.5 3 12.2761 3 12C3 11.7239 3.22386 11.5 3.5 11.5C3.77614 11.5 4 11.7239 4 12ZM4 18C4 18.2761 3.77614 18.5 3.5 18.5C3.22386 18.5 3 18.2761 3 18C3 17.7239 3.22386 17.5 3.5 17.5C3.77614 17.5 4 17.7239 4 18Z" stroke='var(--button-alt-text)' strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <QueuePopover 
            isOpen={isQueueOpen} 
            queue={playbackQueue} 
            currentIndex={currentTrackIndex} 
            onClose={() => setIsQueueOpen(false)} 
            
            onPlayTrack={(index) => {
              setCurrentTrackIndex(index)
              setCurrentTime(0)
            }}

            onContextMenu={(e, track, index) => {
              e.preventDefault()
              setTrackContextMenu({ x: e.pageX, y: e.pageY, track, index, source: 'queue' })
            }}
          />
        </div>
        <input type="text" className="search-input" placeholder="Search" />
      </header>

      <main className="main-content">
        {currentView.type === 'library' && (
          <>
            <LibraryView 
              tracks={tracks} 
              currentTrackIndex={currentTrackIndex} 
              isPlaying={isPlaying} 
              playTrack={playTrack} 

              onTrackContextMenu={(e, track, index) => {
                e.preventDefault()
                setTrackContextMenu({ x: e.pageX, y: e.pageY, track, index, source: 'queue' })
              }}
            />
          </>
        )}

        {/* Render the Playlist View */}
        {currentView.type === 'playlists' && (
          <>
            <PlaylistsView 
              playlists={playlists} 
              onOpenPlaylist={(pl) => setCurrentView({ type: 'playlist', id: pl.id, name: pl.name, desc: pl.desc || '', coverImagePath: pl.cover_image_path || null })} 
              onNewPlaylist={() => setIsModalOpen(true)}
            />
          </>
        )}
        {currentView.type === 'playlist' && (
          <>
            <PlaylistView 
            playlistId={currentView.id}
            playlistName={currentView.name}
            playlistDesc={currentView.desc}
            coverImagePath={currentView.coverImagePath || null}
            tracks={tracks} 
            currentTrackIndex={currentTrackIndex} 
            isPlaying={isPlaying} 
            playTrack={playTrack} 
            onAddSongsClick={() => setIsAddSongsModalOpen(true)}
            onEditClick={() => setIsEditModalOpen(true)}
            onTrackContextMenu={(e, track, index) => {
                e.preventDefault()
                setTrackContextMenu({ x: e.pageX, y: e.pageY, track, index, source: 'queue' })
              }}
            />
          </>
        )}

      </main>

      {/* Modals, popups */}

      <TrackContextMenu 
        menuData={trackContextMenu}
        onClose={() => setTrackContextMenu(null)}
        onPlayNext={handlePlayNext}
        onAddToQueue={handleAddToQueue}
        // onRemoveFromQueue={handleRemoveFromQueue}
      />

      <PlaylistContextMenu 
        menuData={playlistContextMenu}
        onClose={() => setPlaylistContextMenu(null)}
        onPlay={handlePlayPlaylist}
        onEdit={handleEditPlaylistFromMenu}
        onDelete={handleDeletePlaylist}
      />

      <AddSongsModal 
        isOpen={isAddSongsModalOpen}
        onClose={() => setIsAddSongsModalOpen(false)}
        onSave={handleAddSongsToPlaylist}
        library={allTracks}
      />

      {currentView.type === 'playlist' && (
        <EditPlaylistModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleEditPlaylist}
          initialName={currentView.name}
          initialDesc={currentView.desc}
          initialImage={currentView.coverImagePath || null}
        />
      )}

      {isModalOpen && (
        <NewPlaylistModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreate={handleCreatePlaylist} 
      />
      )}
    </div>
  )
}

export default App