"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Circle,
  Clock3,
  Flag,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type ProjectReportsProps = {
  projectId: number;
  projectName: string;
  projectDescription: string;
  deadline: string;
  priority: string;
  budget: number | null;
  teamSize: number;
  status: string;
};
export default function ProjectReports({
  projectId,
  projectName,
  projectDescription,
  deadline,
  priority,
  budget,
  teamSize,
  status,
}: ProjectReportsProps) {

type Task = {
  id: number;
  title: string;
  priority: string;
  status: string;
  due_date: string | null;
  completed: boolean;
  assigned_to: string | null;
};

type Milestone = {
  id: number;
  title: string;
  status: string;
  due_date: string | null;
  completed: boolean;
};

type TeamMember = {
  id: number;
  name: string;
  role: string;
};

  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiInsight, setAiInsight] = useState("");
const [aiLoading, setAiLoading] = useState(false);
const [aiError, setAiError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      setLoading(true);
      setError("");

      const [tasksResult, milestonesResult, membersResult] =
        await Promise.all([
          supabase
            .from("project_tasks")
            .select(
              "id, title, priority, status, due_date, completed, assigned_to"
            )
            .eq("project_id", projectId),

          supabase
            .from("project_milestones")
            .select(
              "id, title, status, due_date, completed"
            )
            .eq("project_id", projectId),

          supabase
            .from("project_members")
            .select("id, name, role")
            .eq("project_id", projectId),
        ]);

      if (cancelled) return;

      const errors = [
        tasksResult.error?.message,
        milestonesResult.error?.message,
        membersResult.error?.message,
      ].filter(Boolean);

      if (errors.length > 0) {
        setError(errors.join(" | "));
      }

      if (!tasksResult.error) {
        setTasks((tasksResult.data || []) as Task[]);
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

      setLoading(false);
    }

    void loadReports();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const analytics = useMemo(() => {
    const completedTasks = tasks.filter(
      (task) => task.completed
    ).length;

    const inProgressTasks = tasks.filter(
      (task) => task.status === "In Progress"
    ).length;

    const notStartedTasks = tasks.filter(
      (task) =>
        task.status === "Not Started" && !task.completed
    ).length;

    const overdueTasks = tasks.filter((task) => {
      if (!task.due_date || task.completed) return false;

      return (
        new Date(`${task.due_date}T23:59:59`) <
        new Date()
      );
    }).length;

    const dueSoonTasks = tasks.filter((task) => {
      if (!task.due_date || task.completed) return false;

      const due = new Date(
        `${task.due_date}T23:59:59`
      );

      const today = new Date();

      const days = Math.ceil(
        (due.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      return days >= 0 && days <= 3;
    }).length;

    const taskProgress =
      tasks.length === 0
        ? 0
        : Math.round(
            (completedTasks / tasks.length) * 100
          );

    const completedMilestones = milestones.filter(
      (milestone) => milestone.completed
    ).length;

    const milestoneProgress =
      milestones.length === 0
        ? 0
        : Math.round(
            (completedMilestones / milestones.length) *
              100
          );

    const priorities = {
      Critical: tasks.filter(
        (task) => task.priority === "Critical"
      ).length,
      High: tasks.filter(
        (task) => task.priority === "High"
      ).length,
      Medium: tasks.filter(
        (task) => task.priority === "Medium"
      ).length,
      Low: tasks.filter(
        (task) => task.priority === "Low"
      ).length,
    };

    const assignedTasks = tasks.filter(
      (task) => task.assigned_to
    ).length;

    const unassignedTasks =
      tasks.length - assignedTasks;

    return {
      completedTasks,
      inProgressTasks,
      notStartedTasks,
      overdueTasks,
      dueSoonTasks,
      taskProgress,
      completedMilestones,
      milestoneProgress,
      priorities,
      assignedTasks,
      unassignedTasks,
    };
  }, [tasks, milestones]);

  const workload = useMemo(() => {
    return members.map((member) => {
      const assigned = tasks.filter(
        (task) => task.assigned_to === member.name
      );

      const open = assigned.filter(
        (task) => !task.completed
      ).length;

      const complete = assigned.filter(
        (task) => task.completed
      ).length;

      return {
        ...member,
        open,
        complete,
        total: assigned.length,
      };
    });
  }, [members, tasks]);

  const maxWorkload = Math.max(
    1,
    ...workload.map((member) => member.open)
  );
async function generateAIInsights() {
  setAiLoading(true);
  setAiError("");

  try {
    const response = await fetch("/api/project-assistant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectName,
        projectDescription,
        deadline,
        priority,
        budget,
        teamSize,
        status,
        tasks,
        milestones,
        members,
        question:
          "Analyze this project as an executive project manager. Give me: 1) the biggest current risk, 2) the most urgent next action, 3) any deadline concerns, 4) any workload or ownership concerns, and 5) a short overall project health assessment. Base everything only on the supplied project data.",
      }),
    });

    const data: {
      result?: string;
      error?: string;
    } = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Unable to generate AI insights."
      );
    }

    setAiInsight(
      data.result || "No AI insight was returned."
    );
  } catch (caughtError) {
    setAiError(
      caughtError instanceof Error
        ? caughtError.message
        : "Unable to generate AI insights."
    );
  } finally {
    setAiLoading(false);
  }
}
  if (loading) {
  return (
    <section className="mt-8 rounded-3xl border border-cyan-400/15 bg-[#031022]/70 p-6 backdrop-blur-2xl">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400/20 border-t-cyan-300" />

        <div>
          <p className="font-semibold text-white">
            Building project reports
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Loading tasks, milestones, and team analytics...
          </p>
        </div>
      </div>
    </section>
  );
}

  return (
    <section className="relative mt-8 overflow-hidden rounded-3xl border border-cyan-400/15 bg-[#031022]/70 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
      <div className="relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400/60">
              Analytics
            </p>

            <h2 className="mt-2 flex items-center gap-2 text-2xl font-black text-white">
              <BarChart3
                size={23}
                className="text-cyan-300"
              />
              Project Reports
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Track progress, deadlines, priorities, and team workload.
            </p>
          </div>

          <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/5 px-3 py-2 text-xs text-slate-400">
            Live project data
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-violet-400/20 bg-violet-400/5 p-5">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <div className="flex items-center gap-2">
        <Sparkles
          size={18}
          className="text-violet-300"
        />

        <h3 className="font-bold text-white">
          AI Project Insights
        </h3>
      </div>

      <p className="mt-2 text-sm text-slate-500">
        Let PMPilot analyze current project risks,
        deadlines, workload, and next actions.
      </p>
    </div>

    <button
      type="button"
      onClick={() => void generateAIInsights()}
      disabled={
  aiLoading ||
  (tasks.length === 0 &&
    milestones.length === 0 &&
    members.length === 0)
}
      className="rounded-xl border border-violet-400/25 bg-violet-400/10 px-4 py-2.5 text-sm font-bold text-violet-300 transition hover:bg-violet-400/20 disabled:opacity-50"
    >
      {aiLoading
        ? "Analyzing..."
        : aiInsight
          ? "Refresh Insights"
          : "Generate AI Insights"}
    </button>
  </div>
{tasks.length === 0 &&
  milestones.length === 0 &&
  members.length === 0 && (
    <p className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-500">
      Add tasks, milestones, or team members before generating
      project insights.
    </p>
  )}
  {aiError && (
    <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
      {aiError}
    </p>
  )}

  {aiInsight && (
    <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/55 p-4">
      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
        {aiInsight}
      </p>
    </div>
  )}
</div>

        {error && (
          <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-300">
            Some report data could not be loaded: {error}
          </p>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-cyan-400/15 bg-slate-950/50 p-5">
            <div className="flex items-center gap-2">
              <Target
                size={17}
                className="text-cyan-300"
              />

              <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                Task Progress
              </p>
            </div>
{tasks.length === 0 &&
  milestones.length === 0 &&
  members.length === 0 && (
    <div className="mt-6 rounded-2xl border border-dashed border-cyan-400/15 bg-cyan-400/[0.03] p-8 text-center">
      <BarChart3
        size={28}
        className="mx-auto text-cyan-300"
      />

      <h3 className="mt-4 font-bold text-white">
        Reports are ready
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        As you add tasks, milestones, and team members,
        PMPilot will automatically build project analytics here.
      </p>
    </div>
  )}
            <p className="mt-3 text-3xl font-black text-white">
              {analytics.taskProgress}%
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {analytics.completedTasks} of {tasks.length} completed
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-400/15 bg-slate-950/50 p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2
                size={17}
                className="text-emerald-300"
              />

              <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                Milestones
              </p>
            </div>

            <p className="mt-3 text-3xl font-black text-white">
              {analytics.milestoneProgress}%
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {analytics.completedMilestones} of{" "}
              {milestones.length} completed
            </p>
          </div>

          <div className="rounded-2xl border border-red-400/15 bg-slate-950/50 p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle
                size={17}
                className="text-red-300"
              />

              <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                Overdue
              </p>
            </div>

            <p className="mt-3 text-3xl font-black text-white">
              {analytics.overdueTasks}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Open tasks past deadline
            </p>
          </div>

          <div className="rounded-2xl border border-violet-400/15 bg-slate-950/50 p-5">
            <div className="flex items-center gap-2">
              <Users
                size={17}
                className="text-violet-300"
              />

              <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                Team
              </p>
            </div>

            <p className="mt-3 text-3xl font-black text-white">
              {members.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Active project members
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-5">
            <div className="flex items-center gap-2">
              <Clock3
                size={17}
                className="text-cyan-300"
              />

              <h3 className="font-bold text-white">
                Task Status
              </h3>
            </div>

            <div className="mt-5 space-y-4">
              {[
                {
                  label: "Not Started",
                  count: analytics.notStartedTasks,
                },
                {
                  label: "In Progress",
                  count: analytics.inProgressTasks,
                },
                {
                  label: "Completed",
                  count: analytics.completedTasks,
                },
              ].map((item) => {
                const percentage =
                  tasks.length === 0
                    ? 0
                    : Math.round(
                        (item.count / tasks.length) * 100
                      );

                return (
                  <div key={item.label}>
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="text-slate-400">
                        {item.label}
                      </span>

                      <span className="text-slate-500">
                        {item.count}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-900">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-blue-600 to-cyan-400"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-5">
            <div className="flex items-center gap-2">
              <Flag
                size={17}
                className="text-violet-300"
              />

              <h3 className="font-bold text-white">
                Priority Breakdown
              </h3>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {Object.entries(
                analytics.priorities
              ).map(([priority, count]) => (
                <div
                  key={priority}
                  className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
                >
                  <p className="text-xs text-slate-500">
                    {priority}
                  </p>

                  <p className="mt-1 text-2xl font-black text-white">
                    {count}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-5">
            <h3 className="font-bold text-white">
              Deadline Health
            </h3>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-red-400/15 bg-red-400/5 p-4">
                <p className="text-xs text-red-300">
                  Overdue
                </p>

                <p className="mt-1 text-2xl font-black text-white">
                  {analytics.overdueTasks}
                </p>
              </div>

              <div className="rounded-xl border border-amber-400/15 bg-amber-400/5 p-4">
                <p className="text-xs text-amber-300">
                  Due Soon
                </p>

                <p className="mt-1 text-2xl font-black text-white">
                  {analytics.dueSoonTasks}
                </p>
              </div>

              <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-4">
                <p className="text-xs text-cyan-300">
                  Unassigned
                </p>

                <p className="mt-1 text-2xl font-black text-white">
                  {analytics.unassignedTasks}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-5">
            <h3 className="font-bold text-white">
              Team Workload
            </h3>

            <div className="mt-5 space-y-4">
              {workload.length === 0 && (
  <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center">
    <Users
      size={22}
      className="mx-auto text-slate-700"
    />

    <p className="mt-3 font-semibold text-slate-300">
      No workload data yet
    </p>

    <p className="mt-1 text-sm text-slate-500">
      Add team members and assign tasks to see workload distribution.
    </p>
  </div>
)}

              {workload.map((member) => {
                const percentage = Math.round(
                  (member.open / maxWorkload) * 100
                );

                return (
                  <div key={member.id}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {member.name}
                        </p>

                        <p className="text-xs text-slate-500">
                          {member.role}
                        </p>
                      </div>

                      <span className="text-xs text-cyan-300">
                        {member.open} open
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-900">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-blue-600 via-cyan-400 to-emerald-400"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/45 p-5">
          <div className="flex items-center gap-2">
            <Circle
              size={16}
              className="text-cyan-300"
            />

            <h3 className="font-bold text-white">
              Project Summary
            </h3>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500">
                Total Tasks
              </p>

              <p className="mt-1 text-xl font-black text-white">
                {tasks.length}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Assigned Tasks
              </p>

              <p className="mt-1 text-xl font-black text-white">
                {analytics.assignedTasks}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Total Milestones
              </p>

              <p className="mt-1 text-xl font-black text-white">
                {milestones.length}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Team Members
              </p>

              <p className="mt-1 text-xl font-black text-white">
                {members.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

