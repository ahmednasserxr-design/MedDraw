"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { playSound } from "@/lib/sounds";

export function HomeButtons() {
  return (
    <div className="flex gap-3">
      <Link href="/room/new">
        <Button
          size="lg"
          className="gap-2 px-7 transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] whitespace-nowrap"
          onClick={() => playSound("click-primary")}
        >
          <Plus size={18} /> Create room
        </Button>
      </Link>
      <Link href="/rooms">
        <Button
          variant="secondary"
          size="lg"
          className="gap-2 px-7 transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] whitespace-nowrap"
          onClick={() => playSound("click")}
        >
          <Search size={18} /> Join a room
        </Button>
      </Link>
    </div>
  );
}
