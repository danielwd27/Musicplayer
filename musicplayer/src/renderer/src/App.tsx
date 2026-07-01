import { useState, useRef, useEffect } from 'react'
import { Track, Playlist } from './env'
import LibraryView from './views/LibraryView'
import PlaylistsView from './views/PlaylistsView'
import PlaylistView from './views/PlaylistView'
import NewPlaylistModal from './components/NewPlaylistModal'
import AddSongsModal from './components/AddSongsModal'
import EditPlaylistModal from './components/EditPlaylistModal'
// import QueuePopover from './components/QueuePopover'
import QueueSidebar from './components/QueueSidebar'
import TrackContextMenu, { TrackContextMenuData } from './components/TrackContextMenu'
import PlaylistContextMenu, { PlaylistMenuData } from './components/PlaylistContextMenu'

type QueueNode<T> = {
  value: T
  next: QueueNode<T> | null
}

class FIFOQueue<T> {
  private head: QueueNode<T> | null = null
  private tail: QueueNode<T> | null = null
  private sizeValue = 0

  enqueue(value: T): void {
    const node: QueueNode<T> = { value, next: null }

    if (!this.tail) {
      this.head = node
      this.tail = node
    } else {
      this.tail.next = node
      this.tail = node
    }

    this.sizeValue += 1
  }

  dequeue(): T | null {
    if (!this.head) return null

    const value = this.head.value
    this.head = this.head.next

    if (!this.head) {
      this.tail = null
    }

    this.sizeValue -= 1
    return value
  }

  pop(): T | null {
    if (!this.tail) return null

    let current = this.head
    let previous: QueueNode<T> | null = null

    while (current?.next) {
      previous = current
      current = current.next
    }

    if (!current) return null

    if (previous) {
      previous.next = null
      this.tail = previous
    } else {
      this.head = null
      this.tail = null
    }

    this.sizeValue -= 1
    return current.value
  }

  peek(): T | null {
    return this.head?.value ?? null
  }

  clear(): void {
    this.head = null
    this.tail = null
    this.sizeValue = 0
  }

  get length(): number {
    return this.sizeValue
  }

  toArray(): T[] {
    const values: T[] = []
    let current = this.head

    while (current) {
      values.push(current.value)
      current = current.next
    }

    return values
  }

  clone(): FIFOQueue<T> {
    const clone = new FIFOQueue<T>()
    this.toArray().forEach((item) => clone.enqueue(item))
    return clone
  }
}

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
  const [playbackQueue, setPlaybackQueue] = useState<FIFOQueue<Track>>(new FIFOQueue<Track>())
  const [historyQueue, setHistoryQueue] = useState<FIFOQueue<Track>>(new FIFOQueue<Track>())
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
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
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState<number>(1)
  const [isDraggingVolume, setIsDraggingVolume] = useState(false)
  const [duration, setDuration] = useState(0)
  const [isSeeking, setIsSeeking] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)

  // Helper functions to manage context menus (only one open at a time)
  const openTrackContextMenu = (data: TrackContextMenuData) => {
    setPlaylistContextMenu(null)
    setTrackContextMenu(data)
  }

  const openPlaylistContextMenu = (data: PlaylistMenuData) => {
    setTrackContextMenu(null)
    setPlaylistContextMenu(data)
  }

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

      setCurrentView({ type: 'playlist', id: newId, name: name, desc:desc, coverImagePath: coverImagePath })
      
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
    const plTracks = await window.api.getPlaylistTracks(pl.id)

    if (plTracks && plTracks.length > 0) {
      const nextQueue = new FIFOQueue<Track>()
      plTracks.slice(1).forEach((track) => nextQueue.enqueue(track))

      setPlaybackQueue(nextQueue)
      setCurrentTrack(plTracks[0] ?? null)
      setCurrentTime(0)
      setDuration(0)
    }
  }

  // Listen for scan folder requests from the menu
  useEffect(() => {
    window.api.onScanFolder(() => handleScanFolder())
  }, [handleScanFolder])

  // Queue Controls

  const handlePlayNext = (track: Track) => {
    if (!currentTrack) {
      setCurrentTrack(track)
      setPlaybackQueue(new FIFOQueue<Track>())
      return
    }

    setPlaybackQueue((prev) => {
      const next = prev.clone()
      next.enqueue(track)
      return next
    })
  }

  const handleAddToQueue = (track: Track) => {
    setPlaybackQueue((prev) => {
      const next = prev.clone()
      next.enqueue(track)
      return next
    })
  }

  const handleRemoveTrackFromPlaylist = async (trackId: number) => {
    if (currentView.type !== 'playlist') return

    try {
      await window.api.removeTrackFromPlaylist(currentView.id, trackId)
      
      const updatedTracks = await window.api.getPlaylistTracks(currentView.id)
      setTracks(updatedTracks || [])
    } catch (error) {
      console.error("Failed to remove track from playlist:", error)
    }
  }

  const handleDeleteTrackFromLibrary = async (trackId: number) => {
    try {
      await window.api.deleteTrack(trackId)
      
      // Refresh the library
      const updatedLibrary = await window.api.getLibrary()
      setAllTracks(updatedLibrary || [])
      setTracks(updatedLibrary || [])
      setLibraryCount((updatedLibrary || []).length)
      
      // If we're in a playlist view, also refresh that
      if (currentView.type === 'playlist') {
        const updatedPlaylistTracks = await window.api.getPlaylistTracks(currentView.id)
        setTracks(updatedPlaylistTracks || [])
      }
    } catch (error) {
      console.error("Failed to delete track from library:", error)
    }
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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value) / 100
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

const currentAudioSrc = currentTrack
    ? `local://stream?path=${encodeURIComponent(currentTrack.file_path.replace(/\\/g, '/'))}` 
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

  const playTrack = (track: Track) => {
    setPlaybackQueue(new FIFOQueue<Track>())
    setHistoryQueue(new FIFOQueue<Track>())
    setCurrentTrack(track)
    setCurrentTime(0)
    setDuration(0)
  }

  const togglePlayPause = () => {
    if (!audioRef.current || !currentTrack) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch(err => console.error("Playback error:", err))
      setIsPlaying(true)
    }
  }

  const playNext = () => {
    if (!currentTrack) return

    setHistoryQueue((prev) => {
      const next = prev.clone()
      next.enqueue(currentTrack)
      return next
    })

    const nextTrack = playbackQueue.dequeue()
    if (!nextTrack) {
      setCurrentTrack(null)
      setIsPlaying(false)
      return
    }

    setCurrentTrack(nextTrack)
    setCurrentTime(0)
    setDuration(0)
  }

  const playPrev = () => {
    if (!currentTrack) return

    const replayThresholdSeconds = 5

    if (currentTime > replayThresholdSeconds) {
      setCurrentTime(0)
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        if (isPlaying) {
          audioRef.current.play().catch((err) => console.error('Playback error:', err))
        }
      }
      return
    }

    const previousTrack = historyQueue.pop()
    if (!previousTrack) {
      setCurrentTime(0)
      if (audioRef.current) {
        audioRef.current.currentTime = 0
      }
      return
    }

    setPlaybackQueue((prev) => {
      const next = prev.clone()
      next.enqueue(currentTrack)
      return next
    })

    setCurrentTrack(previousTrack)
    setCurrentTime(0)
    setDuration(0)
  }

  const queueItems = playbackQueue.toArray()

  const sliderRange = (volume*100 + 5) / (110) * 100;

  return (
    <div className="app-container">
      <nav className="sidebar">
        <h2>Library</h2>
        <ul>
          <li onClick={() => setCurrentView({type: 'library'})}>All Songs ({libraryCount})</li>
          <li onClick={() => setCurrentView({type: 'playlists'})}>
            Playlists ({playlists.length})
            </li>
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
                <li className='text-soft'
                  key={pl.id}
                  onClick={() => setCurrentView({ type: 'playlist', id: pl.id, name: pl.name, desc: pl.desc || '', coverImagePath: pl.cover_image_path || null })}
                  onContextMenu={(e: React.MouseEvent<HTMLLIElement>) => {
                    e.preventDefault()
                    openPlaylistContextMenu({ x: e.pageX, y: e.pageY, playlist: pl })
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
      <nav className={isQueueOpen ? 'sidebar sidebar-queue' : 'sidebar sidebar-queue-closed'}>
        <QueueSidebar
            isOpen={isQueueOpen} 
            queue={queueItems} 
            historyQueue={historyQueue.toArray()}
            currentTrack={currentTrack} 
            onClose={() => setIsQueueOpen(false)} 
            
            onPlayTrack={(index) => {
              const queueTrack = queueItems[index]
              if (queueTrack) {
                // Dequeue all items up to and including the selected index
                setPlaybackQueue((prev) => {
                  const updated = prev.clone()
                  for (let i = 0; i <= index; i++) {
                    updated.dequeue()
                  }
                  return updated
                })
                
                setCurrentTrack(queueTrack)
                setCurrentTime(0)
              }
            }}

            onContextMenu={(e, track, index) => {
              e.preventDefault()
              openTrackContextMenu({ x: e.pageX, y: e.pageY, track, index, source: 'queue' })
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

        <div className='slider-container' style={{position: 'relative'}}>
          <div className={`slider-popup ${isDraggingVolume ? 'visible' : ''}`} style={{ left: `${sliderRange}%` }}>
            {Math.trunc(volume*100)}
          </div>
          <input 
            type="range" 
            className="volume-slider"
            min="0" 
            max="100"
            value={volume*100}
            onChange={handleVolumeChange}
            // onMouseDown={handleSliderMouseDown}
            // onMouseUp={handleSliderMouseUp}
            onMouseDown={() => setIsDraggingVolume(true)}
            onMouseUp={() => setIsDraggingVolume(false)}
          />
        </div>
        

        <div className='playback-controls'>
          <button className="control-btn" onClick={playPrev}>
            <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          <button className="play-btn" onClick={togglePlayPause}>
            {isPlaying ? <svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
          </button>
          <button className="control-btn" onClick={playNext}>
            <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6zm9-12v12h2V6z" color='var(--text-1)'/></svg>
          </button></div>
        
        <div className='player-img'>
            <span>🎵</span>
          </div>
        <div className="player-container">
          <button className="btn shuffle-btn">⇄</button>
          <div className="player-track">
            {currentTrack
              ? currentTrack.filename 
              : 'No track selected'}
          </div>
          <div className="player-info">
            {currentTrack?.artist ?
            currentTrack?.artist : 'Unknown Artist'}
            {' — '}
            {currentTrack?.album ?
            currentTrack.album : 'Unknown Album'}
            </div>
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
        
          <button 
            className="btn-primary" 
            onClick={() => setIsQueueOpen(!isQueueOpen)}
            style={{ backgroundColor: isQueueOpen ? 'var(--green-3)' : 'var(--gray-2)' }} // Turns green when open!
          >
            <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none">
              <path d="M8 6.00067L21 6.00139M8 12.0007L21 12.0015M8 18.0007L21 18.0015M3.5 6H3.51M3.5 12H3.51M3.5 18H3.51M4 6C4 6.27614 3.77614 6.5 3.5 6.5C3.22386 6.5 3 6.27614 3 6C3 5.72386 3.22386 5.5 3.5 5.5C3.77614 5.5 4 5.72386 4 6ZM4 12C4 12.2761 3.77614 12.5 3.5 12.5C3.22386 12.5 3 12.2761 3 12C3 11.7239 3.22386 11.5 3.5 11.5C3.77614 11.5 4 11.7239 4 12ZM4 18C4 18.2761 3.77614 18.5 3.5 18.5C3.22386 18.5 3 18.2761 3 18C3 17.7239 3.22386 17.5 3.5 17.5C3.77614 17.5 4 17.7239 4 18Z" stroke='var(--button-alt-text)' strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: isQueueOpen ? 'var(--brown-soft)' : 'var(--button-alt-text)' }}/>
            </svg>
          </button>
        <input type="text" className="search-input" placeholder="Search" />
      </header>

      <main className="main-content">
        {currentView.type === 'library' && (
          <>
            <LibraryView 
              tracks={tracks} 
              currentTrack={currentTrack} 
              isPlaying={isPlaying} 
              playTrack={playTrack} 

              onTrackContextMenu={(e, track, index) => {
                e.preventDefault()
                openTrackContextMenu({ x: e.pageX, y: e.pageY, track, index, source: 'queue' })
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
              onContextMenu={(e, pl) => {
                e.preventDefault()
                openPlaylistContextMenu({ x: e.pageX, y: e.pageY, playlist: pl })
              }}
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
            currentTrack={currentTrack} 
            isPlaying={isPlaying} 
            playTrack={playTrack} 
            onAddSongsClick={() => setIsAddSongsModalOpen(true)}
            onEditClick={() => setIsEditModalOpen(true)}
            onTrackContextMenu={(e, track, index) => {
                e.preventDefault()
                openTrackContextMenu({ x: e.pageX, y: e.pageY, track, index, source: 'playlist' })
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
        onRemoveFromPlaylist={handleRemoveTrackFromPlaylist}
        onDeleteFromLibrary={handleDeleteTrackFromLibrary}
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