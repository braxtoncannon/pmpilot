import type { Project, ProjectStatus } from "./ProjectTypes";
import StatusBadge from "./StatusBadge";

type ProjectCardProps = {
  project: Project;
  inputStyles: string;
  deleting: boolean;
  updatingStatus: boolean;
  onOpen: (project: Project) => void;
  onDelete: (id: number) => void;
  onStatusChange: (project: Project, status: ProjectStatus) => void;
};

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
    <article className="mission-panel group rounded-2xl border border-slate-800/80 p-6 transition hover:-translate-y-1 hover:border-cyan-400/30">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-bold text-white">
          {project.name}
        </h2>

        <StatusBadge status={project.status} />
      </div>

      <p className="mt-2 line-clamp-3 text-slate-400">
        {project.description}
      </p>

      <div className="mt-4 space-y-1 text-sm text-slate-300">
        <p>Deadline: {project.deadline}</p>
        <p>Priority: {project.priority}</p>
        <p>Type: {project.project_type}</p>
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
          Change status
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

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => onOpen(project)}
          className="space-primary-button w-full p-3"
        >
          Open
        </button>

        <button
          type="button"
          onClick={() => onDelete(project.id)}
          disabled={deleting}
          className="space-danger-button w-full p-3 disabled:opacity-60"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </article>
  );
}

