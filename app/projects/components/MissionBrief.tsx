"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Copy,
  Database,
  Lightbulb,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

type ProjectTask = {
  id: number;
  title: string;
  assigned_to: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  completed: boolean;
};

type Milestone = {
  id: number;
  title: string;
  due_date: string | null;
  status: string;
  completed: boolean;
};

type TeamMember = {
  id: number;
  name: string;
  email: string | null;
  role: string;
};

type MissionBriefProps = {
  projectId: number;
  projectName: string;
  projectDescription: string;
  deadline: string;
  priority: string;
  budget: number | null;
  teamSize: number;
  status: string;
};

export default function MissionBrief({
  projectId,
  projectName,
  projectDescription,
  deadline,
  priority,
  budget,
  teamSize,
  status,
}: MissionBriefProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingContext, setLoadingContext] = useState(true);
  const [contextError, setContextError] = useState("");

  const [copiedId, setCopiedId] = useState<number | null>(null);

  async function loadProjectContext() {
    setLoadingContext(true);
    setContextError("");

    const [tasksResult, milestonesResult, membersResult] =
      await Promise.all([
        supabase
          .from("project_tasks")
          .select(
            "id, title, assigned_to, priority, status, due_date, completed"
          )
          .eq("project_id", projectId),

        supabase
          .from("project_milestones")
          .select(
            "id, title, due_date, status, completed"
          )
          .eq("project_id", projectId),

        supabase
          .from("project_members")
          .select("id, name, email, role")
          .eq("project_id", projectId),
      ]);

    const errors = [
      tasksResult.error?.message,
      milestonesResult.error?.message,
      membersResult.error?.message,
    ].filter(Boolean);

    if (errors.length > 0) {
      setContextError(errors.join(" | "));
    }

    if (!tasksResult.error) {
      setTasks((tasksResult.data || []) as ProjectTask[]);
    }

    if (!milestonesResult.error) {
      setMilestones(
        (milestonesResult.data || []) as Milestone[]
      );
    }

    if (!membersResult.error) {
      setMembers(
        (membersResult.data || []) as TeamMember[]
      );
    }

    setLoadingContext(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      const [tasksResult, milestonesResult, membersResult] =
        await Promise.all([
          supabase
            .from("project_tasks")
            .select(
              "id, title, assigned_to, priority, status, due_date, completed"
            )
            .eq("project_id", projectId),

          supabase
            .from("project_milestones")
            .select(
              "id, title, due_date, status, completed"
            )
            .eq("project_id", projectId),

          supabase
            .from("project_members")
            .select("id, name, email, role")
            .eq("project_id", projectId),
        ]);

      if (cancelled) return;

      const errors = [
        tasksResult.error?.message,
        milestonesResult.error?.message,
        membersResult.error?.message,
      ].filter(Boolean);

      if (errors.length > 0) {
        setContextError(errors.join(" | "));
      }

      if (!tasksResult.error) {
        setTasks(
          (tasksResult.data || []) as ProjectTask[]
        );
      }

      if (!milestonesResult.error) {
        setMilestones(
          (milestonesResult.data || []) as Milestone[]
        );
      }

      if (!membersResult.error) {
        setMembers(
          (membersResult.data || []) as TeamMember[]
        );
      }

      setLoadingContext(false);
    }

    void initialLoad();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function askAssistant() {
    if (!input.trim() || loading) return;

    const question = input.trim();
    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: question,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const [tasksResult, milestonesResult, membersResult] = await Promise.all([
        supabase
          .from("project_tasks")
          .select("id, title, assigned_to, priority, status, due_date, completed")
          .eq("project_id", projectId),
        supabase
          .from("project_milestones")
          .select("id, title, due_date, status, completed")
          .eq("project_id", projectId),
        supabase
          .from("project_members")
          .select("id, name, email, role")
          .eq("project_id", projectId),
      ]);

      const freshTasks =
        !tasksResult.error && tasksResult.data
          ? (tasksResult.data as ProjectTask[])
          : tasks;

      const freshMilestones =
        !milestonesResult.error && milestonesResult.data
          ? (milestonesResult.data as Milestone[])
          : milestones;

      const freshMembers =
        !membersResult.error && membersResult.data
          ? (membersResult.data as TeamMember[])
          : members;

      setTasks(freshTasks);
      setMilestones(freshMilestones);
      setMembers(freshMembers);

      const response = await fetch("/api/project-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName,
          projectDescription,
          deadline,
          priority,
          budget,
          teamSize,
          status,
          tasks: freshTasks,
          milestones: freshMilestones,
          members: freshMembers,
          question,
        }),
      });

      const data: { result?: string; error?: string } =
        await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI Assistant request failed.");
      }

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.result || "No response was returned.",
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (caughtError) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          caughtError instanceof Error
            ? caughtError.message
            : "Something went wrong.",
      };

      setMessages((current) => [...current, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  async function copyMessage(message: Message) {
    try {
      await navigator.clipboard.writeText(
        message.content
      );

      setCopiedId(message.id);

      window.setTimeout(() => {
        setCopiedId(null);
      }, 1600);
    } catch {
      return;
    }
  }

  function applyPrompt(prompt: string) {
    setInput(prompt);
  }

  return (
    <section className="relative mt-8 overflow-hidden rounded-3xl border border-cyan-400/15 bg-[#031022]/70 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
      <div className="relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400/60">
              Project Intelligence
            </p>

            <h2 className="mt-2 flex items-center gap-2 text-2xl font-black text-white">
              <Bot
                size={24}
                className="text-cyan-300"
              />
              AI Assistant
            </h2>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Ask PMPilot questions using your current
              tasks, milestones, team, deadlines, and
              project information.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/5 px-3 py-2">
              <div className="flex items-center gap-2">
                <Database
                  size={14}
                  className="text-cyan-300"
                />

                <span className="text-xs text-slate-400">
                  {loadingContext
                    ? "Loading context..."
                    : "Project context loaded"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadProjectContext()
              }
              disabled={loadingContext}
              aria-label="Refresh project context"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-950/50 text-slate-500 transition hover:border-cyan-400/30 hover:text-cyan-300 disabled:opacity-40"
            >
              <RefreshCw
                size={15}
                className={
                  loadingContext
                    ? "animate-spin"
                    : ""
                }
              />
            </button>
          </div>
        </div>

        {contextError && (
          <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-300">
            Some project information could not be
            loaded: {contextError}
          </p>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-600">
              Tasks
            </p>

            <p className="mt-1 font-bold text-white">
              {tasks.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-600">
              Milestones
            </p>

            <p className="mt-1 font-bold text-white">
              {milestones.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-600">
              Team Members
            </p>

            <p className="mt-1 font-bold text-white">
              {members.length}
            </p>
          </div>
        </div>

        {messages.length === 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <Lightbulb
                size={16}
                className="text-amber-300"
              />
              Try asking
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {[
                "What should I focus on next?",
                "What tasks are overdue?",
                "Summarize the biggest project risks.",
                "Who has the most open work?",
                "What milestones are coming up?",
                "Draft a project status update.",
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() =>
                    applyPrompt(prompt)
                  }
                  className="rounded-full border border-slate-700 bg-slate-950/50 px-3 py-2 text-xs text-slate-400 transition hover:border-cyan-400/30 hover:text-cyan-200"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div className="mt-6 max-h-[520px] space-y-4 overflow-y-auto pr-1">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`rounded-2xl border p-4 ${
                  message.role === "user"
                    ? "ml-8 border-cyan-400/20 bg-cyan-400/5"
                    : "mr-8 border-slate-800 bg-slate-950/60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      {message.role === "user"
                        ? "You"
                        : "PMPilot AI"}
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                      {message.content}
                    </p>
                  </div>

                  {message.role ===
                    "assistant" && (
                    <button
                      type="button"
                      onClick={() =>
                        void copyMessage(message)
                      }
                      className="shrink-0 rounded-lg p-2 text-slate-600 transition hover:bg-cyan-400/10 hover:text-cyan-300"
                    >
                      {copiedId === message.id ? (
                        <CheckCircle2
                          size={14}
                          className="text-emerald-300"
                        />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <textarea
            value={input}
            onChange={(event) =>
              setInput(event.target.value)
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();
                void askAssistant();
              }
            }}
            rows={3}
            placeholder={`Ask PMPilot about ${projectName}...`}
            className="min-w-0 flex-1 resize-none rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
          />

          <button
            type="button"
            onClick={() =>
              void askAssistant()
            }
            disabled={
              loading ||
              loadingContext ||
              !input.trim()
            }
            className="flex w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <Sparkles
                size={19}
                className="animate-pulse"
              />
            ) : (
              <Send size={19} />
            )}
          </button>
        </div>

        {loading && (
          <p className="mt-3 text-xs text-cyan-300">
            PMPilot is analyzing current project
            information...
          </p>
        )}
      </div>
    </section>
  );
}

