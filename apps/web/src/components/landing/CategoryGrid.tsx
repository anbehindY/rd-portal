import Image from "next/image";
import type { ReactNode } from "react";

type TextTileProps = { label: ReactNode };
function TextTile({ label }: TextTileProps) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-md bg-[#EBEEF3] px-3 py-4 w-full min-h-32 sm:min-h-36">
      <span className="text-[28px] md:text-[32px] lg:text-[36px] font-extrabold text-[#262626] tracking-tight text-center whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

type ImageTileProps = {
  src: string;
  alt: string;
  aspect: string;
  bg?: string;
};
function ImageTile({ src, alt, aspect, bg = "bg-zinc-100" }: ImageTileProps) {
  return (
    <div
      className={`relative w-full rounded-md overflow-hidden ${bg} ${aspect}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 270px"
        className="object-contain"
      />
    </div>
  );
}

export default function CategoryGrid() {
  return (
    <section className="mx-auto max-w-360 pl-6 pr-4 md:pl-12 md:pr-6 lg:pl-24 lg:pr-12 xl:pl-32 xl:pr-16 py-12 md:py-16 lg:py-20">
      <h2 className="text-[32px] md:text-4xl font-bold text-[#262626] mb-3">
        Category
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-7.5 gap-y-6">
        <div className="flex flex-col gap-4 w-full h-full">
          <TextTile label="FOOTBALL" />
          <ImageTile
            src="/images/soccer-ball-green-grass-soccer-field-generative-ai-1.webp"
            alt="Soccer ball on grass"
            aspect="aspect-270/288"
          />
        </div>
        <div className="flex flex-col gap-4 w-full h-full">
          <ImageTile
            src="/images/close-up-basketball-outdoors-1.webp"
            alt="Basketball close-up"
            aspect="aspect-270/235"
          />
          <TextTile label="BASKET BALL" />
        </div>
        <div className="flex flex-col gap-4 w-full h-full">
          <TextTile label="CAR SPORT" />
          <ImageTile
            src="/images/sport-car-is-drifting-track-with-smoke-around-it-1.webp"
            alt="Sports car drifting"
            aspect="aspect-270/288"
          />
        </div>
        <div className="flex flex-col gap-4 w-full h-full">
          <ImageTile
            src="/images/red-ping-pong-racket-sports-equipment-1.webp"
            alt="Red ping-pong racket"
            aspect="aspect-270/286"
            bg="bg-black"
          />
          <TextTile label="TABLE TENNIS" />
        </div>
      </div>
    </section>
  );
}
