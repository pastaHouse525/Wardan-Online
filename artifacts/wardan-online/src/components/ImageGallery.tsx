import { useState, useRef, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn, Images } from "lucide-react";

interface Props {
  images: string[];
  alt: string;
}

export default function ImageGallery({ images, alt }: Props) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const touchStart = useRef<number | null>(null);
  const touchDelta = useRef(0);

  const count = images.length;

  const prev = useCallback(() => setActive((i) => (i - 1 + count) % count), [count]);
  const next = useCallback(() => setActive((i) => (i + 1) % count), [count]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, prev, next]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
    touchDelta.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    touchDelta.current = touchStart.current - e.touches[0].clientX;
  };
  const onTouchEnd = () => {
    if (Math.abs(touchDelta.current) > 40) {
      touchDelta.current > 0 ? next() : prev();
    }
    touchStart.current = null;
  };

  if (count === 0) {
    return (
      <div className="rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 h-80 md:h-96 flex items-center justify-center">
        <Images className="h-20 w-20 text-primary/30" />
      </div>
    );
  }

  return (
    <>
      {/* Main viewer */}
      <div className="space-y-2">
        <div
          className="relative rounded-xl overflow-hidden bg-muted h-72 sm:h-80 md:h-96 cursor-pointer select-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={() => setLightbox(true)}
          data-testid="img-gallery-main"
        >
          <img
            key={images[active]}
            src={images[active]}
            alt={`${alt} ${active + 1}`}
            className="w-full h-full object-cover transition-opacity duration-200"
            loading="eager"
          />

          {/* Zoom hint */}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
            <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 drop-shadow" />
          </div>

          {/* Prev / Next arrows */}
          {count > 1 && (
            <>
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors z-10"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="السابق"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors z-10"
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="التالي"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Counter pill */}
          {count > 1 && (
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
              {active + 1} / {count}
            </span>
          )}
        </div>

        {/* Thumbnail strip */}
        {count > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {images.map((src, i) => (
              <button
                key={src}
                onClick={() => setActive(i)}
                className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  i === active
                    ? "border-primary shadow-md scale-105"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
                data-testid={`img-gallery-thumb-${i}`}
              >
                <img src={src} alt={`${alt} ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox overlay */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center"
          onClick={() => setLightbox(false)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Close */}
          <button
            className="absolute top-4 left-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 z-10"
            onClick={() => setLightbox(false)}
          >
            <X className="h-6 w-6" />
          </button>

          {/* Counter */}
          <span className="absolute top-4 right-4 text-white/70 text-sm">
            {active + 1} / {count}
          </span>

          {/* Image */}
          <img
            key={`lb-${images[active]}`}
            src={images[active]}
            alt={`${alt} ${active + 1}`}
            className="max-w-full max-h-[80vh] object-contain select-none"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Arrows */}
          {count > 1 && (
            <>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 rounded-full p-3"
                onClick={(e) => { e.stopPropagation(); prev(); }}
              >
                <ChevronRight className="h-7 w-7" />
              </button>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 rounded-full p-3"
                onClick={(e) => { e.stopPropagation(); next(); }}
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
            </>
          )}

          {/* Thumbnail strip */}
          {count > 1 && (
            <div className="absolute bottom-4 flex gap-2 overflow-x-auto max-w-full px-4 scrollbar-hide">
              {images.map((src, i) => (
                <button
                  key={src}
                  onClick={(e) => { e.stopPropagation(); setActive(i); }}
                  className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                    i === active ? "border-white" : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
