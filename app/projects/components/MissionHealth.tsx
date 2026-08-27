"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Project } from "./ProjectTypes";

type MissionHealthProps = {
  project: Project;
};

type Task = {
  id: number;
  project_id: number;
  completed: boolean;
  status: string;
  priority: string;
  due_date: string | null;
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getDaysRemaining(deadline: string) {
  const now = new Date();
  const due = new Date(`${deadline}T23:59:59`);

  return Math.ceil(
    (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function HealthBar({
  label,
  subtitle,
  value,
}: {
  label: string;
  subtitle: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-cyan-400/10 bg-slate-950/40 p-4 backdrop-blur-xl">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <p className="font-semibold text-white">{label}</p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>

        <span className="font-mono text-sm font-bold text-cyan-300">
          {value}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-900">
        <div
          className="h-full rounded-full bg-linear-to-r from-blue-600 via-cyan-400 to-emerald-400 shadow-[0_0_16px_rgba(34,211,238,0.55)] transition-all duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function MissionHealth({
  project,
}: MissionHealthProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadTasks() {
      const { data, error } = await supabase
        .from("project_tasks")
        .select("id, project_id, completed, status, priority, due_date")
        .eq("project_id", project.id);

      if (cancelled) return;

      if (!error && data) {
        setTasks(data as Task[]);
      }

      setLoadingTasks(false);
    }

    void loadTasks();

    return () => {
      cancelled = true;
    };
  }, [project.id]);

  const metrics = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.completed).length;

    const progress =
      totalTasks === 0
        ? 0
        : Math.round((completedTasks / totalTasks) * 100);

    const now = new Date();

    const overdueTasks = tasks.filter((task) => {
      if (!task.due_date || task.completed) {
        return false;
      }

      return new Date(`${task.due_date}T23:59:59`) < now;
    }).length;

    const criticalOpenTasks = tasks.filter(
      (task) =>
        !task.completed &&
        task.priority === "Critical"
    ).length;

    return {
      totalTasks,
      completedTasks,
      progress,
      overdueTasks,
      criticalOpenTasks,
    };
  }, [tasks]);

  const daysRemaining = getDaysRemaining(project.deadline);

  const scheduleHealth = clamp(
    100 -
      metrics.overdueTasks * 15 -
      (daysRemaining < 0 ? 35 : 0) -
      (daysRemaining >= 0 && daysRemaining <= 3 ? 15 : 0)
  );

  const budgetHealth = project.budget === null ? 75 : 90;

  const crewHealth = clamp(
    project.team_size <= 1
      ? 70
      : 75 + Math.min(project.team_size, 5) * 4
  );

  const riskHealth = clamp(
    100 -
      metrics.criticalOpenTasks * 15 -
      metrics.overdueTasks * 8
  );

  const overallHealth = clamp(
    (scheduleHealth +
      budgetHealth +
      crewHealth +
      riskHealth) /
      4
  );

  const healthLabel =
    overallHealth >= 80
      ? "Healthy"
      : overallHealth >= 60
        ? "Watch"
        : overallHealth >= 40
          ? "At Risk"
          : "Critical";

  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="group relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-slate-950/50 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border border-cyan-400/15">
          <div className="absolute inset-6 rounded-full border border-blue-400/10" />
          <div className="absolute inset-12 rounded-full bg-cyan-400/5 blur-2xl" />
        </div>

        <p className="mission-label">Mission Readiness</p>

        <div className="relative mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-full border border-cyan-400/20 bg-slate-950/80 shadow-[0_0_45px_rgba(34,211,238,0.16)]">
            <div
              className="absolute inset-2 rounded-full"
              style={{
                background: `conic-gradient(
                  rgb(34 211 238) ${overallHealth}%,
                  rgb(15 23 42) ${overallHealth}%
                )`,
              }}
            />

            <div className="absolute inset-5 rounded-full border border-cyan-400/10 bg-slate-950" />

            <div className="relative text-center">
              <p className="text-4xl font-black tracking-tight text-white">
                {overallHealth}%
              </p>

              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                {healthLabel}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              Overall Mission Health
            </p>

            <h2 className="mt-2 text-3xl font-bold text-white">
              {healthLabel}
            </h2>

            <p className="mt-3 text-sm text-slate-400">
              {daysRemaining < 0
                ? `${Math.abs(daysRemaining)} days overdue`
                : daysRemaining === 0
                  ? "Deadline is today"
                  : `${daysRemaining} days remaining`}
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-cyan-300">
                {metrics.completedTasks}/{metrics.totalTasks} tasks complete
              </span>

              <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-slate-300">
                {metrics.overdueTasks} overdue
              </span>

              <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-slate-300">
                {metrics.criticalOpenTasks} critical
              </span>
            </div>
          </div>
        </div>

        <div className="mt-7">
          <HealthBar
            label="Mission Progress"
            subtitle={
              loadingTasks
                ? "Loading task progress..."
                : `${metrics.completedTasks} of ${metrics.totalTasks} tasks complete`
            }
            value={metrics.progress}
          />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/45 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-cyan-400/5 blur-3xl" />

        <p className="mission-label">Mission Systems</p>

        <h2 className="mt-2 text-2xl font-bold text-white">
          Operational Health
        </h2>

        <div className="mt-6 grid gap-4">
          <HealthBar
            label="Navigation"
            subtitle={`${metrics.overdueTasks} overdue tasks`}
            value={scheduleHealth}
          />

          <HealthBar
            label="Fuel"
            subtitle="Budget readiness"
            value={budgetHealth}
          />

          <HealthBar
            label="Crew"
            subtitle={`${project.team_size} team members`}
            value={crewHealth}
          />

          <HealthBar
            label="Shields"
            subtitle={`${metrics.criticalOpenTasks} open critical tasks`}
            value={riskHealth}
          />
        </div>
      </div>
    </section>
  );
}

