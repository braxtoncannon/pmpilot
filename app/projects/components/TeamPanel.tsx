"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type TeamMember = {
  id: number;
  project_id: number;
  name: string;
  email: string | null;
  role: string;
};

type TeamPanelProps = {
  projectId: number;
};

type MemberForm = {
  name: string;
  email: string;
  role: string;
};

const emptyForm: MemberForm = {
  name: "",
  email: "",
  role: "Team Member",
};

export default function TeamPanel({
  projectId,
}: TeamPanelProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [form, setForm] = useState<MemberForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadMembers() {
    setLoading(true);
    setError("");

    const { data, error: loadError } = await supabase
      .from("project_members")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (loadError) {
      setError(loadError.message);
      setLoading(false);
      return;
    }

    setMembers((data || []) as TeamMember[]);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchMembers() {
      const { data, error: loadError } = await supabase
        .from("project_members")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (loadError) {
        setError(loadError.message);
        setLoading(false);
        return;
      }

      setMembers((data || []) as TeamMember[]);
      setLoading(false);
    }

    void fetchMembers();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEditing(member: TeamMember) {
    setEditingId(member.id);

    setForm({
      name: member.name,
      email: member.email || "",
      role: member.role,
    });

    setError("");
  }

  async function saveMember() {
    if (!form.name.trim()) {
      setError("Enter a team member name.");
      return;
    }

    setSaving(true);
    setError("");

    const values = {
      project_id: projectId,
      name: form.name.trim(),
      email: form.email.trim() || null,
      role: form.role.trim() || "Team Member",
    };

    const query = editingId
      ? supabase
          .from("project_members")
          .update(values)
          .eq("id", editingId)
          .eq("project_id", projectId)
      : supabase.from("project_members").insert(values);

    const { error: saveError } = await query;

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    resetForm();
    await loadMembers();
    setSaving(false);
  }

  async function deleteMember(id: number) {
    const confirmed = window.confirm(
      "Remove this team member?"
    );

    if (!confirmed) return;

    const { error: deleteError } = await supabase
      .from("project_members")
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

    await loadMembers();
  }

  function initials(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }

  return (
    <section className="relative mt-8 h-full overflow-hidden rounded-3xl border border-cyan-400/15 bg-[#031022]/70 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400/60">
              People
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Team
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Manage project members, roles, and contact information.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-cyan-400/15 bg-cyan-400/5 px-3 py-2 text-xs text-slate-400">
            <Users size={15} className="text-cyan-300" />
            {members.length} members
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <input
            value={form.name}
            onChange={(event) =>
              setForm({
                ...form,
                name: event.target.value,
              })
            }
            placeholder="Name"
            className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
          />

          <input
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm({
                ...form,
                email: event.target.value,
              })
            }
            placeholder="Email"
            className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
          />

          <input
            value={form.role}
            onChange={(event) =>
              setForm({
                ...form,
                role: event.target.value,
              })
            }
            placeholder="Role"
            className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
          />
        </div>

        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={() => void saveMember()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2.5 text-sm font-bold text-cyan-300 transition hover:bg-cyan-400/20 disabled:opacity-50"
          >
            <Plus size={16} />

            {saving
              ? "Saving..."
              : editingId
                ? "Save Changes"
                : "Add Team Member"}
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

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {loading && (
            <p className="text-sm text-slate-500">
              Loading team...
            </p>
          )}

          {!loading && members.length === 0 && (
            <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-800 p-7 text-center">
              <UserRound
                size={28}
                className="mx-auto text-slate-700"
              />

              <p className="mt-3 text-sm text-slate-500">
                No team members yet.
              </p>
            </div>
          )}

          {members.map((member) => (
            <article
              key={member.id}
              className="group rounded-2xl border border-slate-800/80 bg-slate-950/55 p-4 transition hover:border-cyan-400/25 hover:bg-slate-950/75"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/10 text-sm font-black text-cyan-300">
                  {initials(member.name) || "TM"}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-white">
                    {member.name}
                  </h3>

                  <p className="mt-1 text-sm text-cyan-300">
                    {member.role}
                  </p>

                  {member.email && (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <Mail size={12} />
                      {member.email}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => startEditing(member)}
                    aria-label="Edit team member"
                    className="rounded-lg p-2 text-slate-600 transition hover:bg-cyan-400/10 hover:text-cyan-300"
                  >
                    <Pencil size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void deleteMember(member.id)
                    }
                    aria-label="Remove team member"
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

