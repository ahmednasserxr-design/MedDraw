"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error("Supabase is not configured.");
      return;
    }
    setLoading(true);
    try {
      const sb = createSupabaseBrowserClient();
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/callback` },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-md w-full px-4 py-10 flex-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg mb-4"
        >
          <ArrowLeft size={14} /> Back
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
          </CardHeader>
          <CardBody>
            {!isSupabaseConfigured ? (
              <p className="text-sm text-fg-muted">
                Supabase is not configured. You can still play as a guest from the home
                page.
              </p>
            ) : sent ? (
              <div className="text-center py-6 space-y-2">
                <Mail className="mx-auto text-accent" size={32} />
                <p className="font-medium">Check your inbox</p>
                <p className="text-sm text-fg-muted">
                  We sent a magic link to <strong>{email}</strong>.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <p className="text-sm text-fg-muted">
                  Sign in for persistent stats and leaderboard scores. (Optional — you can
                  also play as a guest.)
                </p>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending…" : "Send magic link"}
                </Button>
              </form>
            )}
          </CardBody>
        </Card>
      </main>
    </>
  );
}
