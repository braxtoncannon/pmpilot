"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type TeamMember = {
  id: number;
  name: string;
  role: string;
};

type Task = {
  id: number;
  assigned_to: string | null;
  completed: boolean;
};

type CrewWorkloadProps = {
  projectId: number;
};

export default function CrewWorkload({
  projectId,
}: CrewWorkloadProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      const [membersResult, tasksResult] = await Promise.all([
        supabase
          .from("project_members")
          .select("id, name, role")
          .eq("project_id", projectId),

        supabase
          .from("project_tasks")
          .select("id, assigned_to, completed")
          .eq("project_id", projectId),
      ]);

      if (cancelled) return;

      if (!membersResult.error) {
        setMembers(
          (membersResult.data || []) as TeamMember[]
        );
      }

      if (!tasksResult.error) {
        setTasks((tasksResult.data || []) as Task[]);
      }

      setLoading(false);
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const workload = useMemo(() => {
    return members.map((member) => {
      const assigned = tasks.filter(
        (task) => task.assigned_to === member.name
      );

      const openTasks = assigned.filter(
        (task) => !task.completed
      ).length;

      const completedTasks = assigned.filter(
        (task) => task.completed
      ).length;

      return {
        ...member,
        openTasks,
        completedTasks,
        totalTasks: assigned.length,
      };
    });
  }, [members, tasks]);

  const maxTasks = Math.max(
    1,
    ...workload.map((member) => member.openTasks)
  );

  return (
    <section className="relative mt-8 overflow-hidden rounded-3xl border border-cyan-400/15 bg-[#031022]/70 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400/60">
              Resource Management
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Team Workload
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              See how project work is distributed across team members.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-cyan-400/15 bg-cyan-400/5 px-3 py-2 text-xs text-slate-400">
            <Users size={15} className="text-cyan-300" />
            {members.length} team members
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {loading && (
            <p className="text-sm text-slate-500">
              Loading team workload...
            </p>
          )}

          {!loading && workload.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-800 p-7 text-center">
              <Users
                size={28}
                className="mx-auto text-slate-700"
              />

              <p className="mt-3 text-sm text-slate-500">
                Add team members to begin workload tracking.
              </p>
            </div>
          )}

          {workload.map((member) => {
            const percentage = Math.round(
              (member.openTasks / maxTasks) * 100
            );

            const overloaded =
              member.openTasks >= 6 && percentage >= 80;

            return (
              <article
                key={member.id}
                className="rounded-2xl border border-slate-800/80 bg-slate-950/55 p-4 transition hover:border-cyan-400/20"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-white">
                      {member.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {member.role}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-700 bg-slate-900/50 px-3 py-1 text-xs text-slate-400">
                      {member.openTasks} open
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                      <CheckCircle2 size={12} />
                      {member.completedTasks} completed
                    </span>

                    {overloaded && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
                        <AlertTriangle size={12} />
                        Heavy Load
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Current workload
                    </span>

                    <span className="font-semibold text-cyan-300">
                      {member.openTasks} active tasks
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-900">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        overloaded
                          ? "bg-linear-to-r from-amber-500 to-red-400"
                          : "bg-linear-to-r from-blue-600 via-cyan-400 to-emerald-400"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

