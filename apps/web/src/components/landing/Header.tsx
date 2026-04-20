export default function Header() {
  return (
    <header className="w-full bg-white border-b border-zinc-200/60">
      <div className="mx-auto max-w-360 pl-6 pr-4 md:pl-12 md:pr-6 lg:pl-24 lg:pr-12 xl:pl-32 xl:pr-16 py-5 flex items-center">
        <span
          className="font-logo text-black text-[32px] leading-[32px] sm:text-[42px] sm:leading-[42px] tracking-[0.01em]"
        >
          Sport News
        </span>
      </div>
    </header>
  );
}
