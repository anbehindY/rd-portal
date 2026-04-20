import { Sparkles } from "lucide-react";
import Image from "next/image";
import DemoForm from "./DemoForm";

export default function RequestDemo() {
  return (
    <section className="mx-auto max-w-360 pl-6 pr-4 md:pl-12 md:pr-6 lg:pl-24 lg:pr-12 xl:pl-32 xl:pr-16 py-12 md:py-20 lg:py-24">
      <div className="flex flex-col items-center text-center gap-4 mb-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-zinc-200/70 px-4 py-2 font-figtree mb-2 font-semibold text-sm leading-5 tracking-normal text-center text-zinc-800">
          <Sparkles className="h-4 w-4" aria-hidden />
          Get Started
        </span>
        <h2 className="font-inter text-4xl md:text-5xl font-bold text-black tracking-tight">
          Request a Demo
        </h2>
        <p className="font-figtree text-zinc-600 max-w-md">
          Our team will walk you through the platform.
        </p>
      </div>

      <div className="rounded-2xl bg-white border border-zinc-200 overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] md:h-163.5">
          <div className="relative min-h-[400px] md:min-h-full w-full">
            <Image
              src="/images/form-image.png"
              alt="Aerial view of cliff and river"
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
          <div className="p-6 md:p-10">
            <DemoForm />
          </div>
        </div>
      </div>
    </section>
  );
}
