export type ViewType = "card" | "list";

export type ProjectTab =
  | "active"
  | "pending"
  | "draft"
  | "for-review"
  | "for-approval"
  | "archived";

export interface ProjectCardActions {
  onEdit: (project: any) => void;
  onDelete: (projectId: string) => void;
  onSetup: (projectId: string) => void;
  onViewApproval: (project: any) => void;
  onSubmitForApproval: (project: any) => void;
  onTeamManage: (project: any) => void;
  onVersion: (project: any) => void;
  onSprint: (projectId: string) => void;
  onCreateProject: () => void;
}
