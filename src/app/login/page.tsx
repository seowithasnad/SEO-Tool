"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
       <div className="mb-8 flex items-center gap-2"> <img src="/logo.svg" alt="Search Velocity" className="h-7 w-7 rounded" /> <span className="text-sm text-neutral-100">Search Velocity</span> </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6"
        >
          <h1 className="mb-1 text-lg text-neutral-100">Sign in</h1>
          <p className="mb-5 text-sm text-neutral-500">
            Use your workspace credentials to continue.
          </p>

          <label className="mb-1 block text-xs text-neutral-500">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-brand-500"
          />

          <label className="mb-1 block text-xs text-neutral-500">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-brand-500"
          />

          {error && (
            <p className="mb-4 text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-brand-500 py-2 text-sm text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
