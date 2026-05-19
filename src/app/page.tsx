import { Brush } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { HomeButtons } from "@/components/lobby/HomeButtons";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center gap-10">
        <div className="space-y-4">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-accent flex items-center justify-center shadow-lg shadow-accent/30">
            <Brush size={40} className="text-accent-fg" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Med<span className="text-accent">Draw</span>
          </h1>
          <p className="text-fg-muted max-w-sm mx-auto">
            Draw medical terms. Race to guess. Compete with classmates.
          </p>
        </div>
        <HomeButtons />
      </main>
      <footer className="border-t border-border py-4 text-center text-xs text-fg-muted">
        MedDraw · for educational purposes
      </footer>
    </>
  );
}
