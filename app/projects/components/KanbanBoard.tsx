"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock3,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type TaskStatus = "Not Started" | "In Progress" | "Completed";

type Task = {
  id: number;
  title: string;
  assigned_to: string | null;
  priority: string;
  status: TaskStatus;
  due_date: string | null;
  completed: boolean;
};

type KanbanBoardProps = {
  projectId: number;
};

const columns: {
  title: string;
  subtitle: string;
  status: TaskStatus;
}[] = [
  {
    title: "To Do",
    subtitle: "Queued work",
    status: "Not Started",
  },
  {
    title: "In Progress",
    subtitle: "Active execution",
    status: "In Progress",
  },
  {
    title: "Completed",
    subtitle: "Finished work",
    status: "Completed",
  },
];

export default function KanbanBoard({
  projectId,
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function loadTasks() {
    const { data, error: loadError } = await supabase
      .from("project_tasks")
      .select(
        "id, title, assigned_to, priority, status, due_date, completed"
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (loadError) {
      setError(loadError.message);
      return;
    }

    setTasks((data || []) as Task[]);
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchTasks() {
      const { data, error: loadError } = await supabase
        .from("project_tasks")
        .select(
          "id, title, assigned_to, priority, status, due_date, completed"
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (loadError) {
        setError(loadError.message);
        setLoading(false);
        return;
      }

      setTasks((data || []) as Task[]);
      setLoading(false);
    }

    void fetchTasks();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function moveTask(
    task: Task,
    status: TaskStatus
  ) {
    if (task.status === status) return;

    setMovingId(task.id);
    setError("");

    const completed = status === "Completed";

    const { error: updateError } = await supabase
      .from("project_tasks")
      .update({
        status,
        completed,
      })
      .eq("id", task.id)
      .eq("project_id", projectId);

    if (updateError) {
      setError(updateError.message);
      setMovingId(null);
      return;
    }

    await loadTasks();
    setMovingId(null);
  }

  function getPriorityStyles(priority: string) {
    switch (priority) {
      case "Critical":
        return "border-red-400/25 bg-red-400/10 text-red-300";

      case "High":
        return "border-orange-400/25 bg-orange-400/10 text-orange-300";

      case "Medium":
        return "border-amber-400/25 bg-amber-400/10 text-amber-300";

      default:
        return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";
    }
  }

  function getColumnAccent(status: TaskStatus) {
    if (status === "Completed") {
      return "border-emerald-400/20 bg-emerald-400/5";
    }

    if (status === "In Progress") {
      return "border-blue-400/20 bg-blue-400/5";
    }

    return "border-cyan-400/15 bg-cyan-400/[0.03]";
  }

  return (
    <section className="relative h-full overflow-hidden rounded-3xl border border-cyan-400/15 bg-[#031022]/70 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full border border-cyan-400/10">
        <div className="absolute inset-6 rounded-full border border-blue-400/10" />
      </div>

      <div className="relative">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400/60">
            Workflow Control
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            Task Board
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Track work from assignment to completion.
          </p>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-6 text-sm text-slate-500">
            Loading task board...
          </p>
        ) : (
          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            {columns.map((column) => {
              const columnTasks = tasks.filter(
                (task) => task.status === column.status
              );

              return (
                <div
                  key={column.status}
                  className={`rounded-2xl border p-4 ${getColumnAccent(
                    column.status
                  )}`}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {column.status === "Completed" ? (
                          <CheckCircle2
                            size={16}
                            className="text-emerald-400"
                          />
                        ) : (
                          <Circle
                            size={16}
                            className={
                              column.status === "In Progress"
                                ? "text-blue-300"
                                : "text-cyan-300"
                            }
                          />
                        )}

                        <p className="font-bold text-white">
                          {column.title}
                        </p>
                      </div>

                      <p className="mt-1 text-[11px] text-slate-500">
                        {column.subtitle}
                      </p>
                    </div>

                    <span className="rounded-full border border-cyan-400/20 bg-slate-950/50 px-2.5 py-1 text-xs font-bold text-cyan-300">
                      {columnTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {columnTasks.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-600">
                        No tasks
                      </div>
                    )}

                    {columnTasks.map((task) => (
                      <article
                        key={task.id}
                        className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 transition hover:-translate-y-0.5 hover:border-cyan-400/25 hover:bg-slate-950/80"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-semibold leading-5 text-white">
                            {task.title}
                          </p>

                          <span
                            className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${getPriorityStyles(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        <div className="mt-3 space-y-1">
                          {task.assigned_to && (
                            <p className="text-[11px] text-slate-500">
                              Assigned: {task.assigned_to}
                            </p>
                          )}

                          {task.due_date && (
                            <p className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                              <Clock3 size={12} />
                              Due {task.due_date}
                            </p>
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {column.status !==
                            "Not Started" && (
                            <button
                              type="button"
                              disabled={
                                movingId === task.id
                              }
                              onClick={() =>
                                void moveTask(
                                  task,
                                  column.status ===
                                    "Completed"
                                    ? "In Progress"
                                    : "Not Started"
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-cyan-400/30 hover:text-white disabled:opacity-50"
                            >
                              <ArrowLeft size={13} />
                              Back
                            </button>
                          )}

                          {column.status !==
                            "Completed" && (
                            <button
                              type="button"
                              disabled={
                                movingId === task.id
                              }
                              onClick={() =>
                                void moveTask(
                                  task,
                                  column.status ===
                                    "Not Started"
                                    ? "In Progress"
                                    : "Completed"
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-300 transition hover:bg-cyan-400/20 disabled:opacity-50"
                            >
                              {movingId === task.id
                                ? "Moving..."
                                : column.status ===
                                    "Not Started"
                                  ? "Start"
                                  : "Complete"}

                              {movingId !== task.id && (
                                <ArrowRight size={13} />
                              )}
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

