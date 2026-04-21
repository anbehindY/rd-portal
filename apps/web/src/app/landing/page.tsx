import type { Metadata } from "next";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import CategoryGrid from "@/components/landing/CategoryGrid";
import RequestDemo from "@/components/landing/RequestDemo";

export const metadata: Metadata = {
  title: "Landing · Request Demo Portal",
  description:
    "Request a personalized demo — tell us about your needs and our team will reach out within 2 hours.",
};

export default function LandingPage() {
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
