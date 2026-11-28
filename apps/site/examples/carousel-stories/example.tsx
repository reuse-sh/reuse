"use client";
import { useCarousel, useCarouselState } from "@reuse-sh/carousel/react";
import { useEffect, useRef } from "react";
import { Picture } from "@/components/picture";
import { type PhotoId, photo } from "@/lib/photos";
import { bindStoryTaps } from "./stories";
import "./stories.css";

const stories = (
  [
    "beach-palm",
    "sea-and-sky",
    "white-court",
    "white-arc",
    "arch-room",
  ] as const satisfies readonly PhotoId[]
).map((id) => photo(id));

export function Example() {
  const { ref, carousel } = useCarousel({ autoplay: 5000 });
  const { index, isPaused } = useCarouselState(
    carousel,
    ({ index, isPaused }) => ({ index, isPaused }),
  );
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (carousel && root.current) return bindStoryTaps(root.current, carousel);
  }, [carousel]);
  return (
    <div ref={root} className="re-st relative w-full aspect-portrait bg-media">
      <section
        ref={ref}
        className="re-carousel re-st-strip"
        aria-label="Stories"
      >
        <div className="re-st-bar" aria-hidden="true">
          {stories.map((story, at) => (
            <span
              key={story.id}
              className="re-st-segment"
              data-state={
                at < index ? "past" : at === index ? "current" : "future"
              }
            />
          ))}
        </div>
        {stories.map((story) => (
          <figure
            key={story.id}
            className="re-carousel__slide re-st-story"
            data-carousel-slide
          >
            <Picture photo={story} sizes="24rem" />
            <figcaption className="re-st-caption">{story.caption}</figcaption>
          </figure>
        ))}
      </section>
      <div className="re-st-taps">
        <button
          type="button"
          className="re-st-tap basis-1/3"
          data-story-prev
          aria-label="Previous story"
          aria-disabled={index === 0 ? "true" : undefined}
        />
        <button
          type="button"
          className="re-st-tap grow"
          data-story-next
          aria-label="Next story"
        />
      </div>
      <div className="re-st-header">
        <span className="text-ui font-semibold">Quiet places</span>
        <button
          type="button"
          className="re-st-play motion-reduce:hidden"
          disabled={!carousel}
          aria-label={isPaused ? "Play stories" : "Pause stories"}
          onClick={() => (isPaused ? carousel?.play() : carousel?.pause())}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            {isPaused ? (
              <path d="M7 4.5v15l12.5-7.5z" />
            ) : (
              <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
            )}
          </svg>
        </button>
      </div>
    </div>
  );
}
