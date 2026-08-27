"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LockKeyhole, Mail, Rocket } from "lucide-react";
import { supabase } from "@/lib/supabase";
import BackgroundEffects from "@/components/BackgroundEffects";

type AuthMode = "login" | "signup";

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.replace("/");
        return;
      }

      setCheckingSession(false);
    }

    checkSession();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || password.length < 6) {
      setError("Enter a valid email and a password with at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        if (data.session) {
          router.push("/");
          router.refresh();
          return;
        }

        setMessage(
          "Account created. Check your email and click the confirmation link, then sign in."
        );
      } else {
        const { error: loginError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (loginError) {
          throw loginError;
        }

        router.push("/");
        router.refresh();
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Authentication failed."
      );
    } finally {
      setLoading(false);
    }
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setMessage("");
  }

  if (checkingSession) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950">
        <BackgroundEffects />

        <div className="relative z-10 rounded-2xl border border-cyan-400/20 bg-slate-900/70 px-8 py-6 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-cyan-400/20" />
          <p className="text-slate-300">Checking your account...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 sm:px-6">
      <BackgroundEffects />

      <div className="relative z-10 w-full max-w-md">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-cyan-300"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <section className="mission-panel rounded-3xl border border-cyan-400/20 bg-slate-900/75 p-7 shadow-2xl backdrop-blur-xl sm:p-9">
          <div className="mb-7 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300">
              <Rocket size={25} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
                AI Mission Control
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
                PMPilot
              </h1>
            </div>
          </div>

          <p className="text-slate-400">
            {mode === "login"
              ? "Sign in to access your projects and mission dashboard."
              : "Create your account and start building AI-powered project plans."}
          </p>

          <div className="mt-7 grid grid-cols-2 rounded-xl border border-slate-700/70 bg-slate-950/60 p-1">
            <button
              type="button"
              onClick={() => changeMode("login")}
              className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-cyan-400/15 text-cyan-300 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => changeMode("signup")}
              className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                mode === "signup"
                  ? "bg-cyan-400/15 text-cyan-300 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Email
              </label>

              <div className="relative">
                <Mail
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-3.5 pl-12 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  id="password"
                  type="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-3.5 pl-12 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </p>
            )}

            {message && (
              <p className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="space-primary-button flex w-full items-center justify-center rounded-xl px-5 py-3.5 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>
        </section>

        <p className="mt-5 text-center text-xs text-slate-600">
          Secure authentication powered by Supabase
        </p>
      </div>
    </main>
  );
} 