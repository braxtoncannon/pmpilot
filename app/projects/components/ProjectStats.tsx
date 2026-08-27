"use client";

type ProjectStatsProps = {
  total: number;
  planned: number;
  inProgress: number;
  completed: number;
};

export default function ProjectStats({
  total,
  planned,
  inProgress,
  completed,
}: ProjectStatsProps) {
  const items = [
    { label: "Total Projects", value: total },
    { label: "Planned", value: planned },
    { label: "In Progress", value: inProgress },
    { label: "Completed", value: completed },
  ];

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="mission-panel rounded-2xl border border-slate-800/80 p-5"
        >
          <p className="text-sm text-slate-400">{item.label}</p>
          <p className="mt-1 text-3xl font-bold text-white">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

