import axiosApi from "@/app/lib/axios";

export type IncidentStatus = "PENDING" | "RESOLVED" | "CANCELLED";
export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface IncidentAttachment {
  id: string;
  incidentId: string;
  fileName: string;
  mimeType?: string;
  size?: number;
  proxyUrl?: string;
  createdAt?: string;
}

export interface IncidentPerson {
  id: string;
  name?: string;
  email?: string;
  position?: string;
}

export interface Incident {
  id: string;
  incidentNumber: string;
  projectId: string;
  title: string;
  description: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  dateRaised: string;
  dateAddressed?: string | null;
  remarks?: string | null;
  cancellationReason?: string | null;
  reportedBy?: IncidentPerson | null;
  resolvedBy?: IncidentPerson | null;
  cancelledBy?: IncidentPerson | null;
  scopeId?: string | null;
  taskId?: string | null;
  subtaskId?: string | null;
  scope?: { id: string; name: string } | null;
  task?: { id: string; title: string } | null;
  subtask?: { id: string; title: string } | null;
  attachments?: IncidentAttachment[];
}

export interface IncidentPayload {
  projectId?: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  dateRaised?: string;
  remarks?: string | null;
  scopeId?: string | null;
  taskId?: string | null;
  subtaskId?: string | null;
}

const data = <T>(response: { data?: { data?: T } | T }): T => {
  const body = response.data;
  return ((body && typeof body === "object" && "data" in body ? body.data : body) ?? null) as T;
};

const uniqueFiles = (files: File[]) =>
  files.filter(
    (file, index, list) =>
      list.findIndex(
        (item) =>
          item.name === file.name &&
          item.size === file.size &&
          item.lastModified === file.lastModified,
      ) === index,
  );

export const incidentService = {
  async list(projectId: string, filters?: { status?: string; severity?: string }) {
    const response = await axiosApi.get("/incidents", { params: { projectId, ...filters, limit: 100 } });
    const body = response.data;
    return {
      incidents: (body?.data ?? []) as Incident[],
      pagination: body?.pagination,
    };
  },
  async get(id: string) {
    return data<Incident>(await axiosApi.get(`/incidents/${id}`));
  },
  async create(payload: IncidentPayload, files: File[] = []) {
    if (!files.length) return data<Incident>(await axiosApi.post("/incidents", payload));
    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") form.append(key, String(value));
    });
    uniqueFiles(files).forEach((file) => form.append("attachments", file));
    return data<Incident>(
      await axiosApi.post("/incidents", form, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
  },
  async update(id: string, payload: Omit<IncidentPayload, "projectId">) {
    return data<Incident>(await axiosApi.put(`/incidents/${id}`, payload));
  },
  async resolve(id: string, payload: { remarks?: string; dateAddressed?: string }) {
    return data<Incident>(await axiosApi.patch(`/incidents/${id}/resolve`, payload));
  },
  async cancel(id: string, reason: string) {
    return data<Incident>(await axiosApi.patch(`/incidents/${id}/cancel`, { reason }));
  },
  async remove(id: string) {
    await axiosApi.delete(`/incidents/${id}`);
  },
  async upload(id: string, files: File[]) {
    const form = new FormData();
    uniqueFiles(files).forEach((file) => form.append("attachments", file));
    return data<IncidentAttachment[]>(
      await axiosApi.post(`/incidents/${id}/attachments`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
  },
  async removeAttachment(id: string) {
    await axiosApi.delete(`/incidents/attachments/${id}`);
  },
  async downloadAttachment(attachment: IncidentAttachment) {
    const response = await axiosApi.get(`/incidents/attachments/${attachment.id}/file`, { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = attachment.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  },
  async viewAttachment(attachment: IncidentAttachment) {
    const previewWindow = window.open("", "_blank");
    try {
      const response = await axiosApi.get(`/incidents/attachments/${attachment.id}/file`, { responseType: "blob" });
      const blob = new Blob([response.data], {
        type: attachment.mimeType || response.headers["content-type"] || "application/octet-stream",
      });
      const url = URL.createObjectURL(blob);
      if (previewWindow) {
        previewWindow.location.href = url;
      } else {
        window.open(url, "_blank");
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      previewWindow?.close();
      throw error;
    }
  },
};
