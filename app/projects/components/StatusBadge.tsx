import type { ProjectStatus } from "./ProjectTypes";

type StatusBadgeProps = {
  status: ProjectStatus;
};

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  return (
    <span className="shrink-0 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
      {status}
    </span>
  );
}

