import { useEffect } from 'react'
import { Playlist } from '../env'

export interface PlaylistMenuData {
  x: number
  y: number
  playlist: Playlist
}

interface PlaylistContextMenuProps {
  menuData: PlaylistMenuData | null
  onClose: () => void
  onPlay: (playlist: Playlist) => void
  onEdit: (playlist: Playlist) => void
  onDelete: (playlistId: number) => void
}

export default function PlaylistContextMenu({ 
  menuData, onClose, onPlay, onEdit, onDelete 
}: PlaylistContextMenuProps) {
  
  useEffect(() => {
    const handleClickOutside = () => onClose()
    if (menuData) document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [menuData, onClose])

  if (!menuData) return null

  const safeX = Math.min(menuData.x, window.innerWidth - 200) 
  const safeY = Math.min(menuData.y, window.innerHeight - 150)

  return (
    <div 
      className="context-menu" 
      style={{ top: safeY, left: safeX }}
      // @ts-expect-error onContextMenu is valid at runtime but not in React's type definitions
      onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => e.preventDefault()}
    >
      <div className="context-menu-item" onClick={() => { onPlay(menuData.playlist); onClose(); }}>
        Play Next
      </div>

      <div className="context-menu-item">
        Go to Playlist
      </div>
      
      <div className="context-menu-divider"></div>
      
      <div className="context-menu-item" onClick={() => { onEdit(menuData.playlist); onClose(); }}>
        Edit Details
      </div>

      <div className="context-menu-divider"></div>

      <div 
        className="context-menu-item danger" 
        onClick={() => { onDelete(menuData.playlist.id); onClose(); }}
      >
        Delete Playlist
      </div>
    </div>
  )
}