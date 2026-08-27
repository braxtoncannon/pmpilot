"use client";

import type { Project, ProjectStatus } from "./ProjectTypes";

type ProjectCardProps = {
  project: Project;
  inputStyles: string;
  deleting: boolean;
  updatingStatus: boolean;
  onOpen: (project: Project) => void;
  onDelete: (id: number) => void;
  onStatusChange: (
    project: Project,
    status: ProjectStatus
  ) => void;
};

function priorityStyle(priority: string) {
  if (priority === "Critical") {
    return "border-red-400/30 bg-red-500/10 text-red-300";
  }

  if (priority === "High") {
    return "border-orange-400/30 bg-orange-500/10 text-orange-300";
  }

  if (priority === "Medium") {
    return "border-amber-400/30 bg-amber-500/10 text-amber-300";
  }

  return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";
}

function statusStyle(status: ProjectStatus) {
  if (status === "Completed") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "In Progress") {
    return "border-cyan-400/30 bg-cyan-400/10 text-cyan-300";
  }

  return "border-slate-600 bg-slate-800/70 text-slate-300";
}

export default function ProjectCard({
  project,
  inputStyles,
  deleting,
  updatingStatus,
  onOpen,
  onDelete,
  onStatusChange,
}: ProjectCardProps) {
  return (
    <article
      className="
        group relative overflow-hidden rounded-3xl
        border border-cyan-400/15
        bg-slate-950/60 p-6
        shadow-[0_20px_60px_rgba(0,0,0,0.45)]
        backdrop-blur-xl
        transition-all duration-500
        hover:-translate-y-2
        hover:border-cyan-300/40
        hover:shadow-[0_25px_80px_rgba(34,211,238,0.16)]
        [transform-style:preserve-3d]
      "
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full border border-cyan-400/20 transition duration-700 group-hover:scale-110 group-hover:rotate-12">
        <div className="absolute inset-5 rounded-full border border-blue-400/20" />
        <div className="absolute inset-10 rounded-full bg-cyan-400/5 blur-xl" />
      </div>

      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-linear-to-r from-transparent via-cyan-300/70 to-transparent" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-400/70">
              Mission Module
            </p>

            <h2 className="mt-2 text-xl font-bold tracking-tight text-white">
              {project.name}
            </h2>
          </div>

          <span
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle(
              project.status
            )}`}
          >
            {project.status}
          </span>
        </div>

        <p className="mt-4 line-clamp-3 min-h-[72px] leading-6 text-slate-400">
          {project.description}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              Deadline
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-200">
              {project.deadline}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              Crew
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-200">
              {project.team_size}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              Mission Type
            </p>

            <p className="mt-1 truncate text-sm font-semibold text-slate-200">
              {project.project_type}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              Budget
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-200">
              {project.budget === null
                ? "Not set"
                : `$${project.budget.toLocaleString("en-US")}`}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${priorityStyle(
              project.priority
            )}`}
          >
            {project.priority} Priority
          </span>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Mission Status
          </label>

          <select
            value={project.status}
            disabled={updatingStatus}
            onChange={(event) =>
              onStatusChange(
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

        <div className="mt-6 grid grid-cols-[1fr_auto] gap-3">
          <button
            type="button"
            onClick={() => onOpen(project)}
            className="
              rounded-xl
              bg-linear-to-r from-blue-600 to-cyan-400
              px-4 py-3
              font-semibold text-white
              shadow-[0_0_25px_rgba(34,211,238,0.15)]
              transition
              hover:brightness-110
            "
          >
            Enter Mission
          </button>

          <button
            type="button"
            disabled={deleting}
            onClick={() => onDelete(project.id)}
            className="
              rounded-xl border border-red-400/20
              bg-red-500/5 px-4 py-3
              text-sm font-semibold text-red-300
              transition hover:bg-red-500/10
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            {deleting ? "..." : "Delete"}
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-1/2 h-20 w-3/4 -translate-x-1/2 rounded-full bg-cyan-400/5 blur-3xl transition-all duration-500 group-hover:bg-cyan-400/10" />
    </article>
  );
}
