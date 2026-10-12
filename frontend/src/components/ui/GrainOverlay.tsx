
interface GrainOverlayProps {
  opacity?: number;
  className?: string;
}

/**
 * GrainOverlay
 * Procedural SVG fractal noise paper-grain texture overlay.
 * Static, hardware-accelerated, pointer-events disabled, zero JS animation loop.
 * Safeguarded with reduced opacity under prefers-reduced-motion.
 */
export function GrainOverlay({ opacity = 0.35, className = '' }: GrainOverlayProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-30 select-none overflow-hidden grain-overlay ${className}`}
      style={{ opacity }}
    >
      <svg
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <filter id="superdesign-grain-filter" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="3"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.16   0 0 0 0 0.14   0 0 0 0 0.14   0 0 0 0 0.75 0"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#superdesign-grain-filter)" />
      </svg>
    </div>
  );
}
