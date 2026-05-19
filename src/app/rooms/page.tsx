import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { RoomList } from "@/components/lobby/RoomList";
import { JoinWithCode } from "@/components/lobby/JoinWithCode";

export default function RoomsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl w-full px-4 py-8 flex-1 space-y-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg transition-colors">
            <ArrowLeft size={14} /> Home
          </Link>
          <h1 className="text-2xl font-bold">Join a room</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <RoomList />
          <JoinWithCode />
        </div>
      </main>
      <footer className="border-t border-border py-4 text-center text-xs text-fg-muted">
        MedDraw · for educational purposes
      </footer>
    </>
  );
}
