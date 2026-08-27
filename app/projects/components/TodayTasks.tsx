"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Clock3,
  Plus,
  Trash2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Task = {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  assigned_to: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  completed: boolean;
};

type TodayTasksProps = {
  projectId: number;
};

export default function TodayTasks({
  projectId,
}: TodayTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  async function loadTasks() {
    const { data, error: loadError } = await supabase
      .from("project_tasks")
      .select("*")
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
        .select("*")
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

  async function addTask() {
    if (!title.trim()) return;

    setAdding(true);
    setError("");

    const { error: insertError } = await supabase
      .from("project_tasks")
      .insert({
        project_id: projectId,
        title: title.trim(),
        priority: "Medium",
        status: "Not Started",
        completed: false,
      });

    if (insertError) {
      setError(insertError.message);
      setAdding(false);
      return;
    }

    setTitle("");
    await loadTasks();
    setAdding(false);
  }

  async function toggleTask(task: Task) {
    const completed = !task.completed;

    const { error: updateError } = await supabase
      .from("project_tasks")
      .update({
        completed,
        status: completed ? "Completed" : "Not Started",
      })
      .eq("id", task.id)
      .eq("project_id", projectId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadTasks();
  }

  async function deleteTask(id: number) {
    const { error: deleteError } = await supabase
      .from("project_tasks")
      .delete()
      .eq("id", id)
      .eq("project_id", projectId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadTasks();
  }

  function priorityStyles(priority: string) {
    if (priority === "Critical") {
      return "border-red-400/25 bg-red-400/10 text-red-300";
    }

    if (priority === "High") {
      return "border-orange-400/25 bg-orange-400/10 text-orange-300";
    }

    if (priority === "Medium") {
      return "border-amber-400/25 bg-amber-400/10 text-amber-300";
    }

    return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";
  }

  const completedCount = tasks.filter(
    (task) => task.completed
  ).length;

  return (
    <section className="relative h-full overflow-hidden rounded-3xl border border-cyan-400/15 bg-[#031022]/70 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full border border-cyan-400/10">
        <div className="absolute inset-5 rounded-full border border-blue-400/10" />
      </div>

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400/60">
              Mission Execution
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Today&apos;s Objectives
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Immediate mission-critical work.
            </p>
          </div>

          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-center">
            <p className="text-lg font-black text-cyan-300">
              {completedCount}/{tasks.length}
            </p>

            <p className="text-[9px] uppercase tracking-wider text-slate-500">
              Complete
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <input
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void addTask();
              }
            }}
            placeholder="Add mission objective..."
            className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
          />

          <button
            type="button"
            onClick={() => void addTask()}
            disabled={adding}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 transition hover:bg-cyan-400/20 disabled:opacity-50"
          >
            <Plus size={19} />
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="mt-6 space-y-3">
          {loading && (
            <p className="text-sm text-slate-500">
              Loading objectives...
            </p>
          )}

          {!loading && tasks.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-800 p-7 text-center">
              <Circle
                size={24}
                className="mx-auto text-slate-700"
              />

              <p className="mt-3 text-sm text-slate-500">
                No objectives assigned.
              </p>
            </div>
          )}

          {tasks.map((task) => (
            <article
              key={task.id}
              className="group rounded-2xl border border-slate-800/80 bg-slate-950/55 p-4 transition hover:border-cyan-400/25 hover:bg-slate-950/75"
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() =>
                    void toggleTask(task)
                  }
                  className="mt-0.5 shrink-0"
                >
                  {task.completed ? (
                    <CheckCircle2
                      size={21}
                      className="text-emerald-400"
                    />
                  ) : (
                    <Circle
                      size={21}
                      className="text-slate-600 transition group-hover:text-cyan-300"
                    />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={`font-semibold ${
                      task.completed
                        ? "text-slate-600 line-through"
                        : "text-white"
                    }`}
                  >
                    {task.title}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${priorityStyles(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>

                    {task.due_date && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock3 size={12} />
                        {task.due_date}
                      </span>
                    )}

                    {task.assigned_to && (
                      <span className="text-[11px] text-slate-500">
                        {task.assigned_to}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void deleteTask(task.id)
                  }
                  className="rounded-lg p-2 text-slate-700 opacity-0 transition hover:bg-red-400/10 hover:text-red-300 group-hover:opacity-100"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

