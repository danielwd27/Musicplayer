import React from "react";
import { Album, Artist, Track } from "../env";
import {
  formatDuration,
  formatPlaylistDuration,
} from "@renderer/utilities/formatting";

interface ArtistsViewProps {
  artists: Artist[];
  selectedArtist?: Artist;
  selectedArtistAlbums?: Album[];
  selectedArtistTracks?: Track[];
  currentTrack?: Track | null;
  playTrack: (track: Track) => void;
  onSelectTrack: (track: Track) => void;
  onPlayTrackWithQueue?: (track: Track, index: number) => void;
  onOpenAlbum: (album: Album) => void;
  onOpenTrackAlbum: (track: Track) => void;
  onAlbumContextMenu: (e: React.MouseEvent, album: Album) => void;
  onOpenArtist: (artist: Artist) => void;
  onArtistContextMenu: (e: React.MouseEvent, artist: Artist) => void;
  onEditArtist: (artist: Artist) => void;
  onBackToArtists?: () => void;
  onTrackContextMenu: (
    e: React.MouseEvent,
    track: Track,
    index: number,
  ) => void;
}

const getArtistLetter = (artistName: string): string => {
  const firstCharacter = artistName.trim().charAt(0).toUpperCase();
  return /^[A-Z]$/.test(firstCharacter) ? firstCharacter : "#";
};

const alphabetizeArtists = (artists: Artist[]) => {
  return [...artists].sort((a, b) => {
    const firstName = a.sort_name || a.name;
    const secondName = b.sort_name || b.name;
    return firstName.localeCompare(secondName, undefined, {
      sensitivity: "base",
    });
  });
};

const groupArtistsByLetter = (artists: Artist[]) => {
  return alphabetizeArtists(artists).reduce<Record<string, Artist[]>>(
    (groups, artist) => {
      const letter = getArtistLetter(artist.sort_name || artist.name);
      groups[letter] = groups[letter] || [];
      groups[letter].push(artist);
      return groups;
    },
    {},
  );
};

export default function ArtistsView({
  artists,
  selectedArtist,
  selectedArtistAlbums = [],
  selectedArtistTracks = [],
  currentTrack,
  playTrack,
  onSelectTrack,
  onPlayTrackWithQueue,
  onOpenAlbum,
  onOpenTrackAlbum,
  onAlbumContextMenu,
  onOpenArtist,
  onArtistContextMenu,
  onEditArtist,
  onBackToArtists,
  onTrackContextMenu,
}: ArtistsViewProps) {
  const groupedArtists = groupArtistsByLetter(artists);
  const sectionLetters = Object.keys(groupedArtists).sort((a, b) => {
    if (a === "#") return 1;
    if (b === "#") return -1;
    return a.localeCompare(b);
  });

  if (selectedArtist) {
    return (
      <div>
        <div className="header">
          <button className="btn-light" onClick={onBackToArtists}>
            Back to Artists
          </button>
          <button className="btn" onClick={() => onEditArtist(selectedArtist)}>
            Edit Details
          </button>
        </div>

        <div
          className="header"
          style={{ justifyContent: "flex-start", gap: "30px" }}
          onContextMenu={(e) => onArtistContextMenu(e, selectedArtist)}
        >
          <div className="card-image album-art-large artist-image">
            {selectedArtist.artist_image_path ? (
              <img
                src={`local://stream?path=${encodeURIComponent(selectedArtist.artist_image_path.replace(/\\/g, "/"))}`}
                alt={selectedArtist.name}
              />
            ) : (
              <span>🎤</span>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="text-soft">Artist</div>
            <h1 style={{ fontSize: "48px", margin: "6px 0" }}>
              {selectedArtist.name}
            </h1>
            <div className="text-soft">
              {selectedArtist.album_count || 0}{" "}
              {(selectedArtist.album_count || 0) === 1 ? "album" : "albums"}
              {" • "}
              {selectedArtist.track_count || 0}{" "}
              {(selectedArtist.track_count || 0) === 1 ? "song" : "songs"}
              {selectedArtist.total_duration
                ? ` • ${formatPlaylistDuration(selectedArtist.total_duration)}`
                : ""}
            </div>
            {selectedArtist.description && (
              <p className="artist-description">{selectedArtist.description}</p>
            )}
          </div>
        </div>

        {selectedArtistAlbums.length > 0 && (
          <section className="artist-detail-section">
            <div className="header artist-detail-header">
              <h2>Albums</h2>
              <div className="text-soft">
                {selectedArtistAlbums.length}{" "}
                {selectedArtistAlbums.length === 1 ? "album" : "albums"}
              </div>
            </div>

            <div className="albums-grid">
              {selectedArtistAlbums.map((album) => (
                <div
                  key={album.id}
                  className="album-card"
                  onClick={() => onOpenAlbum(album)}
                  onContextMenu={(e) => onAlbumContextMenu(e, album)}
                >
                  <div className="card-image">
                    {album.cover_image_path ? (
                      <img
                        src={`local://stream?path=${encodeURIComponent(album.cover_image_path.replace(/\\/g, "/"))}`}
                        alt={album.title}
                      />
                    ) : (
                      <span>🎵</span>
                    )}
                  </div>
                  <div className="item-title" title={album.title}>
                    {album.title}
                  </div>
                  <div className="text-soft">
                    {album.year ? `${album.year} • ` : ""}
                    {album.track_count || 0}{" "}
                    {(album.track_count || 0) === 1 ? "song" : "songs"}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        <section className="artist-detail-section">
          <div className="header artist-detail-header">
            <h2>Songs</h2>
            <div className="text-soft">
              {selectedArtistTracks.length}{" "}
              {selectedArtistTracks.length === 1 ? "song" : "songs"}
            </div>
          </div>

          {selectedArtistTracks.length === 0 ? (
            <p style={{ color: "var(--text-3)" }}>
              No songs found for this artist.
            </p>
          ) : (
            <div className="track-list">
              {selectedArtistTracks.map((track, index) => (
                <div
                  key={`${track.id}-${index}`}
                  className={`track-item ${currentTrack?.id === track.id ? "active" : ""}`}
                  onClick={() => onSelectTrack(track)}
                  onDoubleClick={() =>
                    onPlayTrackWithQueue
                      ? onPlayTrackWithQueue(track, index)
                      : playTrack(track)
                  }
                  onContextMenu={(e: React.MouseEvent<HTMLDivElement>) =>
                    onTrackContextMenu(e, track, index)
                  }
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span className="text-soft track-item-index">
                    {currentTrack?.id === track.id ? "▶" : index + 1}
                  </span>
                  <div className="track-album-art">
                    {track.album_image_path ? (
                      <img
                        src={`local://stream?path=${encodeURIComponent(track.album_image_path.replace(/\\/g, "/"))}`}
                        alt={track.album || track.title || track.filename}
                      />
                    ) : (
                      <span>🎵</span>
                    )}
                  </div>
                  <span className="item-title" style={{ width: "20%" }}>
                    {track.title || track.filename}
                  </span>
                  <span className="text-soft track-item-metadata">
                    <button
                      type="button"
                      className="metadata-link"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTrackAlbum(track);
                      }}
                      onDoubleClick={(e) => e.stopPropagation()}
                      disabled={!track.album}
                      title="Open album page"
                    >
                      {track.album || "Unknown Album"}
                    </button>
                    <span>{track.year}</span>
                  </span>
                  <span className="text-soft track-duration">
                    {formatDuration(track.duration)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }
  return (
    <div>
      <div className="header">
        <h1>Artists</h1>
        <div className="text-soft">
          {artists.length} {artists.length === 1 ? "artist" : "artists"}
        </div>
      </div>

      {artists.length === 0 ? (
        <p style={{ color: "var(--text-3)" }}>
          You haven't imported any artists yet.
        </p>
      ) : (
        <>
          <nav
            className="artist-letter-nav"
            aria-label="Artist letter navigation"
          >
            {sectionLetters.map((letter) => (
              <a
                key={letter}
                href={`#artists-${letter === "#" ? "number" : letter}`}
              >
                {letter}
              </a>
            ))}
          </nav>

          <div className="artists-list">
            {sectionLetters.map((letter) => (
              <section
                key={letter}
                id={`artists-${letter === "#" ? "number" : letter}`}
                className="artist-section"
              >
                <h2 className="artist-section-heading">{letter}</h2>
                <div className="artist-section-list">
                  {groupedArtists[letter].map((artist) => (
                    <button
                      type="button"
                      key={artist.id}
                      className="artist-list-item"
                      onClick={() => onOpenArtist(artist)}
                      onContextMenu={(e) => onArtistContextMenu(e, artist)}
                    >
                      <div className="track-album-art artist-image">
                        {artist.artist_image_path ? (
                          <img
                            src={`local://stream?path=${encodeURIComponent(artist.artist_image_path.replace(/\\/g, "/"))}`}
                            alt={artist.name}
                          />
                        ) : (
                          <span>🎤</span>
                        )}
                      </div>
                      <div className="artist-list-main">
                        <div className="item-title">{artist.name}</div>
                        <div className="text-soft">
                          {artist.album_count || 0}{" "}
                          {(artist.album_count || 0) === 1 ? "album" : "albums"}
                          {" • "}
                          {artist.track_count || 0}{" "}
                          {(artist.track_count || 0) === 1 ? "song" : "songs"}
                        </div>
                      </div>
                      <div className="artist-list-counts text-soft">
                        <span>{artist.album_count || 0} albums</span>
                        <span>{artist.track_count || 0} songs</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
