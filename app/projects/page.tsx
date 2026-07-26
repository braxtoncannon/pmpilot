"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/lib/supabase";

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
  status: ProjectStatus;
};

type SortOption =
  | "newest"
  | "oldest"
  | "deadline"
  | "priority"
  | "name";

const priorityOrder: Record<string, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    async function loadProjects() {
      setLoading(true);
      setError("");

      const { data, error: loadError } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (loadError) {
        setError(loadError.message);
        setLoading(false);
        return;
      }

      const normalizedProjects = (data || []).map((project) => ({
        ...project,
        status: (project.status || "Planned") as ProjectStatus,
      })) as Project[];

      setProjects(normalizedProjects);
      setLoading(false);
    }

    loadProjects();
  }, []);

  const projectTypes = useMemo(
    () =>
      Array.from(new Set(projects.map((project) => project.project_type))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [projects]
  );

  const visibleProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = projects.filter((project) => {
      const matchesSearch =
        !query ||
        project.name.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        project.priority.toLowerCase().includes(query) ||
        project.project_type.toLowerCase().includes(query) ||
        project.status.toLowerCase().includes(query);

      const matchesPriority =
        priorityFilter === "All" || project.priority === priorityFilter;
      const matchesType =
        typeFilter === "All" || project.project_type === typeFilter;
      const matchesStatus =
        statusFilter === "All" || project.status === statusFilter;

      return matchesSearch && matchesPriority && matchesType && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
          );
        case "deadline":
          return (
            new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
          );
        case "priority":
          return (
            (priorityOrder[b.priority] || 0) -
            (priorityOrder[a.priority] || 0)
          );
        case "name":
          return a.name.localeCompare(b.name);
        case "newest":
        default:
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          );
      }
    });
  }, [
    projects,
    search,
    sortBy,
    priorityFilter,
    typeFilter,
    statusFilter,
  ]);

  const stats = useMemo(
    () => ({
      total: projects.length,
      planned: projects.filter((project) => project.status === "Planned")
        .length,
      inProgress: projects.filter(
        (project) => project.status === "In Progress"
      ).length,
      completed: projects.filter((project) => project.status === "Completed")
        .length,
    }),
    [projects]
  );

  const inputStyles =
    "w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-blue-500";

  function openProject(project: Project) {
    setSelectedProject(project);
    setEditing(false);
    setEditForm(null);
    setError("");
    setSuccessMessage("");
  }

  function closeProject() {
    setSelectedProject(null);
    setEditing(false);
    setEditForm(null);
    setError("");
    setSuccessMessage("");
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
      status: selectedProject.status,
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

  function clearFilters() {
    setSearch("");
    setPriorityFilter("All");
    setTypeFilter("All");
    setStatusFilter("All");
    setSortBy("newest");
  }

  function exportProjectAsPdf() {
    window.print();
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
      editForm.budget.trim() === "" ? null : Number(editForm.budget);

    if (budget !== null && (Number.isNaN(budget) || budget < 0)) {
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
      status: editForm.status,
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

    const updatedProject = data as Project;

    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === updatedProject.id ? updatedProject : project
      )
    );

    setSelectedProject(updatedProject);
    setEditing(false);
    setEditForm(null);
    setSaving(false);
    setSuccessMessage("Project updated successfully.");
  }

  async function updateProjectStatus(
    project: Project,
    status: ProjectStatus
  ) {
    setUpdatingStatusId(project.id);
    setError("");

    const { data, error: statusError } = await supabase
      .from("projects")
      .update({ status })
      .eq("id", project.id)
      .select()
      .single();

    if (statusError) {
      setError(statusError.message);
      setUpdatingStatusId(null);
      return;
    }

    const updatedProject = data as Project;

    setProjects((currentProjects) =>
      currentProjects.map((currentProject) =>
        currentProject.id === updatedProject.id
          ? updatedProject
          : currentProject
      )
    );

    if (selectedProject?.id === updatedProject.id) {
      setSelectedProject(updatedProject);
    }

    setUpdatingStatusId(null);
    setSuccessMessage(
      status === "Completed"
        ? "Project marked as completed."
        : `Project status changed to ${status}.`
    );
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

  if (selectedProject) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-12 print:bg-white print:px-0 print:py-0">
        <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow-xl print:max-w-none print:rounded-none print:p-0 print:shadow-none">
          <div className="mb-6 flex flex-wrap gap-3 print:hidden">
            <button
              type="button"
              onClick={closeProject}
              className="rounded-lg bg-slate-200 px-4 py-2 text-slate-900 hover:bg-slate-300"
            >
              Back to Projects
            </button>

            {!editing && (
              <>
                <button
                  type="button"
                  onClick={startEditing}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Edit Project
                </button>

                <button
                  type="button"
                  onClick={exportProjectAsPdf}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-white hover:bg-slate-900"
                >
                  Export as PDF
                </button>

                {selectedProject.status !== "Completed" && (
                  <button
                    type="button"
                    onClick={() =>
                      updateProjectStatus(selectedProject, "Completed")
                    }
                    disabled={updatingStatusId === selectedProject.id}
                    className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-60"
                  >
                    {updatingStatusId === selectedProject.id
                      ? "Updating..."
                      : "Mark Complete"}
                  </button>
                )}
              </>
            )}
          </div>

          {error && (
            <p className="mb-6 rounded-lg bg-red-50 p-4 text-red-700 print:hidden">
              {error}
            </p>
          )}

          {successMessage && (
            <p className="mb-6 rounded-lg bg-green-50 p-4 text-green-700 print:hidden">
              {successMessage}
            </p>
          )}

          {editing && editForm ? (
            <form onSubmit={updateProject} className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-slate-900">
                  Edit Project
                </h1>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={saving}
                    className="rounded-lg bg-slate-200 px-5 py-3 text-slate-900 hover:bg-slate-300 disabled:opacity-60"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block font-medium text-slate-800">
                  Project Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm({ ...editForm, name: event.target.value })
                  }
                  className={inputStyles}
                />
              </div>

              <div>
                <label className="mb-2 block font-medium text-slate-800">
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

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium text-slate-800">
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
                  <label className="mb-2 block font-medium text-slate-800">
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
                    placeholder="Not provided"
                    className={inputStyles}
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium text-slate-800">
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
                  <label className="mb-2 block font-medium text-slate-800">
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
                  <label className="mb-2 block font-medium text-slate-800">
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

                <div>
                  <label className="mb-2 block font-medium text-slate-800">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        status: event.target.value as ProjectStatus,
                      })
                    }
                    className={inputStyles}
                  >
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block font-medium text-slate-800">
                  Generated Project Plan
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

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="w-full rounded-lg bg-slate-200 p-3 text-slate-900 hover:bg-slate-300 disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-lg bg-blue-600 p-3 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                    {selectedProject.status}
                  </div>

                  <h1 className="text-3xl font-bold text-slate-900">
                    {selectedProject.name}
                  </h1>

                  <p className="mt-2 text-slate-600">
                    {selectedProject.description}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 rounded-xl bg-slate-100 p-5 text-slate-800 sm:grid-cols-2">
                <p>
                  <strong>Deadline:</strong> {selectedProject.deadline}
                </p>
                <p>
                  <strong>Budget:</strong>{" "}
                  {selectedProject.budget === null
                    ? "Not provided"
                    : `$${selectedProject.budget.toLocaleString("en-US")}`}
                </p>
                <p>
                  <strong>Priority:</strong> {selectedProject.priority}
                </p>
                <p>
                  <strong>Project Type:</strong>{" "}
                  {selectedProject.project_type}
                </p>
                <p>
                  <strong>Team Size:</strong> {selectedProject.team_size}
                </p>
                <p>
                  <strong>Status:</strong> {selectedProject.status}
                </p>
              </div>

              <section className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-6 text-slate-800 print:border-0 print:bg-white print:p-0">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="mb-4 mt-6 text-3xl font-bold text-slate-900">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mb-3 mt-6 text-2xl font-bold text-slate-900">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mb-3 mt-5 text-xl font-semibold text-slate-900">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-4 leading-7">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-4 list-disc space-y-2 pl-6">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-4 list-decimal space-y-2 pl-6">
                        {children}
                      </ol>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto">
                        <table className="mb-6 w-full min-w-[600px] border-collapse text-sm">
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-slate-300 bg-slate-200 p-3 text-left font-semibold">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-slate-300 p-3 align-top">
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
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Saved Projects
            </h1>
            <p className="mt-2 text-slate-600">
              View, filter, track, and manage your project plans.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            Create New Project
          </Link>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-slate-500">Total Projects</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {stats.total}
            </p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-slate-500">Planned</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {stats.planned}
            </p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-slate-500">In Progress</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {stats.inProgress}
            </p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-slate-500">Completed</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {stats.completed}
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-xl bg-white p-5 shadow">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label
                htmlFor="project-search"
                className="mb-2 block text-sm font-medium text-slate-800"
              >
                Search
              </label>
              <input
                id="project-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, description, priority, type, or status..."
                className={inputStyles}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-800">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                className={inputStyles}
              >
                <option value="All">All priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-800">
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className={inputStyles}
              >
                <option value="All">All types</option>
                {projectTypes.map((projectType) => (
                  <option key={projectType} value={projectType}>
                    {projectType}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-800">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className={inputStyles}
              >
                <option value="All">All statuses</option>
                <option value="Planned">Planned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-4">
            <div className="min-w-52">
              <label className="mb-2 block text-sm font-medium text-slate-800">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as SortOption)
                }
                className={inputStyles}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="deadline">Deadline soonest</option>
                <option value="priority">Highest priority</option>
                <option value="name">Project name</option>
              </select>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg bg-slate-200 px-5 py-3 text-slate-900 hover:bg-slate-300"
            >
              Clear Filters
            </button>

            <p className="text-sm text-slate-500">
              Showing {visibleProjects.length} of {projects.length}
            </p>
          </div>
        </div>

        {error && (
          <p className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}

        {successMessage && (
          <p className="mb-6 rounded-lg bg-green-50 p-4 text-green-700">
            {successMessage}
          </p>
        )}

        {loading ? (
          <p className="text-slate-700">Loading projects...</p>
        ) : visibleProjects.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow">
            <p className="text-slate-700">
              {projects.length === 0
                ? "No saved projects yet."
                : "No projects match the current search and filters."}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visibleProjects.map((project) => (
              <article
                key={project.id}
                className="rounded-xl bg-white p-6 shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-bold text-slate-900">
                    {project.name}
                  </h2>
                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {project.status}
                  </span>
                </div>

                <p className="mt-2 line-clamp-3 text-slate-600">
                  {project.description}
                </p>

                <div className="mt-4 space-y-1 text-sm text-slate-700">
                  <p>Deadline: {project.deadline}</p>
                  <p>Priority: {project.priority}</p>
                  <p>Type: {project.project_type}</p>
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Change status
                  </label>
                  <select
                    value={project.status}
                    disabled={updatingStatusId === project.id}
                    onChange={(event) =>
                      updateProjectStatus(
                        project,
                        event.target.value as ProjectStatus
                      )
                    }
                    className={inputStyles}
                  >
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => openProject(project)}
                    className="w-full rounded-lg bg-blue-600 p-3 text-white hover:bg-blue-700"
                  >
                    Open
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteProject(project.id)}
                    disabled={deletingId === project.id}
                    className="w-full rounded-lg bg-red-100 p-3 text-red-700 hover:bg-red-200 disabled:opacity-60"
                  >
                    {deletingId === project.id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
