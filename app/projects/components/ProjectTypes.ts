export type ProjectStatus = "Planned" | "In Progress" | "Completed";

export type Project = {
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

export type EditForm = {
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

export type SortOption =
  | "newest"
  | "oldest"
  | "deadline"
  | "priority"
  | "name";

  