import Image from "next/image";

interface VideoMeta {
  title: string;
  url: string;
  channel?: string;
  thumbnail?: string;
  videoId?: string;
  filename?: string;
  chunks?: number;
}

export default function VideoCard({ video }: { video: VideoMeta }) {
  const thumb = video.thumbnail;
  const watchUrl = video.url;
  const channel = video.channel;

  return (
    <div className="fade-up flex w-full max-w-[88%] gap-3 sm:max-w-[70ch]">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 00.5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 002.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 002.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
        </svg>
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[13px] font-bold text-text">ChatPDF</span>
          <span className="rounded-md bg-panel-hover px-2 py-0.5 text-[11px] font-semibold text-text-faint">
            Video added
          </span>
        </div>

        <div className="card overflow-hidden rounded-2xl">
          {/* Thumbnail (full width, above the text) */}
          {thumb && (
            <a
              href={watchUrl}
              target="_blank"
              rel="noreferrer"
              className="group relative block aspect-video w-full overflow-hidden bg-black"
            >
              <Image
                src={thumb}
                alt={video.title}
                fill
                unoptimized
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-black shadow-lg">
                  <svg className="ml-0.5 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </span>
            </a>
          )}

          {/* Details below the thumbnail */}
          <div className="p-4 sm:p-5">
            <h3 className="text-[16px] font-bold leading-snug text-text">
              <a href={watchUrl} target="_blank" rel="noreferrer" className="hover:text-accent">
                {video.title}
              </a>
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-text-faint">
              {channel && (
                <>
                  <span className="font-semibold text-text-dim">{channel}</span>
                  <span>·</span>
                </>
              )}
              <span className="inline-flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                Transcript indexed
              </span>
              {video.chunks != null && (
                <>
                  <span>·</span>
                  <span className="font-mono">{video.chunks} chunks</span>
                </>
              )}
            </div>

            <p className="mt-3 border-t border-border pt-3 text-[13px] leading-relaxed text-text-dim">
              Ask me anything about this video — summaries, key points, quotes
              and more, grounded in its transcript.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}