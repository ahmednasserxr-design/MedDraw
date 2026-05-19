import { NextResponse } from "next/server";
import { listPublicRooms } from "@/lib/game/roomManager";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ rooms: listPublicRooms() });
}
