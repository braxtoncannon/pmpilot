import type { FormEvent } from "react";

type MissionFormProps = {
  name: string;
  description: string;
  budget: string;
  deadline: string;
  priority: string;
  projectType: string;
  teamSize: string;
  loading: boolean;
  error: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onBudgetChange: (value: string) => void;
  onDeadlineChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onProjectTypeChange: (value: string) => void;
  onTeamSizeChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
};

export default function MissionForm({
  name,
  description,
  budget,
  deadline,
  priority,
  projectType,
  teamSize,
  loading,
  error,
  onNameChange,
  onDescriptionChange,
  onBudgetChange,
  onDeadlineChange,
  onPriorityChange,
  onProjectTypeChange,
  onTeamSizeChange,
  onSubmit,
  onBack,
}: MissionFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="mission-panel-strong fade-up space-y-5 p-6 sm:p-8"
    >
      <div>
        <p className="mission-label">Mission Parameters</p>
        <h2 className="mt-2 text-2xl font-bold text-white">
          Build a new project
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Enter the project details and PMPilot will generate the mission plan.
        </p>
      </div>

      <div>
        <label className="mission-label mb-2 block">Project Name</label>
        <input
          type="text"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Example: Campus Event Planner"
          className="space-input"
        />
      </div>

      <div>
        <label className="mission-label mb-2 block">
          Project Description
        </label>
        <textarea
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="Describe what you want to accomplish"
          rows={5}
          className="space-input"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mission-label mb-2 block">Deadline</label>
          <input
            type="date"
            value={deadline}
            onChange={(event) => onDeadlineChange(event.target.value)}
            className="space-input"
          />
        </div>

        <div>
          <label className="mission-label mb-2 block">Budget ($)</label>
          <input
            type="number"
            min="0"
            value={budget}
            onChange={(event) => onBudgetChange(event.target.value)}
            placeholder="1500"
            className="space-input"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label className="mission-label mb-2 block">Priority</label>
          <select
            value={priority}
            onChange={(event) => onPriorityChange(event.target.value)}
            className="space-input"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div>
          <label className="mission-label mb-2 block">Project Type</label>
          <select
            value={projectType}
            onChange={(event) => onProjectTypeChange(event.target.value)}
            className="space-input"
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
          <label className="mission-label mb-2 block">Team Size</label>
          <input
            type="number"
            min="1"
            value={teamSize}
            onChange={(event) => onTeamSizeChange(event.target.value)}
            className="space-input"
          />
        </div>
      </div>

      {error && <p className="space-error">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="space-secondary-button w-full"
        >
          Back
        </button>

        <button
          type="submit"
          disabled={loading}
          className="space-primary-button w-full"
        >
          {loading ? "Generating Mission..." : "Generate Mission Plan"}
        </button>
      </div>
    </form>
  );
}
