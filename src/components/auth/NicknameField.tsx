"use client";

import { useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useAuth } from "@/hooks/useAuth";

export function NicknameField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const { nickname, isGuest, loading } = useAuth();

  useEffect(() => {
    if (!loading && nickname) onChange(nickname);
    // Only pre-fill once when the saved nickname loads — not on every keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  return (
    <div>
      <Label htmlFor="nickname">Nickname</Label>
      <Input
        id="nickname"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 20))}
        placeholder="Dr. Strange"
        disabled={disabled || (!isGuest && !!nickname)}
        maxLength={20}
      />
      {!isGuest && nickname && (
        <p className="mt-1 text-xs text-fg-muted">
          Signed in as <strong>{nickname}</strong>
        </p>
      )}
    </div>
  );
}
