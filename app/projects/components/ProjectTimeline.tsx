"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Diamond,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Task = {
  id: number;
  title: string;
  due_date: string | null;
  status: string;
  completed: boolean;
  priority: string;
};

type Milestone = {
  id: number;
  title: string;
  due_date: string | null;
  status: string;
  completed: boolean;
};

type TimelineItem = {
  id: string;
  title: string;
  date: string;
  type: "Task" | "Milestone";
  status: string;
  completed: boolean;
  priority?: string;
};

type ProjectTimelineProps = {
  projectId: number;
};

export default function ProjectTimeline({
  projectId,
}: ProjectTimelineProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadTimelineData() {
      const [taskResult, milestoneResult] = await Promise.all([
        supabase
          .from("project_tasks")
          .select(
            "id, title, due_date, status, completed, priority"
          )
          .eq("project_id", projectId),

        supabase
          .from("project_milestones")
          .select(
            "id, title, due_date, status, completed"
          )
          .eq("project_id", projectId),
      ]);

      if (cancelled) return;

      if (taskResult.error) {
        setError(taskResult.error.message);
      } else {
        setTasks((taskResult.data || []) as Task[]);
      }

      if (milestoneResult.error) {
        setError(milestoneResult.error.message);
      } else {
        setMilestones(
          (milestoneResult.data || []) as Milestone[]
        );
      }

      setLoading(false);
    }

    void loadTimelineData();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const timeline = useMemo(() => {
    const taskItems: TimelineItem[] = tasks
      .filter((task) => task.due_date)
      .map((task) => ({
        id: `task-${task.id}`,
        title: task.title,
        date: task.due_date as string,
        type: "Task",
        status: task.status,
        completed: task.completed,
        priority: task.priority,
      }));

    const milestoneItems: TimelineItem[] = milestones
      .filter((milestone) => milestone.due_date)
      .map((milestone) => ({
        id: `milestone-${milestone.id}`,
        title: milestone.title,
        date: milestone.due_date as string,
        type: "Milestone",
        status: milestone.status,
        completed: milestone.completed,
      }));

    return [...taskItems, ...milestoneItems].sort(
      (a, b) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime()
    );
  }, [tasks, milestones]);

  function getDateState(item: TimelineItem) {
    if (item.completed) return "Complete";

    const today = new Date();
    const due = new Date(`${item.date}T23:59:59`);

    if (due < today) return "Overdue";

    const difference = Math.ceil(
      (due.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (difference <= 3) return "Due Soon";

    return "Upcoming";
  }

  function stateStyles(state: string) {
    if (state === "Complete") {
      return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
    }

    if (state === "Overdue") {
      return "border-red-400/25 bg-red-400/10 text-red-300";
    }

    if (state === "Due Soon") {
      return "border-amber-400/25 bg-amber-400/10 text-amber-300";
    }

    return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";
  }

  return (
    <section className="relative mt-8 overflow-hidden rounded-3xl border border-cyan-400/15 bg-[#031022]/70 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full border border-cyan-400/10">
        <div className="absolute inset-7 rounded-full border border-blue-400/10" />
      </div>

      <div className="relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400/60">
              Schedule
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Project Timeline
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              See upcoming deadlines and completed milestones.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-cyan-400/15 bg-cyan-400/5 px-3 py-2 text-xs text-slate-400">
            <CalendarDays
              size={15}
              className="text-cyan-300"
            />

            {timeline.length} scheduled items
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-6 text-sm text-slate-500">
            Loading project timeline...
          </p>
        ) : timeline.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-800 p-8 text-center">
            <CalendarDays
              size={28}
              className="mx-auto text-slate-700"
            />

            <p className="mt-3 text-sm text-slate-500">
              Add due dates to tasks or milestones to build
              the project timeline.
            </p>
          </div>
        ) : (
          <div className="relative mt-8">
            <div className="absolute bottom-0 left-4 top-0 w-px bg-linear-to-b from-cyan-400/40 via-blue-400/20 to-transparent" />

            <div className="space-y-5">
              {timeline.map((item) => {
                const state = getDateState(item);

                return (
                  <article
                    key={item.id}
                    className="relative pl-12"
                  >
                    <div className="absolute left-0 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/25 bg-[#020817] shadow-[0_0_18px_rgba(34,211,238,0.12)]">
                      {item.type === "Milestone" ? (
                        <Diamond
                          size={14}
                          className={
                            item.completed
                              ? "text-emerald-400"
                              : "text-violet-300"
                          }
                        />
                      ) : item.completed ? (
                        <CheckCircle2
                          size={15}
                          className="text-emerald-400"
                        />
                      ) : (
                        <Clock3
                          size={14}
                          className={
                            state === "Overdue"
                              ? "text-red-400"
                              : state === "Due Soon"
                                ? "text-amber-300"
                                : "text-cyan-300"
                          }
                        />
                      )}
                    </div>

                    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/55 p-4 transition hover:border-cyan-400/25 hover:bg-slate-950/75">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-white">
                              {item.title}
                            </p>

                            <span className="rounded-full border border-slate-700 bg-slate-900/50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              {item.type}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays size={12} />

                              {new Date(
                                `${item.date}T00:00:00`
                              ).toLocaleDateString()}
                            </span>

                            {item.priority && (
                              <span>
                                Priority: {item.priority}
                              </span>
                            )}
                          </div>
                        </div>

                        <span
                          className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${stateStyles(
                            state
                          )}`}
                        >
                          {state}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

