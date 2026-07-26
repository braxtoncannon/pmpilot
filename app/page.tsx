"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/lib/supabase";

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
    checkSession();
  }, [router]);

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-slate-700">Loading...</p>
      </main>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      router.replace("/auth");
      return;
    }

    if (!name.trim() || !description.trim() || !deadline) {
      setError("Please enter a project name, description, and deadline.");
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

let data: { error?: string; projectPlan?: string; result?: string };

try {
  data = JSON.parse(responseText);
} catch {
  throw new Error(
    `The project generator returned an invalid response. Server status: ${response.status}. Check the terminal for the API error.`
  );
}

if (!response.ok) {
  throw new Error(data.error || "Failed to generate project.");
}

      const generatedPlan =
        data.projectPlan ||
        data.result ||
        "No project plan was returned.";

      setResult(generatedPlan);

      const { error: saveError } = await supabase.from("projects").insert({
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

  const inputStyles =
    "w-full rounded-lg border border-slate-300 bg-white p-3 text-black placeholder:text-slate-500 outline-none focus:border-blue-500";

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-12">
      <div className="mx-auto w-full max-w-6xl rounded-2xl bg-white p-10 shadow-xl">
        <h1 className="text-4xl font-bold text-slate-900">PMPilot</h1>

        <p className="mt-4 text-slate-600">
          AI Project Management Assistant
        </p>

        {!showForm ? (
          <div className="mt-8 grid gap-4">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-lg bg-blue-600 p-4 text-white transition hover:bg-blue-700"
            >
              Create New Project
            </button>

            <Link
              href="/projects"
              className="rounded-lg bg-slate-200 p-4 text-center text-slate-900 transition hover:bg-slate-300"
            >
              View Projects
            </Link>

            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                router.replace("/auth");
                router.refresh();
              }}
              className="rounded-lg bg-slate-800 p-4 text-white hover:bg-slate-900"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div
            className={`mt-8 grid gap-8 ${
              result ? "lg:grid-cols-2" : "grid-cols-1"
            }`}
          >
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block font-medium text-slate-800">
                  Project Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Example: Campus Event Planner"
                  className={inputStyles}
                />
              </div>

              <div>
                <label className="mb-2 block font-medium text-slate-800">
                  Project Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe what you want to accomplish"
                  rows={4}
                  className={inputStyles}
                />
              </div>

              <div>
                <label className="mb-2 block font-medium text-slate-800">
                  Deadline
                </label>

                <input
                  type="date"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                  className={inputStyles}
                />
              </div>

              <div>
                <label className="mb-2 block font-medium text-slate-800">
                  Budget ($)
                </label>

                <input
                  type="number"
                  min="0"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  placeholder="1500"
                  className={inputStyles}
                />
              </div>

              <div>
                <label className="mb-2 block font-medium text-slate-800">
                  Priority
                </label>

                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  className={inputStyles}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block font-medium text-slate-800">
                  Project Type
                </label>

                <select
                  value={projectType}
                  onChange={(event) => setProjectType(event.target.value)}
                  className={inputStyles}
                >
                  <option value="Campus Event">Campus Event</option>
                  <option value="Software">Software</option>
                  <option value="Marketing">Marketing</option>
                  <option value="HR">HR</option>
                  <option value="Operations">Operations</option>
                  <option value="Construction">Construction</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block font-medium text-slate-800">
                  Team Size
                </label>

                <input
                  type="number"
                  min="1"
                  value={teamSize}
                  onChange={(event) => setTeamSize(event.target.value)}
                  className={inputStyles}
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 p-3 font-medium text-red-700">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                    setResult("");
                    setCopied(false);
                    setSaved(false);
                  }}
                  disabled={loading}
                  className="w-full rounded-lg bg-slate-200 p-3 text-slate-900 hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-blue-600 p-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Generating..." : "Generate Project Plan"}
                </button>
              </div>
            </form>

            {result && (
              <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Generated Project Plan
                  </h2>

                  {saved && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                      Saved
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto text-slate-800">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="mb-4 mt-6 text-3xl font-bold text-slate-900">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="mb-3 mt-6 text-2xl font-bold text-slate-900">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="mb-3 mt-5 text-xl font-semibold text-slate-900">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="mb-4 leading-7">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="mb-4 list-disc space-y-2 pl-6">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-4 list-decimal space-y-2 pl-6">
                          {children}
                        </ol>
                      ),
                      table: ({ children }) => (
                        <table className="mb-6 w-full min-w-[600px] border-collapse text-sm">
                          {children}
                        </table>
                      ),
                      th: ({ children }) => (
                        <th className="border border-slate-300 bg-slate-200 p-3 text-left font-semibold">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border border-slate-300 p-3 align-top">
                          {children}
                        </td>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-bold text-slate-900">
                          {children}
                        </strong>
                      ),
                      hr: () => <hr className="my-6 border-slate-300" />,
                    }}
                  >
                    {result}
                  </ReactMarkdown>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={copyPlan}
                    className="w-full rounded-lg bg-slate-800 p-3 text-white hover:bg-slate-900"
                  >
                    {copied ? "Copied!" : "Copy Plan"}
                  </button>

                  <button
                    type="button"
                    onClick={generateAnother}
                    className="w-full rounded-lg bg-blue-600 p-3 text-white hover:bg-blue-700"
                  >
                    Generate Another
                  </button>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}


