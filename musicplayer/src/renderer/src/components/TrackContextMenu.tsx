import { useEffect } from 'react'
import { Track } from '../env'

export interface TrackContextMenuData {
  x: number
  y: number
  track: Track
  index: number
  source: 'library' | 'playlist' | 'queue'
}

interface TrackContextMenuProps {
  menuData: TrackContextMenuData | null
  onClose: () => void
  onPlayNext: (track: Track) => void
  onAddToQueue: (track: Track) => void
  onRemoveFromQueue?: (index: number) => void
}

export default function TrackContextMenu({ 
  menuData, 
  onClose, 
  onPlayNext, 
  onAddToQueue, 
  onRemoveFromQueue 
}: TrackContextMenuProps) {
  
  // Automatically close the menu if the user clicks ANYWHERE else on the screen
  useEffect(() => {
    const handleClickOutside = () => onClose()
    if (menuData) {
      document.addEventListener('click', handleClickOutside)
    }
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [menuData, onClose])

  if (!menuData) return null

  const safeX = Math.min(menuData.x, window.innerWidth - 200) 
  const safeY = Math.min(menuData.y, window.innerHeight - 200)

  return (
    <div 
      className="context-menu" 
      style={{ top: safeY, left: safeX }}
      // @ts-expect-error onContextMenu is valid at runtime but not in React's type definitions
      onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => e.preventDefault()}
    >
      <div className="context-menu-item" onClick={() => onPlayNext(menuData.track)}>
        Play Next
      </div>
      <div className="context-menu-item" onClick={() => onAddToQueue(menuData.track)}>
        Add to Queue
      </div>
      
      <div className="context-menu-divider"></div>
      
      <div className="context-menu-item" onClick={() => console.log("Open Add to Playlist Modal")}>
        Add to Playlist...
      </div>

      {/* Only show "Remove" if we right-clicked inside the queue! */}
      {menuData.source === 'queue' && onRemoveFromQueue && (
        <>
          <div className="context-menu-divider"></div>
          <div 
            className="context-menu-item danger" 
            onClick={() => onRemoveFromQueue(menuData.index)}
          >
            Remove from Queue
          </div>
        </>
      )}
    </div>
  )
}