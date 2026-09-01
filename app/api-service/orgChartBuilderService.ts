import axiosApi from "@/app/lib/axios";

export type OrgChartBuilderNode = {
  id: string;
  chartId: string;
  parentId: string | null;
  name: string | null;
  position: string;
  sortOrder: number;
  x: number | null;
  y: number | null;
  photoUrl: string | null;
  parentAnchor: OrgChartAnchor;
  childAnchor: OrgChartAnchor;
  backgroundColor: string | null;
  textColor: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type OrgChartBuilderChart = {
  id: string;
  projectId: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  nodes: OrgChartBuilderNode[];
};

export type SaveOrgChartBuilderPayload = {
  title: string;
  nodes: Array<{
    clientId: string;
    parentClientId: string | null;
    name: string | null;
    position: string;
    sortOrder: number;
    x: number;
    y: number;
    photoUrl: string | null;
    parentAnchor: OrgChartAnchor;
    childAnchor: OrgChartAnchor;
    backgroundColor: string | null;
    textColor: string | null;
  }>;
};

export type OrgChartAnchor =
  | "TOP_LEFT" | "TOP_CENTER" | "TOP_RIGHT"
  | "RIGHT_TOP" | "RIGHT_CENTER" | "RIGHT_BOTTOM"
  | "BOTTOM_RIGHT" | "BOTTOM_CENTER" | "BOTTOM_LEFT"
  | "LEFT_BOTTOM" | "LEFT_CENTER" | "LEFT_TOP";

export type OrgChartCopySource = {
  projectId: string;
  projectName: string;
  version?: string | null;
  chartTitle: string;
  nodeCount: number;
  updatedAt: string;
};

export type OrgChartClonePreview = {
  sourceProject: { id: string; name: string; version?: string | null };
  destinationHasChart: boolean;
  chart: OrgChartBuilderChart;
};

const unwrap = <T,>(response: { data?: { data?: T } | T }): T => {
  const body = response.data;
  if (body && typeof body === "object" && "data" in body) return (body as { data: T }).data;
  return body as T;
};

export const orgChartBuilderService = {
  async get(projectId: string) {
    return unwrap<OrgChartBuilderChart | null>(await axiosApi.get(`/projects/${projectId}/org-chart-builder`));
  },

  async save(projectId: string, payload: SaveOrgChartBuilderPayload) {
    return unwrap<OrgChartBuilderChart>(await axiosApi.put(`/projects/${projectId}/org-chart-builder`, payload));
  },

  async remove(projectId: string) {
    return unwrap<{ deleted: boolean }>(await axiosApi.delete(`/projects/${projectId}/org-chart-builder`));
  },

  async copySources(params?: { query?: string; limit?: number; cursor?: string | null }) {
    const response = await axiosApi.get("/projects/org-chart-builder/copy-sources", {
      params: { query: params?.query || undefined, limit: params?.limit ?? 20, cursor: params?.cursor || undefined },
    });
    return {
      data: (response.data?.data ?? []) as OrgChartCopySource[],
      nextCursor: (response.data?.nextCursor ?? null) as string | null,
    };
  },

  async clonePreview(projectId: string, sourceProjectId: string) {
    return unwrap<OrgChartClonePreview>(await axiosApi.post(`/projects/${projectId}/org-chart-builder/clone-preview`, { sourceProjectId }));
  },

  async clone(projectId: string, sourceProjectId: string, replace = false) {
    return unwrap<OrgChartBuilderChart>(await axiosApi.post(`/projects/${projectId}/org-chart-builder/clone`, { sourceProjectId, replace }));
  },

  async uploadPhoto(projectId: string, photo: File) {
    const form = new FormData();
    form.append("photo", photo);
    return unwrap<{ photoUrl: string }>(await axiosApi.post(`/projects/${projectId}/org-chart-builder/photo`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    }));
  },
};
