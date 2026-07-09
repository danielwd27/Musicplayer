import { useEffect } from 'react'
import { Album } from '../env'

export interface AlbumMenuData {
  x: number
  y: number
  album: Album
}

interface AlbumContextMenuProps {
  menuData: AlbumMenuData | null
  onClose: () => void
  onPlay: (album: Album) => void
  // onEdit: (playlist: Album) => void
  onVisit: (album: Album) => void
  onDelete: (album: number) => void
}

export default function AlbumContextMenu({ 
  menuData, onClose, onPlay, onVisit, onDelete 
}: AlbumContextMenuProps) {
  
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
      <div className="context-menu-item" onClick={() => { onPlay(menuData.album); onClose(); }}>
        Play Next
      </div>

      <div className="context-menu-item" onClick={() => { onVisit(menuData.album); onClose(); }}>
        Go to Album
      </div>
      
      <div className="context-menu-divider"></div>
      
      {/* <div className="context-menu-item" onClick={() => { onEdit(menuData.album); onClose(); }}>
        Edit Details
      </div> */}

      <div className="context-menu-divider"></div>

      <div 
        className="context-menu-item danger" 
        onClick={() => { onDelete(menuData.album.id); onClose(); }}
      >
        Delete Album
      </div>
    </div>
  )
}