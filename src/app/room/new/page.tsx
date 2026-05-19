import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { CreateRoomForm } from "@/components/lobby/CreateRoomForm";

export default function NewRoomPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl w-full px-4 py-10 flex-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg mb-4"
        >
          <ArrowLeft size={14} /> Back to lobby
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Create a new room</CardTitle>
          </CardHeader>
          <CardBody>
            <CreateRoomForm />
          </CardBody>
        </Card>
      </main>
    </>
  );
}
