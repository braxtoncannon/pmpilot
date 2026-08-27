import type { SortOption } from "./ProjectTypes";

type ProjectFiltersProps = {
  search: string;
  priorityFilter: string;
  typeFilter: string;
  statusFilter: string;
  sortBy: SortOption;
  projectTypes: string[];
  visibleCount: number;
  totalCount: number;
  inputStyles: string;
  onSearchChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSortChange: (value: SortOption) => void;
  onClear: () => void;
};

export default function ProjectFilters({
  search,
  priorityFilter,
  typeFilter,
  statusFilter,
  sortBy,
  projectTypes,
  visibleCount,
  totalCount,
  inputStyles,
  onSearchChange,
  onPriorityChange,
  onTypeChange,
  onStatusChange,
  onSortChange,
  onClear,
}: ProjectFiltersProps) {
  return (
    <section className="mission-panel mb-8 rounded-2xl border border-slate-800/80 p-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label
            htmlFor="project-search"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Search
          </label>

          <input
            id="project-search"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Name, description, priority, type, or status..."
            className={inputStyles}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Priority
          </label>

          <select
            value={priorityFilter}
            onChange={(event) => onPriorityChange(event.target.value)}
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
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Type
          </label>

          <select
            value={typeFilter}
            onChange={(event) => onTypeChange(event.target.value)}
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
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Status
          </label>

          <select
            value={statusFilter}
            onChange={(event) => onStatusChange(event.target.value)}
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
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Sort by
          </label>

          <select
            value={sortBy}
            onChange={(event) =>
              onSortChange(event.target.value as SortOption)
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
          onClick={onClear}
          className="rounded-lg border border-slate-700 bg-slate-900/80 px-5 py-3 text-slate-200 hover:border-cyan-400/40 hover:text-white"
        >
          Clear Filters
        </button>

        <p className="text-sm text-slate-400">
          Showing {visibleCount} of {totalCount}
        </p>
      </div>
    </section>
  );
}
