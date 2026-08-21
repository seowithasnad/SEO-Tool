"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function Topbar({ title }: { title: string }) {
  const { data: session } = useSession();

  return (
    <header className="flex h-14 w-full items-center justify-between border-b border-neutral-800 px-6">
      <h1 className="text-sm text-neutral-200">{title}</h1>
      <div className="flex items-center gap-3">
        <span className="text-sm text-neutral-500">
          {session?.user?.email}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 rounded-md border border-neutral-800 px-2.5 py-1.5 text-sm text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </header>
  );
}
