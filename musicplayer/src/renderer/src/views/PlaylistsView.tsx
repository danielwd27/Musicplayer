import React, { useLayoutEffect, useRef, useState } from "react";
import { Playlist } from "../env";

function PlaylistTagChips({ tags }: { tags: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const moreMeasureRef = useRef<HTMLSpanElement>(null);
  const [visibleCount, setVisibleCount] = useState(tags.length);

  useLayoutEffect(() => {
    const updateVisibleTags = () => {
      const container = containerRef.current;
      const measure = measureRef.current;
      const moreMeasure = moreMeasureRef.current;
      if (!container || !measure || !moreMeasure) return;

      const availableWidth = container.clientWidth;
      const chipWidths = Array.from(measure.children)
        .slice(0, tags.length)
        .map((child) => (child as HTMLElement).offsetWidth);
      const gap = 6;

      let nextVisibleCount = tags.length;

      for (let count = tags.length; count >= 0; count -= 1) {
        const hiddenCount = tags.length - count;
        const visibleWidth =
          chipWidths.slice(0, count).reduce((sum, width) => sum + width, 0) +
          Math.max(count - 1, 0) * gap;

        moreMeasure.textContent = `+${hiddenCount}`;
        const overflowWidth =
          hiddenCount > 0 ? moreMeasure.offsetWidth + (count > 0 ? gap : 0) : 0;

        if (visibleWidth + overflowWidth <= availableWidth) {
          nextVisibleCount = count;
          break;
        }
      }

      setVisibleCount(nextVisibleCount);
    };

    updateVisibleTags();

    const resizeObserver = new ResizeObserver(updateVisibleTags);
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [tags]);

  const hiddenCount = tags.length - visibleCount;

  if (tags.length === 0) return null;

  return (
    <div ref={containerRef} className="tag-list tag-list-single-line">
      {tags.slice(0, visibleCount).map((tag) => (
        <span key={tag} className="tag-chip">
          {tag}
        </span>
      ))}
      {hiddenCount > 0 && <span className="tag-chip">+{hiddenCount}</span>}

      <div
        ref={measureRef}
        className="tag-list"
        style={{
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          height: 0,
          overflow: "hidden",
        }}
      >
        {tags.map((tag) => (
          <span key={tag} className="tag-chip">
            {tag}
          </span>
        ))}
        <span ref={moreMeasureRef} className="tag-chip">
          +0
        </span>
      </div>
    </div>
  );
}

interface PlaylistsViewProps {
  playlists: Playlist[];
  onOpenPlaylist: (playlist: Playlist) => void;
  onNewPlaylist: () => void;
  onContextMenu?: (e: React.MouseEvent, playlist: Playlist) => void;
}

export default function PlaylistsView({
  playlists,
  onOpenPlaylist,
  onNewPlaylist,
  onContextMenu,
}: PlaylistsViewProps) {
  const [sortByTag, setSortByTag] = useState(false);

  const getPlaylistTags = (playlist: Playlist) =>
    playlist.tag
      ?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean) || [];

  const sortedPlaylists = playlists.toSorted((a, b) => {
    if (sortByTag) {
      const tagCompare = (getPlaylistTags(a)[0] || "").localeCompare(
        getPlaylistTags(b)[0] || "",
      );
      return tagCompare || a.name.localeCompare(b.name);
    }

    return a.name.localeCompare(b.name);
  });

  const playlistGroups = sortedPlaylists
    .reduce<Array<{ label: string; playlists: Playlist[] }>>(
      (groups, playlist) => {
        if (!sortByTag) return groups;

        const tags = getPlaylistTags(playlist);
        const groupLabels = tags.length > 0 ? tags : [""];

        groupLabels.forEach((label) => {
          const existingGroup = groups.find((group) => group.label === label);

          if (existingGroup) {
            existingGroup.playlists.push(playlist);
          } else {
            groups.push({ label, playlists: [playlist] });
          }
        });

        return groups;
      },
      [],
    )
    .toSorted((a, b) => a.label.localeCompare(b.label));

  const renderPlaylistCard = (pl: Playlist) => (
    <div
      key={pl.id}
      className="album-card"
      onClick={() => onOpenPlaylist(pl)}
      onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        onContextMenu?.(e, pl);
      }}
    >
      <div className="card-image">
        {pl.cover_image_path ? (
          <img
            src={`local://stream?path=${encodeURIComponent(pl.cover_image_path.replace(/\\/g, "/"))}`}
            // className="card-image"
            alt={pl.name}
          />
        ) : (
          <div>🎵</div>
        )}
      </div>

      <div className="item-title">{pl.name}</div>
      <PlaylistTagChips tags={getPlaylistTags(pl)} />
    </div>
  );

  return (
    <div>
      <div className="header">
        <h1>Playlists</h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <button
            className={sortByTag ? "btn-primary" : "btn-light"}
            onClick={() => setSortByTag((prev) => !prev)}
          >
            Tag
          </button>
          <button onClick={onNewPlaylist} className="btn">
            + New
          </button>
          <button className="btn">Edit</button>
        </div>
      </div>

      {playlists.length === 0 ? (
        <p style={{ color: "var(--text-3)" }}>
          You haven't created any playlists yet.
        </p>
      ) : sortByTag ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {playlistGroups.map(({ label, playlists: groupPlaylists }) => (
            <section key={label}>
              {label && (
                <h2
                  className="text-soft"
                  style={{ margin: "0 0 12px", fontSize: "20px" }}
                >
                  {label}
                </h2>
              )}
              <div className="albums-grid">
                {groupPlaylists.map(renderPlaylistCard)}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="albums-grid">
          {sortedPlaylists.map(renderPlaylistCard)}
        </div>
      )}
    </div>
  );
}
