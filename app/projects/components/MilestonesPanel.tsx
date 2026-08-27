"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type MilestoneStatus = "Upcoming" | "In Progress" | "Completed";

type Milestone = {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  status: MilestoneStatus;
  completed: boolean;
};

type MilestonesPanelProps = {
  projectId: number;
};

type MilestoneForm = {
  title: string;
  dueDate: string;
  status: MilestoneStatus;
};

const emptyForm: MilestoneForm = {
  title: "",
  dueDate: "",
  status: "Upcoming",
};

export default function MilestonesPanel({
  projectId,
}: MilestonesPanelProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [form, setForm] = useState<MilestoneForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadMilestones() {
    setLoading(true);
    setError("");

    const { data, error: loadError } = await supabase
      .from("project_milestones")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (loadError) {
      setError(loadError.message);
      setLoading(false);
      return;
    }

    setMilestones((data || []) as Milestone[]);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchInitialMilestones() {
      const { data, error: loadError } = await supabase
        .from("project_milestones")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (loadError) {
        setError(loadError.message);
        setLoading(false);
        return;
      }

      setMilestones((data || []) as Milestone[]);
      setLoading(false);
    }

    void fetchInitialMilestones();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEditing(milestone: Milestone) {
    setEditingId(milestone.id);

    setForm({
      title: milestone.title,
      dueDate: milestone.due_date || "",
      status: milestone.status,
    });

    setError("");
  }

  async function saveMilestone() {
    if (!form.title.trim()) {
      setError("Enter a milestone title.");
      return;
    }

    setSaving(true);
    setError("");

    const completed = form.status === "Completed";

    const values = {
      project_id: projectId,
      title: form.title.trim(),
      due_date: form.dueDate || null,
      status: form.status,
      completed,
    };

    const query = editingId
      ? supabase
          .from("project_milestones")
          .update(values)
          .eq("id", editingId)
          .eq("project_id", projectId)
      : supabase.from("project_milestones").insert(values);

    const { error: saveError } = await query;

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    resetForm();
    await loadMilestones();
    setSaving(false);
  }

  async function toggleMilestone(milestone: Milestone) {
    const completed = !milestone.completed;

    const { error: updateError } = await supabase
      .from("project_milestones")
      .update({
        completed,
        status: completed ? "Completed" : "Upcoming",
      })
      .eq("id", milestone.id)
      .eq("project_id", projectId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadMilestones();
  }

  async function deleteMilestone(id: number) {
    const confirmed = window.confirm("Delete this milestone?");

    if (!confirmed) return;

    const { error: deleteError } = await supabase
      .from("project_milestones")
      .delete()
      .eq("id", id)
      .eq("project_id", projectId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    if (editingId === id) {
      resetForm();
    }

    await loadMilestones();
  }

  function statusStyles(status: MilestoneStatus) {
    if (status === "Completed") {
      return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
    }

    if (status === "In Progress") {
      return "border-blue-400/25 bg-blue-400/10 text-blue-300";
    }

    return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";
  }

  const completedCount = milestones.filter(
    (milestone) => milestone.completed
  ).length;

  const progress =
    milestones.length === 0
      ? 0
      : Math.round((completedCount / milestones.length) * 100);

  return (
    <section className="relative mt-8 h-full overflow-hidden rounded-3xl border border-cyan-400/15 bg-[#031022]/70 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400/60">
              Project Progress
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Milestones
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Track major project checkpoints and target dates.
            </p>
          </div>

          <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/5 px-4 py-2 text-right">
            <p className="text-xl font-black text-cyan-300">
              {completedCount}/{milestones.length}
            </p>

            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              Completed
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">Overall progress</span>
            <span className="font-semibold text-cyan-300">
              {progress}%
            </span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-slate-900">
            <div
              className="h-full rounded-full bg-linear-to-r from-blue-500 to-cyan-300 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <input
            value={form.title}
            onChange={(event) =>
              setForm({
                ...form,
                title: event.target.value,
              })
            }
            placeholder="Milestone title"
            className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
          />

          <input
            type="date"
            value={form.dueDate}
            onChange={(event) =>
              setForm({
                ...form,
                dueDate: event.target.value,
              })
            }
            className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-sm text-white outline-none focus:border-cyan-400"
          />

          <select
            value={form.status}
            onChange={(event) =>
              setForm({
                ...form,
                status: event.target.value as MilestoneStatus,
              })
            }
            className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-sm text-white outline-none focus:border-cyan-400"
          >
            <option value="Upcoming">Upcoming</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={() => void saveMilestone()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2.5 text-sm font-bold text-cyan-300 transition hover:bg-cyan-400/20 disabled:opacity-50"
          >
            {editingId ? <Check size={16} /> : <Plus size={16} />}

            {saving
              ? "Saving..."
              : editingId
                ? "Save Changes"
                : "Add Milestone"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-400 transition hover:text-white"
            >
              Cancel
            </button>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="mt-6 space-y-3">
          {loading && (
            <p className="text-sm text-slate-500">
              Loading milestones...
            </p>
          )}

          {!loading && milestones.length === 0 && (
  <div className="rounded-2xl border border-dashed border-cyan-400/15 bg-cyan-400/[0.03] p-8 text-center">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/5">
      <CalendarDays
        size={22}
        className="text-cyan-300"
      />
    </div>

    <h3 className="mt-4 font-bold text-white">
      No milestones yet
    </h3>

    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
      Add your first major checkpoint to track important
      project dates and progress.
    </p>

    <button
      type="button"
      onClick={() => {
        const input =
          document.querySelector<HTMLInputElement>(
            'input[placeholder="Milestone title"]'
          );

        input?.focus();
      }}
      className="mt-5 inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2.5 text-sm font-bold text-cyan-300 transition hover:bg-cyan-400/20"
    >
      <Plus size={15} />
      Add First Milestone
    </button>
  </div>
)}

          {milestones.map((milestone, index) => (
            <article
              key={milestone.id}
              className="group rounded-2xl border border-slate-800/80 bg-slate-950/55 p-4 transition hover:border-cyan-400/25 hover:bg-slate-950/75"
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => void toggleMilestone(milestone)}
                  className="mt-0.5 shrink-0"
                >
                  {milestone.completed ? (
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

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-400/15 bg-cyan-400/5 text-xs font-bold text-cyan-300">
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={
                      milestone.completed
                        ? "font-semibold text-slate-600 line-through"
                        : "font-semibold text-white"
                    }
                  >
                    {milestone.title}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusStyles(
                        milestone.status
                      )}`}
                    >
                      {milestone.status}
                    </span>

                    {milestone.due_date && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                        <CalendarDays size={12} />
                        Due {milestone.due_date}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => startEditing(milestone)}
                    aria-label="Edit milestone"
                    className="rounded-lg p-2 text-slate-600 transition hover:bg-cyan-400/10 hover:text-cyan-300"
                  >
                    <Pencil size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void deleteMilestone(milestone.id)
                    }
                    aria-label="Delete milestone"
                    className="rounded-lg p-2 text-slate-600 transition hover:bg-red-400/10 hover:text-red-300"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

