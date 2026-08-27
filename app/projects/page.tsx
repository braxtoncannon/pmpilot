"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  Download,
  Pencil,
  Rocket,
  Search,
  Trash2,
  Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

import MissionHealth from "./components/MissionHealth";
import TodayTasks from "./components/TodayTasks";
import KanbanBoard from "./components/KanbanBoard";
import ProjectTimeline from "./components/ProjectTimeline";
import MilestonesPanel from "./components/MilestonesPanel";
import TeamPanel from "./components/TeamPanel";
import CrewWorkload from "./components/CrewWorkload";
import PartnerPing from "./components/PartnerPing";
import NotificationHistory from "./components/NotificationHistory";
import MissionBrief from "./components/MissionBrief";
import ProjectReports from "./components/ProjectReports";
import ProjectCalendar from "./components/ProjectCalendar";

type ProjectStatus = "Planned" | "In Progress" | "Completed";

type Project = {
  id: number;
  name: string;
  description: string;
  budget: number | null;
  deadline: string;
  priority: string;
  project_type: string;
  team_size: number;
  generated_plan: string;
  created_at: string;
  status: ProjectStatus;
};

type EditForm = {
  name: string;
  description: string;
  budget: string;
  deadline: string;
  priority: string;
  projectType: string;
  teamSize: string;
  generatedPlan: string;
};

const inputStyles =
  "w-full rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15";

function displayDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString();
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

export default function ProjectsPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] =
    useState<Project | null>(null);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/auth");
        return;
      }

      const { data, error: loadError } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (loadError) {
        setError(loadError.message);
        setLoading(false);
        return;
      }

      const normalized = (data || []).map((project) => ({
        ...project,
        status: (project.status || "Planned") as ProjectStatus,
      })) as Project[];

      setProjects(normalized);
      setLoading(false);
    }

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return projects;

    return projects.filter((project) => {
      return (
        project.name.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        project.priority.toLowerCase().includes(query) ||
        project.project_type.toLowerCase().includes(query)
      );
    });
  }, [projects, search]);

  const stats = useMemo(() => {
    const completed = projects.filter(
      (project) => project.status === "Completed"
    ).length;

    const inProgress = projects.filter(
      (project) => project.status === "In Progress"
    ).length;

    const planned = projects.filter(
      (project) => project.status === "Planned"
    ).length;

    return {
      total: projects.length,
      planned,
      inProgress,
      completed,
    };
  }, [projects]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/auth");
    router.refresh();
  }

  function openProject(project: Project) {
    setSelectedProject(project);
    setEditing(false);
    setEditForm(null);
    setError("");
    setSuccessMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeProject() {
    setSelectedProject(null);
    setEditing(false);
    setEditForm(null);
    setError("");
    setSuccessMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEditing() {
    if (!selectedProject) return;

    setEditForm({
      name: selectedProject.name,
      description: selectedProject.description,
      budget:
        selectedProject.budget === null
          ? ""
          : String(selectedProject.budget),
      deadline: selectedProject.deadline,
      priority: selectedProject.priority,
      projectType: selectedProject.project_type,
      teamSize: String(selectedProject.team_size),
      generatedPlan: selectedProject.generated_plan,
    });

    setEditing(true);
    setError("");
    setSuccessMessage("");
  }

  function cancelEditing() {
    setEditing(false);
    setEditForm(null);
    setError("");
    setSuccessMessage("");
  }

  async function updateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProject || !editForm) return;

    if (
      !editForm.name.trim() ||
      !editForm.description.trim() ||
      !editForm.deadline ||
      !editForm.generatedPlan.trim()
    ) {
      setError(
        "Please enter a name, description, deadline, and project plan."
      );
      return;
    }

    const teamSize = Number(editForm.teamSize);

    if (!Number.isInteger(teamSize) || teamSize < 1) {
      setError("Team size must be at least 1.");
      return;
    }

    const budget =
      editForm.budget.trim() === ""
        ? null
        : Number(editForm.budget);

    if (
      budget !== null &&
      (Number.isNaN(budget) || budget < 0)
    ) {
      setError("Budget must be a valid positive number.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    const updatedValues = {
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      budget,
      deadline: editForm.deadline,
      priority: editForm.priority,
      project_type: editForm.projectType,
      team_size: teamSize,
      generated_plan: editForm.generatedPlan.trim(),
    };

    const { data, error: updateError } = await supabase
      .from("projects")
      .update(updatedValues)
      .eq("id", selectedProject.id)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    const updatedProject = {
      ...(data as Project),
      status:
        ((data as Project).status || selectedProject.status) as ProjectStatus,
    };

    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === updatedProject.id
          ? updatedProject
          : project
      )
    );

    setSelectedProject(updatedProject);
    setEditing(false);
    setEditForm(null);
    setSaving(false);
    setSuccessMessage("Project updated successfully.");
  }

  async function deleteProject(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError("");
    setSuccessMessage("");

    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      setDeletingId(null);
      return;
    }

    setProjects((currentProjects) =>
      currentProjects.filter((project) => project.id !== id)
    );

    if (selectedProject?.id === id) {
      closeProject();
    }

    setDeletingId(null);
  }

  function exportProject() {
    window.print();
  }

  if (selectedProject) {
    const now = new Date();
    const deadlineDate = new Date(
      `${selectedProject.deadline}T23:59:59`
    );

    const daysRemaining = Math.max(
      0,
      Math.ceil(
        (deadlineDate.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );

    return (
      <>
        <Navbar onSignOut={signOut} />

        <main className="relative min-h-screen lg:pl-[230px]">
          <div className="relative z-10 mx-auto max-w-[1550px] px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
            <header className="flex flex-col gap-6 border-b border-cyan-400/10 pb-7 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <button
                  type="button"
                  onClick={closeProject}
                  className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-cyan-300"
                >
                  <ArrowLeft size={16} />
                  Projects
                </button>

                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                    {selectedProject.name}
                  </h1>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${priorityStyles(
                      selectedProject.priority
                    )}`}
                  >
                    {selectedProject.priority} Priority
                  </span>

                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">
                    {selectedProject.status}
                  </span>
                </div>

                <p className="mt-3 max-w-3xl text-slate-400">
                  {selectedProject.description}
                </p>
              </div>

              {!editing && (
                <div className="flex flex-wrap gap-3 print:hidden">
                  <button
                    type="button"
                    onClick={startEditing}
                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 font-semibold text-cyan-200 transition hover:bg-cyan-400/20"
                  >
                    <Pencil size={17} />
                    Edit Project
                  </button>

                  <button
                    type="button"
                    onClick={exportProject}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 font-semibold text-slate-300 transition hover:border-cyan-400/30 hover:text-white"
                  >
                    <Download size={17} />
                    Export
                  </button>
                </div>
              )}
            </header>

            <nav className="sticky top-3 z-30 mt-6 overflow-x-auto rounded-2xl border border-cyan-400/15 bg-[#020817]/90 p-2 shadow-[0_15px_45px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
              <div className="flex min-w-max gap-1">
                {[
                  ["Overview", "#overview"],
                  ["Tasks", "#tasks"],
                  ["Timeline", "#timeline"],
                  ["Calendar", "#calendar"],
                  ["Team", "#team"],
                  ["Reports", "#reports"],
                  ["Messages", "#communication"],
                  ["AI Assistant", "#ai"],
                  ["Project Plan", "#documents"],
                ].map(([label, href]) => (
                  <a
                    key={href}
                    href={href}
                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-cyan-400/10 hover:text-cyan-300"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </nav>

            {error && (
              <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
                {error}
              </p>
            )}

            {successMessage && (
              <p className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">
                {successMessage}
              </p>
            )}

            {editing && editForm ? (
              <section className="mt-8 rounded-3xl border border-cyan-400/15 bg-[#031022]/75 p-6 shadow-[0_25px_90px_rgba(0,0,0,0.4)] backdrop-blur-2xl sm:p-8">
                <form
                  onSubmit={updateProject}
                  className="space-y-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400/60">
                        Project Settings
                      </p>

                      <h2 className="mt-2 text-3xl font-black text-white">
                        Edit Project
                      </h2>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={saving}
                        className="rounded-xl border border-slate-700 bg-slate-950/60 px-5 py-3 text-slate-300 transition hover:border-cyan-400/30"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-xl bg-linear-to-r from-blue-600 to-cyan-400 px-5 py-3 font-bold text-white transition hover:brightness-110 disabled:opacity-50"
                      >
                        {saving
                          ? "Saving..."
                          : "Save Changes"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Project Name
                    </label>
                    <input
                      value={editForm.name}
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          name: event.target.value,
                        })
                      }
                      className={inputStyles}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Description
                    </label>
                    <textarea
                      value={editForm.description}
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          description: event.target.value,
                        })
                      }
                      rows={4}
                      className={inputStyles}
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Deadline
                      </label>
                      <input
                        type="date"
                        value={editForm.deadline}
                        onChange={(event) =>
                          setEditForm({
                            ...editForm,
                            deadline: event.target.value,
                          })
                        }
                        className={inputStyles}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Budget ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.budget}
                        onChange={(event) =>
                          setEditForm({
                            ...editForm,
                            budget: event.target.value,
                          })
                        }
                        className={inputStyles}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Priority
                      </label>
                      <select
                        value={editForm.priority}
                        onChange={(event) =>
                          setEditForm({
                            ...editForm,
                            priority: event.target.value,
                          })
                        }
                        className={inputStyles}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Project Type
                      </label>
                      <select
                        value={editForm.projectType}
                        onChange={(event) =>
                          setEditForm({
                            ...editForm,
                            projectType: event.target.value,
                          })
                        }
                        className={inputStyles}
                      >
                        <option value="Campus Event">Campus Event</option>
                        <option value="Software">Software</option>
                        <option value="Marketing">Marketing</option>
                        <option value="HR">HR</option>
                        <option value="Operations">Operations</option>
                        <option value="Construction">Construction</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Team Size
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={editForm.teamSize}
                        onChange={(event) =>
                          setEditForm({
                            ...editForm,
                            teamSize: event.target.value,
                          })
                        }
                        className={inputStyles}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      AI Project Plan
                    </label>
                    <textarea
                      value={editForm.generatedPlan}
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          generatedPlan: event.target.value,
                        })
                      }
                      rows={18}
                      className={`${inputStyles} font-mono text-sm`}
                    />
                  </div>
                </form>
              </section>
            ) : (
              <>
                <section
                  id="overview"
                  className="scroll-mt-28 mt-8 grid overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#031022]/75 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:grid-cols-2 xl:grid-cols-4"
                >
                  <div className="border-b border-cyan-400/10 p-5 sm:border-r xl:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          Status
                        </p>
                        <p className="mt-1 text-xl font-black text-white">
                          {selectedProject.status}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-cyan-400/10 p-5 xl:border-b-0 xl:border-r">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-400/10 text-blue-300">
                        <Clock3 size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          Days Remaining
                        </p>
                        <p className="mt-1 text-2xl font-black text-white">
                          {daysRemaining}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-cyan-400/10 p-5 sm:border-r xl:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10 text-violet-300">
                        <Users size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          Team Size
                        </p>
                        <p className="mt-1 text-2xl font-black text-white">
                          {selectedProject.team_size}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                        <DollarSign size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          Project Budget
                        </p>
                        <p className="mt-1 text-xl font-black text-white">
                          {selectedProject.budget === null
                            ? "Not Set"
                            : `$${selectedProject.budget.toLocaleString(
                                "en-US"
                              )}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <MissionHealth project={selectedProject} />

                <section className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.55fr]">
                  <div id="tasks" className="scroll-mt-28">
                    <TodayTasks projectId={selectedProject.id} />
                  </div>

                  <KanbanBoard projectId={selectedProject.id} />
                </section>

                <div id="timeline" className="scroll-mt-28">
                  <ProjectTimeline projectId={selectedProject.id} />
                </div>
                <div id="calendar" className="scroll-mt-28">
  <ProjectCalendar projectId={selectedProject.id} />
</div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <MilestonesPanel projectId={selectedProject.id} />

                  <div id="team" className="scroll-mt-28">
                    <TeamPanel projectId={selectedProject.id} />
                  </div>
                </div>

                <CrewWorkload projectId={selectedProject.id} />

                <div id="reports" className="scroll-mt-28">
                  <ProjectReports
                    projectId={selectedProject.id}
                    projectName={selectedProject.name}
                    projectDescription={selectedProject.description}
                    deadline={selectedProject.deadline}
                    priority={selectedProject.priority}
                    budget={selectedProject.budget}
                    teamSize={selectedProject.team_size}
                    status={selectedProject.status}
                  />
                </div>

                <div
                  id="communication"
                  className="scroll-mt-28 grid gap-6 xl:grid-cols-2"
                >
                  <PartnerPing
                    projectId={selectedProject.id}
                    projectName={selectedProject.name}
                  />

                  <NotificationHistory
                    projectId={selectedProject.id}
                  />
                </div>

                <div id="ai" className="scroll-mt-28">
                  <MissionBrief
  projectId={selectedProject.id}
  projectName={selectedProject.name}
  projectDescription={selectedProject.description}
  deadline={selectedProject.deadline}
  priority={selectedProject.priority}
  budget={selectedProject.budget}
  teamSize={selectedProject.team_size}
  status={selectedProject.status}
/>
                </div>

                <section
                  id="documents"
                  className="scroll-mt-28 mt-8 overflow-hidden rounded-3xl border border-cyan-400/15 bg-[#031022]/70 p-6 text-slate-300 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-8"
                >
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400/60">
                        AI Planning
                      </p>
                      <h2 className="mt-2 text-2xl font-black text-white">
                        AI Project Plan
                      </h2>
                      <p className="mt-2 text-sm text-slate-500">
                        The generated project plan for this project.
                      </p>
                    </div>

                    <CalendarDays
                      size={22}
                      className="text-cyan-300"
                    />
                  </div>

                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="mb-4 mt-7 text-3xl font-bold text-white">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="mb-3 mt-7 text-2xl font-bold text-white">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="mb-3 mt-6 text-xl font-semibold text-white">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="mb-4 leading-7 text-slate-300">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="mb-4 list-disc space-y-2 pl-6 text-slate-300">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-4 list-decimal space-y-2 pl-6 text-slate-300">
                          {children}
                        </ol>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto">
                          <table className="mb-6 w-full min-w-150 border-collapse text-sm">
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className="border border-cyan-400/15 bg-cyan-400/5 p-3 text-left font-semibold text-white">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border border-slate-800 p-3 align-top text-slate-300">
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {selectedProject.generated_plan}
                  </ReactMarkdown>
                </section>
              </>
            )}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar onSignOut={signOut} />

      <main className="relative min-h-screen lg:pl-[230px]">
        <div className="relative z-10 mx-auto max-w-[1550px] px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
          <header className="flex flex-col gap-6 border-b border-cyan-400/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>Mission Control</span>
                <span>/</span>
                <span className="text-cyan-300">Projects</span>
              </div>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Projects
              </h1>

              <p className="mt-3 max-w-2xl text-slate-400">
                View, search, and manage your active project portfolio.
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-400 px-6 py-3.5 font-bold text-white shadow-[0_0_35px_rgba(34,211,238,0.18)] transition hover:-translate-y-0.5 hover:brightness-110"
            >
              <Rocket size={18} />
              Create New Project
            </Link>
          </header>

          <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Total Projects", stats.total],
              ["Planned", stats.planned],
              ["In Progress", stats.inProgress],
              ["Completed", stats.completed],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-cyan-400/15 bg-[#031022]/65 p-5 backdrop-blur-xl"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  {label}
                </p>
                <p className="mt-2 text-3xl font-black text-white">
                  {value}
                </p>
              </div>
            ))}
          </section>

          <section className="mt-6 rounded-2xl border border-cyan-400/15 bg-[#031022]/60 p-4 backdrop-blur-xl">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects by name, description, priority, or type..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-3 pl-11 pr-4 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
              />
            </div>
          </section>

          {error && (
            <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
              {error}
            </p>
          )}

          {successMessage && (
            <p className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">
              {successMessage}
            </p>
          )}

          {loading ? (
            <div className="mt-8 rounded-2xl border border-cyan-400/10 bg-[#031022]/60 p-8 text-slate-400 backdrop-blur-xl">
              Loading projects...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-slate-800 bg-[#031022]/50 p-10 text-center">
              <Rocket
                size={32}
                className="mx-auto rotate-[-40deg] text-cyan-300"
              />

              <p className="mt-4 font-semibold text-white">
                {projects.length === 0
                  ? "No projects yet."
                  : `No projects match "${search}".`}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Create a new project or adjust your search.
              </p>
            </div>
          ) : (
            <section className="mt-8 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {filteredProjects.map((project) => (
                <article
                  key={project.id}
                  className="group relative overflow-hidden rounded-3xl border border-cyan-400/15 bg-[#031022]/70 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.3)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-cyan-400/30"
                >
                  <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full border border-cyan-400/10" />

                  <div className="relative">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-400/60">
                          {project.project_type}
                        </p>

                        <h2 className="mt-2 text-xl font-black text-white">
                          {project.name}
                        </h2>
                      </div>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${priorityStyles(
                          project.priority
                        )}`}
                      >
                        {project.priority}
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
                      {project.description}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-600">
                          Deadline
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-300">
                          {displayDate(project.deadline)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-600">
                          Team
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-300">
                          {project.team_size} members
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={() => openProject(project)}
                        className="flex-1 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 font-bold text-cyan-300 transition hover:bg-cyan-400/20"
                      >
                        Open Project
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void deleteProject(project.id)
                        }
                        disabled={deletingId === project.id}
                        aria-label={`Delete ${project.name}`}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-400/15 bg-red-400/5 text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>
      </main>
    </>
  );
}


