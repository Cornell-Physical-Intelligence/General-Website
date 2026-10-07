import { useEffect, useRef, useState } from 'react';
import ResponsiveImage from './ResponsiveImage';
import workImageManifest from 'virtual:cupi-image-manifest/work';
import './HoverVideo.css';

/**
 * A still that becomes a video on hover.
 *
 * The still is the only thing fetched on page load: the <video> carries `preload="none"`,
 * so not a byte of it moves until the pointer (or keyboard focus, or a tap) asks for it.
 * That keeps the tile as cheap as an image while still giving it motion.
 *
 * Which makes the still's own weight the whole cost of this component, and it used to be a
 * full-frame PNG — the worst possible container for a photographic video frame, and four
 * of them ran to 2.4MB on a page whose text is a few kilobytes. They are AVIF now, at the
 * sizes the tile can actually occupy.
 *
 * The still stays layered on top until the video's `playing` event fires, so the handover
 * is a cross-fade rather than a flash of empty <video>. Poster and clip are encoded at the
 * same dimensions, so they land on exactly the same pixels — nothing shifts when the two
 * trade places.
 *
 * Control lives in a small corner button — a play triangle that becomes a stop square —
 * and it is the only real <button> here, so it is also what the keyboard tabs to. On a
 * pointer-and-hover machine the whole surface still toggles on click, with hover-to-play
 * on top. On touch the surface is deliberately inert: a scroll drag lands on these tiles
 * constantly, and tap-anywhere meant flicking past the page set clips playing. There, the
 * corner button is the one way in.
 *
 * `ratio` is the tile's aspect ratio (any CSS aspect-ratio value), defaulting to square.
 * Pass the source footage's own ratio to avoid `object-fit: cover` cropping content out —
 * it matters for clips with overlaid telemetry near the edges.
 */
// Two per row inside a 960px column, one per row on a phone. Callers laying tiles out
// differently pass their own `sizes`.
const POSTER_SIZES = '(max-width: 640px) 100vw, (max-width: 960px) 50vw, 480px';

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function HoverVideo({
  src,
  poster,
  label,
  ratio,
  sizes = POSTER_SIZES,
  loading,
  autoplay = false,
}) {
  const tileRef = useRef(null);
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  // An `autoplay` clip runs on its own, muted and looping, whenever at least a quarter
  // of it is on screen, and pauses when it scrolls away, so it costs nothing until it
  // is seen. Reduced motion turns it back into an ordinary hover clip.
  useEffect(() => {
    const tile = tileRef.current;
    const video = videoRef.current;
    if (!autoplay || !tile || !video || prefersReducedMotion()) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.25 },
    );
    observer.observe(tile);
    return () => observer.disconnect();
  }, [autoplay]);

  // Hover start/stop would fight the autoplay, so it only applies to ordinary clips.
  const hoverDriven = () => !autoplay || prefersReducedMotion();

  const startPlaying = () => {
    // First call is also what triggers the download — preload="none" until now.
    videoRef.current?.play().catch(() => {}); // a fast leave aborts the promise; harmless
  };

  const stopPlaying = () => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
    setPlaying(false);
  };

  const toggle = () => (playing ? stopPlaying() : startPlaying());

  return (
    /* Not a <button>: the corner control is one, and buttons don't nest. The surface
       keeps its pointer conveniences; the button carries the semantics. */
    <div
      ref={tileRef}
      className={`hover-video ${playing ? 'is-playing' : ''}`.trim()}
      style={ratio ? { '--hover-video-ratio': ratio } : undefined}
      onPointerEnter={(e) => e.pointerType !== 'touch' && hoverDriven() && startPlaying()}
      onPointerLeave={(e) => e.pointerType !== 'touch' && hoverDriven() && stopPlaying()}
      onClick={() => {
        // Checked at event time, not render: it is the hover capability that separates
        // a scroll-dragging thumb from a mouse, not the viewport width.
        if (window.matchMedia('(hover: none)').matches) return;
        toggle();
      }}
    >
      <ResponsiveImage
        manifest={workImageManifest}
        group="poster"
        name={poster}
        sizes={sizes}
        loading={loading}
        className="hover-video__still"
        draggable={false}
        decoding="async"
        alt=""
        aria-hidden="true"
      />
      <video
        ref={videoRef}
        className="hover-video__clip"
        src={src}
        preload="none"
        muted
        loop
        playsInline
        tabIndex={-1}
        aria-hidden="true"
        onPlaying={() => setPlaying(true)}
      />
      <button
        type="button"
        className="hover-video__toggle"
        onClick={(e) => {
          e.stopPropagation(); // the surface would toggle it straight back on desktop
          toggle();
        }}
        onFocus={startPlaying}
        onBlur={stopPlaying}
        aria-label={playing ? 'Stop the clip' : label}
        aria-pressed={playing}
      >
        {/* One drawing: a soft square scrim with the glyph inside, every corner G2 —
            pairs of cubics whose curvature is zero where they meet the straight edges
            and continuous through the apex. Generated, not hand-drawn, so the ramps
            are exact; the backdrop echoes the glyphs instead of fighting them the way
            the circle did. */}
        <svg viewBox="0 0 34 34" aria-hidden="true" focusable="false">
          <path
            fill="rgba(0, 0, 0, 0.22)"
            d="M 0.00 12.00 C 0.00 9.30 0.00 6.60 3.30 3.30 C 6.60 0.00 9.30 0.00 12.00 0.00 L 22.00 0.00 C 24.70 0.00 27.40 0.00 30.70 3.30 C 34.00 6.60 34.00 9.30 34.00 12.00 L 34.00 22.00 C 34.00 24.70 34.00 27.40 30.70 30.70 C 27.40 34.00 24.70 34.00 22.00 34.00 L 12.00 34.00 C 9.30 34.00 6.60 34.00 3.30 30.70 C 0.00 27.40 0.00 24.70 0.00 22.00 L 0.00 12.00 Z"
          />
          <g transform="translate(9 9) scale(0.8)">
            {playing ? (
              <path
                fill="currentColor"
                d="M 3.20 6.60 C 3.20 5.83 3.20 5.07 4.13 4.13 C 5.07 3.20 5.83 3.20 6.60 3.20 L 13.40 3.20 C 14.17 3.20 14.93 3.20 15.87 4.13 C 16.80 5.07 16.80 5.83 16.80 6.60 L 16.80 13.40 C 16.80 14.17 16.80 14.93 15.87 15.87 C 14.93 16.80 14.17 16.80 13.40 16.80 L 6.60 16.80 C 5.83 16.80 5.07 16.80 4.13 15.87 C 3.20 14.93 3.20 14.17 3.20 13.40 L 3.20 6.60 Z"
              />
            ) : (
              <path
                fill="currentColor"
                d="M 5.40 5.60 C 5.40 4.92 5.40 4.25 6.10 3.86 C 6.80 3.47 7.38 3.82 7.95 4.17 L 14.85 8.43 C 15.42 8.78 16.00 9.13 16.00 10.00 C 16.00 10.87 15.42 11.22 14.85 11.57 L 7.95 15.83 C 7.38 16.18 6.80 16.53 6.10 16.14 C 5.40 15.75 5.40 15.07 5.40 14.40 L 5.40 5.60 Z"
              />
            )}
          </g>
        </svg>
      </button>
    </div>
  );
}
