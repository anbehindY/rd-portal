import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import CategoryGrid from "@/components/landing/CategoryGrid";
import RequestDemo from "@/components/landing/RequestDemo";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <CategoryGrid />
        <RequestDemo />
      </main>
    </div>
  );
}
