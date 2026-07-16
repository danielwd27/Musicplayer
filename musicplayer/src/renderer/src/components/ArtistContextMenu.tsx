import { useEffect } from "react";
import { Artist } from "../env";

export interface ArtistMenuData {
  x: number;
  y: number;
  artist: Artist;
}

interface ArtistContextMenuProps {
  menuData: ArtistMenuData | null;
  onClose: () => void;
  onPlay: (artist: Artist) => void;
  onVisit: (artist: Artist) => void;
  onEdit?: (artist: Artist) => void;
}

export default function ArtistContextMenu({
  menuData,
  onClose,
  onPlay,
  onVisit,
  onEdit,
}: ArtistContextMenuProps) {
  useEffect(() => {
    const handleClickOutside = () => onClose();
    if (menuData) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuData, onClose]);

  if (!menuData) return null;

  const safeX = Math.min(menuData.x, window.innerWidth - 200);
  const safeY = Math.min(menuData.y, window.innerHeight - 150);

  return (
    <div
      className="context-menu"
      style={{ top: safeY, left: safeX }}
      onContextMenu={(e: React.MouseEvent<HTMLDivElement>) =>
        e.preventDefault()
      }
    >
      <div
        className="context-menu-item"
        onClick={() => {
          onPlay(menuData.artist);
          onClose();
        }}
      >
        Play Next
      </div>

      <div
        className="context-menu-item"
        onClick={() => {
          onVisit(menuData.artist);
          onClose();
        }}
      >
        Go to Artist
      </div>

      {onEdit && (
        <>
          <div className="context-menu-divider"></div>
          <div
            className="context-menu-item"
            onClick={() => {
              onEdit(menuData.artist);
              onClose();
            }}
          >
            Edit Details
          </div>
        </>
      )}
    </div>
  );
}
