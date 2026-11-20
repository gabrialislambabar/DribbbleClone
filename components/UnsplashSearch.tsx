"use client";

import Image from "next/image";
import { useState } from "react";

type UnsplashPhoto = {
  id: string;
  urls: {
    small: string;
    regular: string;
  };
  alt_description: string | null;
  user: {
    name: string;
    links: {
      html: string;
    };
  };
  links: {
    html: string | null;
    download_location: string | null;
  };
};

type UnsplashSearchProps = {
  onSelect: (photo: UnsplashPhoto) => void;
  selectedUrl?: string | null;
};

export default function UnsplashSearch({ onSelect, selectedUrl }: UnsplashSearchProps) {
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function searchPhotos() {
    if (!query.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/unsplash/search?query=${encodeURIComponent(query)}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      setPhotos(data.results || []);
    } catch (error) {
      console.error(error);
      setError("Unable to fetch images. Please try again.");
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              searchPhotos();
            }
          }}
          placeholder="Search Unsplash images..."
          className="min-w-0 flex-1 rounded-lg border p-3"
        />

        <button
          type="button"
          onClick={searchPhotos}
          disabled={loading || !query.trim()}
          className="rounded-lg bg-black px-5 text-white disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {photos.map((photo) => {
          const isSelected = selectedUrl === photo.urls.regular;

          return (
            <div key={photo.id} className="space-y-2">
              <button
                type="button"
                onClick={() => onSelect(photo)}
                className={`relative block w-full overflow-hidden rounded-lg border-2 ${
                  isSelected ? "border-blue-600" : "border-transparent"
                }`}
              >
                <Image
                  src={photo.urls.small}
                  alt={photo.alt_description || "Unsplash photo"}
                  width={400}
                  height={300}
                  unoptimized
                  className="h-40 w-full object-cover"
                />

                {isSelected && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 font-medium text-white">
                    Selected ✓
                  </span>
                )}
              </button>

              <p className="text-xs">
                Photo by{" "}
                <a
                  href={photo.user.links.html}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {photo.user.name}
                </a>{" "}
                on Unsplash
              </p>
            </div>
          );
        })}
      </div>

      {!loading && !error && photos.length === 0 && (
        <p className="text-sm text-muted">No images to display. Search for something!</p>
      )}
    </div>
  );
}
