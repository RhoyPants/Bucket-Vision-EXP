import axiosApi from "@/app/lib/axios";
import { joinApiUrl } from "@/app/lib/apiUrl";

export type AttachmentDomain = "projects" | "daily-reports" | "weekly-reports";

export interface ApiAttachment {
  id: string;
  projectId?: string;
  dailyReportId?: string;
  weeklyReportId?: string;
  uploadedBy?: string;
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  createdAt?: string;
}

export type AttachmentInput = string | ApiAttachment;

const withTokenFallback = (url: string) => {
  if (typeof window === "undefined") return url;

  const token = localStorage.getItem("token");
  if (!token) return url;

  try {
    const parsed = new URL(url, window.location.origin);
    if (!parsed.searchParams.get("token")) {
      parsed.searchParams.set("token", token);
    }
    return parsed.toString();
  } catch {
    return url;
  }
};

export const getAttachmentFileUrl = (
  domain: AttachmentDomain,
  attachment: AttachmentInput,
): string => {
  if (typeof attachment === "string") return attachment;

  if (attachment.id) {
    const relative = `/api/${domain}/attachments/${attachment.id}/file`;
    const full = joinApiUrl(relative);
    return withTokenFallback(full);
  }

  return attachment.fileUrl || "";
};

export const getAttachmentFileName = (attachment: AttachmentInput, fallback = "Attachment") => {
  if (typeof attachment === "string") {
    const clean = attachment.split("?")[0];
    const fileName = clean.substring(clean.lastIndexOf("/") + 1);
    return fileName || fallback;
  }
  return attachment.fileName || fallback;
};

export const uploadAttachments = async (
  domain: AttachmentDomain,
  parentId: string,
  files: File[],
): Promise<ApiAttachment[]> => {
  const formData = new FormData();
  const uniqueFiles = files.filter(
    (file, index, list) =>
      list.findIndex(
        (item) =>
          item.name === file.name &&
          item.size === file.size &&
          item.lastModified === file.lastModified,
      ) === index,
  );

  uniqueFiles.forEach((file) => formData.append("attachments", file));

  const response = await axiosApi.post(`/${domain}/${parentId}/attachments`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data?.data || [];
};

export const getProjectAttachments = async (projectId: string): Promise<ApiAttachment[]> => {
  const response = await axiosApi.get(`/projects/${projectId}/attachments`);
  return response.data?.data || [];
};

export const deleteAttachment = async (
  domain: AttachmentDomain,
  attachmentId: string,
): Promise<void> => {
  await axiosApi.delete(`/${domain}/attachments/${attachmentId}`);
};
