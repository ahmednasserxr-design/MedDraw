"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { NicknameField } from "@/components/auth/NicknameField";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/hooks/useAuth";

export function JoinWithCode() {
  const router = useRouter();
  const { socket } = useSocket();
  const { userId, setGuestNickname, isGuest } = useAuth();
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c.length < 4) {
      toast.error("Enter a valid invite code");
      return;
    }
    const nick = nickname.trim();
    if (!nick) {
      toast.error("Pick a nickname");
      return;
    }
    if (isGuest) setGuestNickname(nick);
    setLoading(true);
    socket.emit(
      "room:join_code",
      { code: c, nickname: nick, userId: userId ?? undefined },
      (res) => {
        setLoading(false);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        router.push(`/room/${res.roomId}`);
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join with invite code</CardTitle>
      </CardHeader>
      <CardBody>
        <form onSubmit={submit} className="space-y-3">
          <NicknameField value={nickname} onChange={setNickname} />
          <div>
            <label htmlFor="code" className="block text-sm font-medium mb-1.5">
              Invite code
            </label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ABC123"
              className="uppercase tracking-widest font-mono"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Joining…" : "Join room"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
