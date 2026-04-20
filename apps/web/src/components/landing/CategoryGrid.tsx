import Image from "next/image";

type TextTileProps = { label: string };
function TextTile({ label }: TextTileProps) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-md bg-[#EBEEF3] px-6 py-4 w-full">
      <span className="text-2xl md:text-3xl font-extrabold text-[#262626] tracking-tight whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

type ImageTileProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  bg?: string;
};
function ImageTile({
  src,
  alt,
  width,
  height,
  bg = "bg-zinc-100",
}: ImageTileProps) {
  return (
    <div
      className={`relative rounded-md overflow-hidden ${bg}`}
      style={{ width, height }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="270px"
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
      <div className="flex flex-wrap gap-x-7.5 gap-y-6">
        <div className="flex flex-col gap-4 w-67.5 h-108.5">
          <TextTile label="FOOTBALL" />
          <ImageTile
            src="/images/soccer-ball-green-grass-soccer-field-generative-ai 1.png"
            alt="Soccer ball on grass"
            width={270}
            height={288}
          />
        </div>
        <div className="flex flex-col gap-4 w-67.5 h-108.5">
          <ImageTile
            src="/images/close-up-basketball-outdoors 1.png"
            alt="Basketball close-up"
            width={270}
            height={235}
          />
          <TextTile label="BASKET BALL" />
        </div>
        <div className="flex flex-col gap-4 w-67.5 h-108.5">
          <TextTile label="CAR SPORT" />
          <ImageTile
            src="/images/sport-car-is-drifting-track-with-smoke-around-it 1.png"
            alt="Sports car drifting"
            width={270}
            height={288}
          />
        </div>
        <div className="flex flex-col gap-4 w-67.5 h-108.5">
          <ImageTile
            src="/images/red-ping-pong-racket-sports-equipment 1.png"
            alt="Red ping-pong racket"
            width={270}
            height={286}
            bg="bg-black"
          />
          <TextTile label="TABLE TENNIS" />
        </div>
      </div>
    </section>
  );
}
