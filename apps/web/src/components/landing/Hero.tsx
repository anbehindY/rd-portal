import Image from "next/image";

export default function Hero() {
  return (
    <section className="mx-auto max-w-360 pl-6 pr-4 md:pl-12 md:pr-6 lg:pl-24 lg:pr-12 xl:pl-32 xl:pr-16 py-12 md:py-16 lg:py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1fr_720px] gap-8 md:gap-10 items-center mt-4">
        <div className="flex flex-col gap-6 md:gap-8 lg:gap-10">
          <h1 className="font-inter font-extrabold uppercase text-[#262626] text-5xl md:text-[52px] lg:text-[56px] xl:text-[56px] leading-[1.1] tracking-normal">
            Top Scorer
            <br />
            To the Final
            <br />
            Match
          </h1>
          <p className="font-inter font-normal text-[#262626] max-w-md text-base lg:text-[18px] leading-normal lg:leading-6.25 tracking-normal">
            The EuroLeague Finals Top Scorer is the individual award for the
            player that gained the highest points in the EuroLeague Finals
          </p>
          <div>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2.5 w-full sm:w-73 h-15.5 rounded-md bg-[#262626] px-8 py-3 font-inter font-bold text-[20px] leading-9.5 tracking-[0.09em] uppercase text-white whitespace-nowrap hover:bg-zinc-800 transition-colors"
            >
              CONTINUE READING
            </button>
          </div>
        </div>
        <div className="relative w-full max-w-180 aspect-720/580 justify-self-center md:justify-self-end">
          <Image
            src="/images/basketball-player-action-sunset 1.png"
            alt="Basketball player in action at sunset"
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 45vw, 720px"
            className="object-contain object-center"
          />
        </div>
      </div>
    </section>
  );
}
