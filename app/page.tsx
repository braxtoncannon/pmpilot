"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  Activity,
  ArrowRight,
  Bot,
  FolderKanban,
  Rocket,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import MissionForm from "@/components/MissionForm";
import Navbar from "@/components/Navbar";
import ResultPanel from "@/components/ResultPanel";

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [projectType, setProjectType] = useState("Campus Event");
  const [teamSize, setTeamSize] = useState("1");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/auth");
        return;
      }

      setUser(user);
      setCheckingSession(false);
    }

    void checkSession();
  }, [router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!user) {
      router.replace("/auth");
      return;
    }

    if (!name.trim() || !description.trim() || !deadline) {
      setError(
        "Please enter a project name, description, and deadline."
      );
      return;
    }

    setLoading(true);
    setError("");
    setResult("");
    setCopied(false);
    setSaved(false);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          budget,
          deadline,
          priority,
          projectType,
          teamSize,
        }),
      });

      const responseText = await response.text();

      let data: {
        error?: string;
        projectPlan?: string;
        result?: string;
      };

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `The project generator returned an invalid response. Server status: ${response.status}.`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to generate project."
        );
      }

      const generatedPlan =
        data.projectPlan ||
        data.result ||
        "No project plan was returned.";

      setResult(generatedPlan);

      const { error: saveError } = await supabase
        .from("projects")
        .insert({
          name: name.trim(),
          description: description.trim(),
          budget: budget ? Number(budget) : null,
          deadline,
          priority,
          project_type: projectType,
          team_size: Number(teamSize),
          generated_plan: generatedPlan,
          user_id: user.id,
        });

      if (saveError) {
        console.error("Supabase save error:", saveError);

        setError(
          `The plan was generated, but it could not be saved: ${saveError.message}`
        );

        return;
      }

      setSaved(true);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyPlan() {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError("Unable to copy the project plan.");
    }
  }

  function generateAnother() {
    setResult("");
    setError("");
    setCopied(false);
    setSaved(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function returnHome() {
    setShowForm(false);
    setResult("");
    setError("");
    setCopied(false);
    setSaved(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/auth");
    router.refresh();
  }

  if (checkingSession) {
    return (
      <main className="relative flex min-h-screen items-center justify-center lg:pl-[230px]">
        <div className="rounded-3xl border border-cyan-400/20 bg-slate-950/60 px-10 py-8 text-center shadow-[0_0_60px_rgba(34,211,238,0.08)] backdrop-blur-2xl">
          <Rocket
            size={32}
            className="mx-auto rotate-[-40deg] text-cyan-300"
          />

          <p className="mt-4 text-xs font-bold uppercase tracking-[0.25em] text-cyan-400/70">
            Initializing PMPilot
          </p>

          <p className="mt-3 text-slate-400">
            Loading Mission Control...
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <Navbar onSignOut={signOut} />

      <main className="relative min-h-screen lg:pl-[230px]">
        <div className="relative z-10 mx-auto max-w-[1500px] px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
          {!showForm ? (
            <>
              {/* TOP BAR */}

              <header className="flex flex-col gap-5 border-b border-cyan-400/10 pb-7 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>Mission Control</span>
                    <span>/</span>
                    <span className="text-cyan-300">
                      Dashboard
                    </span>
                  </div>

                  <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                    Command Center
                  </h1>

                  <p className="mt-2 text-lg text-cyan-300">
                    AI Project Management Platform
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-5 py-3 font-semibold text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.1)] transition hover:bg-cyan-400/20"
                >
                  <Rocket size={18} />
                  Launch New Mission
                </button>
              </header>

              {/* HERO */}

              <section className="relative mt-8 overflow-hidden rounded-3xl border border-cyan-400/20 bg-[#031022]/70 p-7 shadow-[0_25px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-10">
                <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-cyan-400/10">
                  <div className="absolute inset-8 rounded-full border border-blue-400/10" />
                  <div className="absolute inset-20 rounded-full bg-cyan-400/5 blur-3xl" />
                </div>

                <div className="relative max-w-3xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                    <Activity size={13} />
                    Systems Online
                  </div>

                  <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight text-white sm:text-6xl">
                    Take command of
                    <span className="block bg-linear-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                      every mission.
                    </span>
                  </h2>

                  <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
                    Plan projects, coordinate teams, monitor
                    mission health, manage execution, and let AI
                    handle the planning workload.
                  </p>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setShowForm(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-400 px-6 py-3.5 font-bold text-white shadow-[0_0_35px_rgba(34,211,238,0.2)] transition hover:-translate-y-0.5 hover:brightness-110"
                    >
                      <Rocket size={19} />
                      Launch New Mission
                    </button>

                    <Link
                      href="/projects"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-6 py-3.5 font-semibold text-slate-200 transition hover:border-cyan-400/30 hover:text-white"
                    >
                      <FolderKanban size={19} />
                      Open Projects
                    </Link>
                  </div>
                </div>
              </section>

              {/* COMMAND MODULES */}

              <section className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <div className="group rounded-2xl border border-cyan-400/15 bg-[#031022]/65 p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-cyan-400/35">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                    <Sparkles
                      size={21}
                      className="text-cyan-300"
                    />
                  </div>

                  <h3 className="mt-5 font-bold text-white">
                    AI Planning
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Generate structured project plans from a
                    mission brief.
                  </p>
                </div>

                <div className="group rounded-2xl border border-blue-400/15 bg-[#031022]/65 p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-blue-400/35">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-400/10">
                    <Target
                      size={21}
                      className="text-blue-300"
                    />
                  </div>

                  <h3 className="mt-5 font-bold text-white">
                    Mission Health
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Track progress, risks, deadlines, and
                    operational readiness.
                  </p>
                </div>

                <div className="group rounded-2xl border border-violet-400/15 bg-[#031022]/65 p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-violet-400/35">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10">
                    <Zap
                      size={21}
                      className="text-violet-300"
                    />
                  </div>

                  <h3 className="mt-5 font-bold text-white">
                    Execution
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Run tasks, milestones, Kanban, and timelines
                    from one cockpit.
                  </p>
                </div>

                <div className="group rounded-2xl border border-emerald-400/15 bg-[#031022]/65 p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-emerald-400/35">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10">
                    <Bot
                      size={21}
                      className="text-emerald-300"
                    />
                  </div>

                  <h3 className="mt-5 font-bold text-white">
                    AI Communications
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Generate and send project communications
                    directly to your crew.
                  </p>
                </div>
              </section>

              {/* PROJECT CTA */}

              <section className="mt-7 flex flex-col gap-5 rounded-2xl border border-cyan-400/15 bg-[#031022]/60 p-6 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400/60">
                    Mission Portfolio
                  </p>

                  <h3 className="mt-2 text-xl font-bold text-white">
                    Continue an active mission
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Open your project command center and continue
                    execution.
                  </p>
                </div>

                <Link
                  href="/projects"
                  className="inline-flex items-center gap-2 font-semibold text-cyan-300 transition hover:text-cyan-200"
                >
                  View Projects
                  <ArrowRight size={18} />
                </Link>
              </section>
            </>
          ) : (
            <div className="pb-16">
              {/* FORM HEADER */}

              <div className="mb-7">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-400/70">
                  Mission Creation
                </p>

                <h1 className="mt-2 text-4xl font-black tracking-tight text-white">
                  Launch New Mission
                </h1>

                <p className="mt-2 text-slate-400">
                  Define the objective and let PMPilot generate the
                  execution plan.
                </p>
              </div>

              <div
                className={`grid gap-8 ${
                  result
                    ? "xl:grid-cols-2"
                    : "mx-auto max-w-4xl grid-cols-1"
                }`}
              >
                <MissionForm
                  name={name}
                  description={description}
                  budget={budget}
                  deadline={deadline}
                  priority={priority}
                  projectType={projectType}
                  teamSize={teamSize}
                  loading={loading}
                  error={error}
                  onNameChange={setName}
                  onDescriptionChange={setDescription}
                  onBudgetChange={setBudget}
                  onDeadlineChange={setDeadline}
                  onPriorityChange={setPriority}
                  onProjectTypeChange={setProjectType}
                  onTeamSizeChange={setTeamSize}
                  onSubmit={handleSubmit}
                  onBack={returnHome}
                />

                <ResultPanel
                  result={result}
                  copied={copied}
                  saved={saved}
                  onCopy={copyPlan}
                  onGenerateAnother={generateAnother}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

