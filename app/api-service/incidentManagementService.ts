import type { AxiosRequestConfig } from "axios";
import axiosApi from "@/app/lib/axios";
import { joinApiUrl } from "@/app/lib/apiUrl";

export type Criticality = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type DurationUnit = "HOURS" | "DAYS";
export type AssignmentType = "REQUESTER_BU_HEAD" | "PROJECT_BU_HEAD" | "PROJECT_OWNER" | "ROLE" | "SPECIFIC_USER";
export type CompletionRule = "ANY_ONE" | "ALL";
export interface LookupOption { id: string; name: string }
export interface Pagination { page: number; limit: number; total: number; totalPages: number }
export interface Page<T> { success: boolean; data: T[]; pagination: Pagination }
export interface ListParams { page?: number; limit?: number; search?: string; active?: boolean; projectId?: string }
export interface Usage { incidentTypeCount: number; incidentCount: number }

export interface WorkflowLevel {
  id?: string; order: number; assignmentType: AssignmentType; roleId?: string | null; userId?: string | null; email?: string | null;
  completionRule: CompletionRule; slaValue: number | null; slaUnit: DurationUnit | null; isFinal: boolean; responsiblePartyLabel?: string;
}
export interface IncidentWorkflowPayload { name: string; description: string; isActive: boolean; allowPeerResolution: boolean; levels: WorkflowLevel[] }
export interface IncidentWorkflow extends IncidentWorkflowPayload {
  id: string; version: number; levelCount: number; totalConfiguredSla?: { value: number; unit: DurationUnit } | null;
  usage: Usage; canDelete: boolean; deleteBlockedReason: string | null;
}
export type NotificationAssignmentType = "ROLE" | "SPECIFIC_USER";
export interface NotificationLevel {
  id?: string; order: number; assignmentType: NotificationAssignmentType; roleId?: string | null; userId?: string | null;
  recipientLabel?: string; notifyAfterValue: number | null; notifyAfterUnit: DurationUnit | null;
}
export interface NotificationMatrixPayload { name: string; description: string; isActive: boolean; levels: NotificationLevel[] }
export interface NotificationMatrix extends NotificationMatrixPayload {
  id: string; version: number; levelCount: number; usage: Usage; canDelete: boolean; deleteBlockedReason: string | null;
}
export interface IncidentTypePayload {
  name: string; description: string; defaultCriticality: Criticality; incidentWorkflowId: string;
  resolutionSlaValue: number; resolutionSlaUnit: DurationUnit; notificationMatrixId: string; isActive: boolean;
}
export interface IncidentType extends IncidentTypePayload {
  id: string;
  incidentWorkflow: Pick<IncidentWorkflow, "id" | "name" | "isActive" | "version" | "levelCount" | "totalConfiguredSla">;
  notificationMatrix: Pick<NotificationMatrix, "id" | "name" | "isActive" | "version" | "levelCount">;
  incidentCount?: number; canDelete?: boolean; deleteBlockedReason?: string | null; slaWarning?: { code: string; message: string } | null;
}

export const workflowRequest: AxiosRequestConfig & { preserveApiError: boolean } = { preserveApiError: true };
export const workflowUrl = (path: string) => joinApiUrl(`/api${path}`);
export function workflowError(error: unknown): { message: string; code?: string; fields: Record<string, string> } {
  const value = error as { message?: string; response?: { data?: { error?: { code?: string; message?: string; fields?: Record<string, string> }; message?: string } } };
  const body = value?.response?.data;
  return { message: body?.error?.message || body?.message || value?.message || (typeof error === "string" ? error : "The request failed. Please try again."), code: body?.error?.code, fields: body?.error?.fields || {} };
}
const library = <T, P>(path: string) => ({
  async list(params: ListParams = {}): Promise<Page<T>> { return (await axiosApi.get(workflowUrl(path), { ...workflowRequest, params })).data; },
  async get(id: string): Promise<T> { return (await axiosApi.get(workflowUrl(`${path}/${id}`), workflowRequest)).data.data; },
  async create(payload: P): Promise<T> { return (await axiosApi.post(workflowUrl(path), payload, workflowRequest)).data.data; },
  async update(id: string, payload: Partial<P> & { version?: number }): Promise<T> { return (await axiosApi.patch(workflowUrl(`${path}/${id}`), payload, workflowRequest)).data.data; },
  async remove(id: string): Promise<void> { await axiosApi.delete(workflowUrl(`${path}/${id}`), workflowRequest); },
});
export const incidentWorkflowService = library<IncidentWorkflow, IncidentWorkflowPayload>("/admin/incident-workflows");
export const notificationMatrixService = library<NotificationMatrix, NotificationMatrixPayload>("/admin/escalation-notification-matrices");
export const incidentTypeService = library<IncidentType, IncidentTypePayload>("/admin/incident-types");

export async function allPages<T>(fetchPage: (page: number) => Promise<Page<T>>): Promise<T[]> {
  const items: T[] = []; let page = 1; let totalPages = 1;
  do { const result = await fetchPage(page); items.push(...result.data); totalPages = result.pagination.totalPages; page++; } while (page <= totalPages);
  return items;
}
export const activeWorkflows = () => allPages((page) => incidentWorkflowService.list({ active: true, page, limit: 100 }));
export const activeNotificationMatrices = () => allPages((page) => notificationMatrixService.list({ active: true, page, limit: 100 }));
export const selectableIncidentTypes = (projectId: string) => allPages<IncidentType>(async (page) => (await axiosApi.get(workflowUrl("/incident-types"), { ...workflowRequest, params: { projectId, page, limit: 100 } })).data);
export const assignmentOptions = async (kind: "roles" | "users"): Promise<LookupOption[]> => (await axiosApi.get(workflowUrl(`/${kind}`), { ...workflowRequest, params: { active: true } })).data;

const assignmentFields = (level: { assignmentType: AssignmentType; roleId?: string | null; userId?: string | null }) => ({
  ...(level.assignmentType === "ROLE" ? { roleId: level.roleId } : {}),
  ...(level.assignmentType === "SPECIFIC_USER" ? { userId: level.userId } : {}),
});
export function serializeWorkflowLevels(levels: WorkflowLevel[]): WorkflowLevel[] {
  return levels.map((level, index) => ({ ...(level.id ? { id: level.id } : {}), order: index + 1, assignmentType: level.assignmentType, ...assignmentFields(level), completionRule: level.completionRule, slaValue: level.slaValue, slaUnit: level.slaUnit, isFinal: index === levels.length - 1 }));
}
export function serializeNotificationLevels(levels: NotificationLevel[]): NotificationLevel[] {
  return levels.map((level, index) => ({ ...(level.id ? { id: level.id } : {}), order: index + 1, assignmentType: level.assignmentType, ...assignmentFields(level), notifyAfterValue: level.notifyAfterValue, notifyAfterUnit: level.notifyAfterUnit }));
}
const validDuration = (value: number | null, unit: DurationUnit | null, allowZero: boolean) => value != null && Number.isFinite(value) && value <= 36500 && (allowZero ? value >= 0 : value > 0) && (unit !== "DAYS" || Number.isInteger(value));
const validateAssignment = (level: { assignmentType: AssignmentType; roleId?: string | null; userId?: string | null }, prefix: string, errors: Record<string, string>) => {
  if (level.assignmentType === "ROLE" && !level.roleId) errors[`${prefix}.roleId`] = "Select an active role.";
  if (level.assignmentType === "SPECIFIC_USER" && !level.userId) errors[`${prefix}.userId`] = "Select an active user.";
};
export function validateWorkflow(payload: IncidentWorkflowPayload): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!payload.name.trim()) errors.name = "Enter a workflow name.";
  if (!payload.levels.length) errors.levels = "Add at least one workflow level.";
  payload.levels.forEach((level, index) => { const prefix = `levels[${index}]`; validateAssignment(level, prefix, errors); if (!level.slaUnit) errors[`${prefix}.slaUnit`] = "Select an SLA unit."; if (!validDuration(level.slaValue, level.slaUnit, false)) errors[`${prefix}.slaValue`] = "Enter a positive SLA up to 36500; days must be whole numbers."; });
  return errors;
}
export function validateNotificationMatrix(payload: NotificationMatrixPayload): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!payload.name.trim()) errors.name = "Enter a notification matrix name.";
  if (!payload.levels.length) errors.levels = "Add at least one notification level.";
  payload.levels.forEach((level, index) => { const prefix = `levels[${index}]`; validateAssignment(level, prefix, errors); if (!level.notifyAfterUnit) errors[`${prefix}.notifyAfterUnit`] = "Select a delay unit."; if (!validDuration(level.notifyAfterValue, level.notifyAfterUnit, true)) errors[`${prefix}.notifyAfterValue`] = "Enter zero or a positive delay; days must be whole numbers."; });
  return errors;
}
