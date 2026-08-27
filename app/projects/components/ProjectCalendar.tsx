"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flag,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type ProjectCalendarProps = {
  projectId: number;
};

type Task = {
  id: number;
  title: string;
  due_date: string | null;
  completed: boolean;
  priority: string;
};

type Milestone = {
  id: number;
  title: string;
  due_date: string | null;
  completed: boolean;
};

type CalendarItem = {
  id: string;
  title: string;
  date: string;
  type: "Task" | "Milestone";
  completed: boolean;
  priority?: string;
};

export default function ProjectCalendar({
  projectId,
}: ProjectCalendarProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCalendar() {
      const [taskResult, milestoneResult] = await Promise.all([
        supabase
          .from("project_tasks")
          .select("id, title, due_date, completed, priority")
          .eq("project_id", projectId),

        supabase
          .from("project_milestones")
          .select("id, title, due_date, completed")
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

    void loadCalendar();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const upcomingItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const taskItems: CalendarItem[] = tasks
      .filter((task) => task.due_date)
      .map((task) => ({
        id: `task-${task.id}`,
        title: task.title,
        date: task.due_date as string,
        type: "Task",
        completed: task.completed,
        priority: task.priority,
      }));

    const milestoneItems: CalendarItem[] = milestones
      .filter((milestone) => milestone.due_date)
      .map((milestone) => ({
        id: `milestone-${milestone.id}`,
        title: milestone.title,
        date: milestone.due_date as string,
        type: "Milestone",
        completed: milestone.completed,
      }));

    return [...taskItems, ...milestoneItems]
      .sort(
        (a, b) =>
          new Date(a.date).getTime() -
          new Date(b.date).getTime()
      )
      .slice(0, 10);
  }, [tasks, milestones]);

  function getDateState(item: CalendarItem) {
    if (item.completed) return "Completed";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(`${item.date}T00:00:00`);

    if (due < today) return "Overdue";

    const days = Math.ceil(
      (due.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (days === 0) return "Due Today";
    if (days <= 3) return "Due Soon";

    return "Upcoming";
  }

  function stateStyles(state: string) {
    if (state === "Completed") {
      return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
    }

    if (state === "Overdue") {
      return "border-red-400/25 bg-red-400/10 text-red-300";
    }

    if (state === "Due Today") {
      return "border-orange-400/25 bg-orange-400/10 text-orange-300";
    }

    if (state === "Due Soon") {
      return "border-amber-400/25 bg-amber-400/10 text-amber-300";
    }

    return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";
  }

  return (
    <section className="relative mt-8 overflow-hidden rounded-3xl border border-cyan-400/15 bg-[#031022]/70 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400/60">
            Schedule
          </p>

          <h2 className="mt-2 flex items-center gap-2 text-2xl font-black text-white">
            <CalendarDays
              size={23}
              className="text-cyan-300"
            />
            Project Calendar
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Upcoming task deadlines and milestone dates.
          </p>
        </div>

        <span className="rounded-xl border border-cyan-400/15 bg-cyan-400/5 px-3 py-2 text-xs text-slate-400">
          {upcomingItems.length} scheduled
        </span>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">
          Loading calendar...
        </p>
      ) : upcomingItems.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-800 p-8 text-center">
          <CalendarDays
            size={28}
            className="mx-auto text-slate-700"
          />

          <p className="mt-3 text-sm text-slate-500">
            No scheduled tasks or milestones yet.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {upcomingItems.map((item) => {
            const state = getDateState(item);

            return (
              <article
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/5">
                    {item.type === "Milestone" ? (
                      <Flag
                        size={16}
                        className="text-violet-300"
                      />
                    ) : item.completed ? (
                      <CheckCircle2
                        size={16}
                        className="text-emerald-300"
                      />
                    ) : (
                      <Clock3
                        size={16}
                        className="text-cyan-300"
                      />
                    )}
                  </div>

                  <div>
                    <p className="font-semibold text-white">
                      {item.title}
                    </p>

                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>{item.type}</span>
                      <span>•</span>
                      <span>
                        {new Date(
                          `${item.date}T00:00:00`
                        ).toLocaleDateString()}
                      </span>

                      {item.priority && (
                        <>
                          <span>•</span>
                          <span>{item.priority} Priority</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <span
                  className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${stateStyles(
                    state
                  )}`}
                >
                  {state}
                </span>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

