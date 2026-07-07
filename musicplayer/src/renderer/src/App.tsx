import { useState, useRef, useEffect, useCallback } from 'react'
import { Track, Playlist } from './env'

import LibraryView from './views/LibraryView'
import PlaylistsView from './views/PlaylistsView'
import PlaylistView from './views/PlaylistView'
import AlbumsView from './views/AlbumsView'

import NewPlaylistModal from './components/NewPlaylistModal'
import AddSongsModal from './components/AddSongsModal'
import EditPlaylistModal from './components/EditPlaylistModal'
import QueueSidebar from './components/QueueSidebar'
import TrackContextMenu, { TrackContextMenuData } from './components/TrackContextMenu'
import PlaylistContextMenu, { PlaylistMenuData } from './components/PlaylistContextMenu'
import { formatDuration } from './utilities/formatTime'
import SearchPopup from './components/SearchPopup'

type QueueNode<T> = {
  value: T
  next: QueueNode<T> | null
}

// this is lowkey a double ended queue and not a fifo- it was expanded after it's initital creation.
// as i attempt to implement shuffling i question why i made this queue to begin with. :(
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

  enqueueFront(value: T): void {
    const node: QueueNode<T> = {value, next: null}

    if (!this.head) {
      this.head = node
      this.tail = node
    } else {
      node.next = this.head
      this.head = node
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
  const [tracks, setTracks] = useState<Track[]>([]) // tracks currently in view
  const [libraryCount, setLibraryCount] = useState(0) // total library track count
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [playbackQueue, setPlaybackQueue] = useState<FIFOQueue<Track>>(new FIFOQueue<Track>())
  const [shuffledQueue, setShuffledQueue] = useState<Track[]>([])
  const [historyQueue, setHistoryQueue] = useState<FIFOQueue<Track>>(new FIFOQueue<Track>())
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [allTracks, setAllTracks] = useState<Track[]>([]) 

  // View states
  const [trackContextMenu, setTrackContextMenu] = useState<TrackContextMenuData | null>(null)
  const [playlistContextMenu, setPlaylistContextMenu] = useState<PlaylistMenuData | null>(null)
  const [isQueueOpen, setIsQueueOpen] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPlaylistsExpanded, setIsPlaylistsExpanded] = useState(false)
  const [isAddSongsModalOpen, setIsAddSongsModalOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [isSearchPopupOpen, setIsSearchPopupOpen] = useState(false)
  const [currentView, setCurrentView] = useState<ViewState>({ type: 'library' })
  const [isShuffled, setIsShuffled] = useState(false)

  // Audioplayer states
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMute, setIsMute] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState<number>(1)
  const [isDraggingVolume, setIsDraggingVolume] = useState(false)
  const [duration, setDuration] = useState(0)
  const [isSeeking, setIsSeeking] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const prevVolumeRef = useRef<number>(1)

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

  const handleScanFolder = async (): Promise<number[]> => {
    try {
      const previousTrackIds = new Set(allTracks.map((track) => track.id))
      const importedTracks = await window.api.selectFolder()
      if (!importedTracks?.length) return []

      const updatedLibrary = await window.api.getLibrary()
      const newlyImportedIds = (updatedLibrary || [])
        .filter((track) => !previousTrackIds.has(track.id))
        .map((track) => track.id)

      setAllTracks(updatedLibrary || [])
      setLibraryCount((updatedLibrary || []).length)

      return newlyImportedIds
    } catch (error) {
      console.error("Failed to import folder:", error)
      return []
    }
  }

  
  const handleScanFiles = async () : Promise<number[]> => {
    try {
      const previousTrackIds = new Set(allTracks.map((track) => track.id))
      const importedTracks = await window.api.selectFiles()
      if (!importedTracks?.length) return []

      const updatedLibrary = await window.api.getLibrary()
      const newlyImportedIds = (updatedLibrary || [])
        .filter((track) => !previousTrackIds.has(track.id))
        .map((track) => track.id)

      setAllTracks(updatedLibrary || [])
      setLibraryCount((updatedLibrary || []).length)

      return newlyImportedIds
    } catch (error) {
      console.error("Failed to import tracks:", error)
      return []
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

  const handleClearQueueOrHistory = (target: 'queue' | 'history') => {
    if (target === 'history') {
      setHistoryQueue(new FIFOQueue<Track>())
    } else {
      setPlaybackQueue(new FIFOQueue<Track>())
    }
  }

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    setIsSearchPopupOpen(value.trim() !== '');
  }

  const toggleMute = useCallback(() => {
    if (isMute) {
      // Unmute: restore previous volume
      setVolume(prevVolumeRef.current)
      if (audioRef.current) {
        audioRef.current.volume = prevVolumeRef.current
      }
      setIsMute(false)
    } else {
      // Mute: save current volume and set to 0
      prevVolumeRef.current = volume
      setVolume(0)
      if (audioRef.current) {
        audioRef.current.volume = 0
      }
      setIsMute(true)
    }
  }, [isMute])

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    if (!currentTrack && (playbackQueue.length!==0)) {
      playNext();
    } else if (!currentTrack && (playbackQueue.length===0)) {
      return;
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch(err => console.error("Playback error:", err))
      setIsPlaying(true)
    }
  }, [isPlaying])

  // Listen for menu requests from the Electron app
  useEffect(() => {
    window.api.onScanFolder(() => handleScanFolder())
  }, [handleScanFolder])

  useEffect(() => {
    window.api.onCreatePlaylist(() => setIsModalOpen(true))
  }, [])

  useEffect(() => {
    window.api.onImportFile(() => {
      void handleScanFiles()
    })
  }, [handleScanFiles])

  useEffect(() => {
    window.api.onPlayPause(() => {togglePlayPause()
    })
  }, [togglePlayPause])

  useEffect(() => {
    window.api.onNextTrack(() => playNext())
  }, [])

  useEffect(() => {
    window.api.onPrevTrack(() => playPrev())
  }, [])

  useEffect(() => {
    window.api.onToggleMute(() => toggleMute())
  }, [toggleMute])

  // Queue Controls

  const startPlaybackWithQueue = (track: Track | null, nextQueue: FIFOQueue<Track>) => {
    setPlaybackQueue(nextQueue)
    setCurrentTrack(track)
    setCurrentTime(0)
    setDuration(0)
  }

  // function for ADDING track to the front of the queue
  const handlePlayNext = (track: Track) => {
    setPlaybackQueue((prev) => {
      const next = prev.clone()
      next.enqueueFront(track)
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

  const handleAddToPlaylist = async (playlistId: number, trackId: number) => {
    try {
      await window.api.addTracksToPlaylist(playlistId, [trackId])
    } catch (error) {
      console.error("Failed to add track to playlist:", error)
    }
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
    // Unmute if user adjusts volume while muted
    if (isMute && newVolume > 0) {
      setIsMute(false)
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
    startPlaybackWithQueue(track, new FIFOQueue<Track>())
  }

  // play next button
  const playNext = () => {
    if (currentTrack) {
      setHistoryQueue((prev) => {
        const next = prev.clone()
        next.enqueue(currentTrack)
        return next
      })
    }

    const nextTrack = playbackQueue.dequeue()
    if (!nextTrack) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.removeAttribute('src');
      }
      setCurrentTrack(null);
      setIsPlaying(false);
      return;
    }

    setCurrentTrack(nextTrack);
    setCurrentTime(0);
    setDuration(0);
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

  const shuffle = () => {
    const tracks = playbackQueue.toArray()
    // Fisher-Yates Algorithm :)
    for (let i: number = tracks.length - 1; i > 0; --i) {
      let j: number = Math.floor(Math.random() * (i+1)); // Math.random() returns number [0,1]
      [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
    }
    setShuffledQueue(tracks)
    setIsShuffled(!isShuffled) // toggle isShuffled flag
  }

  const queueItems = playbackQueue.toArray()
  const sliderRange = (volume*100 + 5) / (110) * 100;

  return (
    <div className="app-container">
      <nav className="sidebar">
        <h2>Library</h2>
        <ul>
          <li onClick={() => setCurrentView({type: 'library'})}>
            <svg viewBox="-5.5 0 32 32" style={{stroke: 'transparent'}}><path d="M5.688 9.656v10.906c-.469-.125-.969-.219-1.406-.219-1 0-2.031.344-2.875.906S.001 22.718.001 23.78c0 1.125.563 1.969 1.406 2.531s1.875.875 2.875.875c.938 0 2-.313 2.844-.875s1.375-1.406 1.375-2.531V12.342l9.531-2.719v7.531a5.5 5.5 0 0 0-1.438-.188c-.969 0-2.031.281-2.875.844s-1.375 1.469-1.375 2.531c0 1.125.531 2 1.375 2.531.844.563 1.906.906 2.875.906.938 0 2.031-.344 2.875-.906.875-.531 1.406-1.406 1.406-2.531V5.935c0-.688-.469-1.156-1.156-1.156-.063 0-.438.125-1.031.281-1.25.344-3.125.875-5.25 1.5-1.094.281-2.063.594-3.031.844-.938.281-1.75.563-2.469.75-.75.219-1.219.344-1.406.406-.5.156-.844.594-.844 1.094z"/></svg>
            All Songs ({libraryCount})</li>
          <li style={{padding:'0px'}}>
            <li style={{width: '100%'}} onClick={() => setCurrentView({type: 'playlists'})}>
              <svg viewBox="0 0 24 24" fill="none" ><path d="M4 7h16M5 4h14M6.896 20h10.208c1.024 0 1.535 0 1.94-.192a2 2 0 0 0 .86-.778c.232-.385.283-.894.384-1.912l.448-4.48c.092-.914.138-1.37-.012-1.724a1.5 1.5 0 0 0-.66-.73C19.727 10 19.267 10 18.348 10H5.652c-.919 0-1.378 0-1.715.184a1.5 1.5 0 0 0-.66.73c-.15.353-.104.81-.013 1.725l.448 4.48c.102 1.017.153 1.526.384 1.911a2 2 0 0 0 .86.778c.406.192.917.192 1.94.192M15 15c0 1.105-1.343 2-3 2-1.656 0-3-.895-3-2s1.344-2 3-2c1.657 0 3 .895 3 2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Playlists ({playlists.length})
            </li>
            <button className="dropdown-toggle" onClick={() => setIsPlaylistsExpanded(!isPlaylistsExpanded)}>
              <span className={`dropdown-arrow ${isPlaylistsExpanded ? 'open' : ''}`}>
                ▼
              </span>
            </button>
          </li>
          {isPlaylistsExpanded && (
            <div className="sidebar-dropdown">
              <ul className="dropdown-list">
                {playlists.map(pl => (
                  <li
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
                    <div style={{ textOverflow:'ellipsis', overflow:'hidden'}}>{pl.name}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <li onClick={() => setCurrentView({type: 'albums'})}>
            <svg viewBox="0 0 24 24" style={{stroke: 'transparent'}}><path fill="none" d="M0 0h24v24H0z"/><path d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2m0 14c2.213 0 4-1.787 4-4s-1.787-4-4-4-4 1.787-4 4 1.787 4 4 4m0-5c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1"/></svg>
            Albums
          </li>
          <li>
            <svg viewBox="0 0 512 512" style={{padding:'2px'}}><path d="M470.694 41.306C444.056 14.669 408.64 0 370.97 0s-73.086 14.669-99.723 41.306c-26.638 26.635-41.307 62.052-41.307 99.723 0 1.818.045 3.631.113 5.438L44.616 363.886c-21.623 24.583-23.844 60.029-7.31 86.872L0 488.067 23.934 512l37.313-37.314c11.738 7.23 25.113 10.889 38.516 10.889 17.227-.001 34.485-6.017 48.309-18.157l217.459-185.472c1.807.069 3.619.114 5.438.114 37.662 0 73.07-14.664 99.706-41.291l.019-.017c26.635-26.635 41.305-62.051 41.306-99.722 0-37.672-14.669-73.087-41.306-99.724M126.01 441.749l-.211.183c-15.575 13.734-39.294 12.969-53.999-1.734-14.707-14.705-15.467-38.427-1.732-54L238.272 188.99c6.939 19.238 18.086 36.872 32.975 51.761 14.891 14.891 32.525 26.037 51.761 32.978zm244.959-193.537c-28.629 0-55.544-11.15-75.788-31.394s-31.393-47.16-31.393-75.789c0-8.144.905-16.147 2.662-23.898 10.265 25.172 28.821 51.911 52.665 75.754s50.582 42.4 75.755 52.666a108 108 0 0 1-23.901 2.661m75.791-31.394c-5.438 5.438-19.232 4.912-36-1.376-21.578-8.092-46.258-25.037-67.712-46.49-21.453-21.453-38.398-46.134-46.49-67.712-6.288-16.767-6.815-30.562-1.376-36 20.244-20.243 47.159-31.392 75.789-31.392s55.545 11.149 75.791 31.392c20.243 20.244 31.392 47.16 31.392 75.79-.001 28.629-11.15 55.544-31.394 75.788"/><path d="m191.47 296.6 47.866-47.867 23.934 23.934-47.867 47.867z"/></svg>
            Artists
          </li>
        </ul>
      </nav>
      <nav className={isQueueOpen ? 'sidebar sidebar-queue' : 'sidebar sidebar-queue-closed'}>
        <QueueSidebar
            isOpen={isQueueOpen} 
            queue={queueItems} 
            historyQueue={historyQueue.toArray()}
            shuffledQueue={shuffledQueue}
            isShuffled={isShuffled}
            currentTrack={currentTrack} 
            onClose={() => setIsQueueOpen(false)}
            onPlayTrack={(index) => {
              const queueTrack = queueItems[index]
              if (queueTrack) {
                const remainingQueue = new FIFOQueue<Track>()
                queueItems.slice(index + 1).forEach((track) => remainingQueue.enqueue(track))

                if (currentTrack) {
                  setHistoryQueue((prev) => {
                    const updated = prev.clone()
                    updated.enqueue(currentTrack)
                    return updated
                  })
                }

                setPlaybackQueue(remainingQueue)
                setCurrentTrack(queueTrack)
                setCurrentTime(0)
                setDuration(0)
              }
            }}

            onContextMenu={(e, track, index) => {
              e.preventDefault()
              openTrackContextMenu({ x: e.pageX, y: e.pageY, track, index, source: 'queue' })
            }}
            onClear={handleClearQueueOrHistory}
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
        <button className='control-btn' style={{ fill: 'transparent', padding: '2px', marginRight: '6px'}} onClick={toggleMute}>
          <svg viewBox="0 0 24 24">
            {isMute ? (
              <path d="M22 9L16 15M16 9L22 15M3 10.5V13.5C3 14.6046 3.5 15.5 5.5 16C7.5 16.5 9 21 12 21C14 21 14 3 12 3C9 3 7.5 7.5 5.5 8C3.5 8.5 3 9.39543 3 10.5Z"/>
            ) : (
              <path d="M19 6C20.5 7.5 21 10 21 12C21 14 20.5 16.5 19 18M16 8.99998C16.5 9.49998 17 10.5 17 12C17 13.5 16.5 14.5 16 15M3 10.5V13.5C3 14.6046 3.5 15.5 5.5 16C7.5 16.5 9 21 12 21C14 21 14 3 12 3C9 3 7.5 7.5 5.5 8C3.5 8.5 3 9.39543 3 10.5Z"/>            )}
          </svg>
        </button>
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
            onMouseDown={() => setIsDraggingVolume(true)}
            onMouseUp={() => setIsDraggingVolume(false)}
            style={{
              background: `linear-gradient(to right, var(--gray-1) 0%, var(--gray-1) ${volume*100}%, var(--gray-2) ${volume*100}%, var(--gray-2) 100%)`
            }}
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
          </button>
        </div>
        <div className='player-img'>
            {currentTrack?.album_image_path ? (
              <img 
                src={`local://stream?path=${encodeURIComponent(currentTrack.album_image_path.replace(/\\/g, '/'))}`}
                alt="album art"
              />
            ) : (
              <span>🎵</span>
            )}
          </div>
        <div className="player-container">
          <button className="btn control-btn shuffle-btn" style={{ padding: '1px', backgroundColor: isShuffled ? 'var(--green-3)' : ''}} onClick={shuffle}>
            <svg viewBox="0 0 24 24" fill="none"><path d="M3 17h2.735a4 4 0 0 0 3.43-1.942l3.67-6.116A4 4 0 0 1 16.265 7H21m0 0-2-2m2 2-2 2M3 7h2.735a4 4 0 0 1 2.871 1.215M21 17h-4.735a4 4 0 0 1-2.871-1.215M21 17l-2 2m2-2-2-2"stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
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
          <button className="btn control-btn repeat-btn" style={{ padding: '2px'}}>
            <svg viewBox="0 0 24 24" fill="none"><g clip-path="url(#a)" stroke-width="2" stroke-linecap="round"><path d="m19 5 2 2m0 0-2 2m2-2H7M5 19l-2-2m0 0 2-2m-2 2h14" stroke-linejoin="round"/><path d="M3 11a4 4 0 0 1 4-4m14 6a4 4 0 0 1-4 4"/></g></svg>
          </button>
          <span className="player-time player-time-current">{formatDuration(currentTime)}</span>
          <input 
            type="range" 
            className="player-slider"
            min="0" 
            max={duration} 
            value={currentTime}
            onChange={handleSliderChange}
            onMouseDown={handleSliderMouseDown}
            onMouseUp={handleSliderMouseUp}
            style={{
              background: `linear-gradient(to right, var(--gray-1) 0%, var(--gray-1) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, var(--gray-2) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, var(--gray-2) 100%)`
            }}
          />
          <span className="player-time player-time-duration">-{formatDuration(duration-currentTime)}</span>
        </div>
          <button 
            className="btn-primary" 
            onClick={() => setIsQueueOpen(!isQueueOpen)}
            style={{ backgroundColor: isQueueOpen ? 'var(--green-3)' : 'var(--gray-2)' }}
          >
            <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none">
              <path d="M8 6.00067L21 6.00139M8 12.0007L21 12.0015M8 18.0007L21 18.0015M3.5 6H3.51M3.5 12H3.51M3.5 18H3.51M4 6C4 6.27614 3.77614 6.5 3.5 6.5C3.22386 6.5 3 6.27614 3 6C3 5.72386 3.22386 5.5 3.5 5.5C3.77614 5.5 4 5.72386 4 6ZM4 12C4 12.2761 3.77614 12.5 3.5 12.5C3.22386 12.5 3 12.2761 3 12C3 11.7239 3.22386 11.5 3.5 11.5C3.77614 11.5 4 11.7239 4 12ZM4 18C4 18.2761 3.77614 18.5 3.5 18.5C3.22386 18.5 3 18.2761 3 18C3 17.7239 3.22386 17.5 3.5 17.5C3.77614 17.5 4 17.7239 4 18Z" stroke='var(--button-alt-text)' strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: isQueueOpen ? 'var(--brown-soft)' : 'var(--button-alt-text)' }}/>
            </svg>
          </button>
          <div className='slider-container'>
            <input type="text" className="search-input" placeholder="Search" value={searchText} onChange={handleSearchInputChange}/> 
            <SearchPopup
            isOpen={isSearchPopupOpen}
            onClose={() => {
              setIsSearchPopupOpen(false)
              setSearchText('')}}
            searchQuery={searchText}
            library={allTracks}
            />
          </div>
        
      </header>

      <main className="main-content">
        {currentView.type === 'library' && (
          <>
            <LibraryView 
              tracks={tracks} 
              currentTrack={currentTrack} 
              isPlaying={isPlaying} 
              playTrack={playTrack} 
              onImportFiles={handleScanFiles}
              onImportFolder={handleScanFolder}
              onTrackContextMenu={(e, track, index) => {
                e.preventDefault()
                openTrackContextMenu({ x: e.pageX, y: e.pageY, track, index, source: 'queue' })
              }}
            />
          </>
        )}

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

        {currentView.type === 'albums' && (
          <>
            <AlbumsView 
              tracks={tracks} 
              currentTrack={currentTrack} 
              isPlaying={isPlaying} 
              playTrack={playTrack} 
              onImportFiles={handleScanFiles}
              onImportFolder={handleScanFolder}
              onTrackContextMenu={(e, track, index) => {
                e.preventDefault()
                openTrackContextMenu({ x: e.pageX, y: e.pageY, track, index, source: 'queue' })
              }}
            />
          </>
        )}

      </main>

      <TrackContextMenu 
        menuData={trackContextMenu}
        onClose={() => setTrackContextMenu(null)}
        onPlayNext={handlePlayNext}
        onAddToQueue={handleAddToQueue}
        playlists={playlists}
        onAddToPlaylist={handleAddToPlaylist}
        onRemoveFromPlaylist={handleRemoveTrackFromPlaylist}
        onDeleteFromLibrary={handleDeleteTrackFromLibrary}
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
        onImportFiles={handleScanFiles}
        onImportFolder={handleScanFolder}
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