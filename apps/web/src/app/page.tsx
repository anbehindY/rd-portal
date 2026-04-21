import Link from "next/link";
import { ArrowRight, LayoutDashboard, Globe } from "lucide-react";

export default function Splash() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-6 py-12">
      <main className="w-full max-w-3xl flex flex-col items-center">
        <span
          className="splash-fade font-logo text-black text-[44px] leading-none sm:text-[60px] tracking-[0.01em]"
          style={{ animationDelay: "0ms" }}
        >
          Sport News
        </span>
        <h1
          className="splash-fade mt-6 text-center text-zinc-900 text-2xl sm:text-3xl font-semibold tracking-tight"
          style={{ animationDelay: "80ms" }}
        >
          Where would you like to go?
        </h1>
        <p
          className="splash-fade mt-2 text-center text-zinc-500 text-sm sm:text-base"
          style={{ animationDelay: "160ms" }}
        >
          Choose a destination to continue.
        </p>

        <div className="mt-10 w-full grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          <SplashCard
            href="/landing"
            icon={<Globe className="h-6 w-6" aria-hidden="true" />}
            title="Landing Page"
            subtitle="View the public demo page and request a demo."
            delay={240}
          />
          <SplashCard
            href="/admin"
            icon={<LayoutDashboard className="h-6 w-6" aria-hidden="true" />}
            title="Admin Portal"
            subtitle="Review submitted requests and dashboard stats."
            delay={320}
          />
        </div>

        <p
          className="splash-fade mt-10 text-xs text-zinc-400"
          style={{ animationDelay: "420ms" }}
        >
          v0.1 · POC
        </p>
      </main>
    </div>
  );
}

function SplashCard({
  href,
  icon,
  title,
  subtitle,
  delay,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  delay: number;
}) {
  return (
    <Link
      href={href}
      className="splash-fade group relative flex h-full flex-col rounded-2xl border border-zinc-200/60 bg-white p-6 sm:p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
        {icon}
      </span>
      <span className="mt-5 text-lg font-semibold text-zinc-900">{title}</span>
      <span className="mt-1 text-sm text-zinc-500">{subtitle}</span>
      <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-zinc-900">
        Continue
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}
