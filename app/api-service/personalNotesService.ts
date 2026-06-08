import axios from "@/app/lib/axios";

export interface ChecklistItem {
  id: string;
  noteId: string;
  text: string;
  isDone: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardNote {
  id: string;
  dashboardId: string;
  title: string;
  content: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  items: ChecklistItem[];
}

export interface CreateNotePayload {
  title: string;
  content: string;
  sortOrder: number;
  items?: Array<{
    text: string;
    isDone: boolean;
    sortOrder: number;
  }>;
}

export interface UpdateNotePayload {
  title?: string;
  content?: string;
  sortOrder?: number;
}

export interface CreateChecklistItemPayload {
  text: string;
  isDone: boolean;
  sortOrder: number;
}

export interface UpdateChecklistItemPayload {
  text?: string;
  isDone?: boolean;
  sortOrder?: number;
}

const BASE_URL = "/personal-dashboards";

export const personalNotesService = {
  // Get all notes for a dashboard
  async getNotes(dashboardId: string) {
    const response = await axios.get(`${BASE_URL}/${dashboardId}/notes`);
    return response.data;
  },

  // Create a new note
  async createNote(dashboardId: string, payload: CreateNotePayload) {
    const response = await axios.post(`${BASE_URL}/${dashboardId}/notes`, payload);
    return response.data;
  },

  // Update a note
  async updateNote(dashboardId: string, noteId: string, payload: UpdateNotePayload) {
    const response = await axios.put(`${BASE_URL}/${dashboardId}/notes/${noteId}`, payload);
    return response.data;
  },

  // Delete a note
  async deleteNote(dashboardId: string, noteId: string) {
    const response = await axios.delete(`${BASE_URL}/${dashboardId}/notes/${noteId}`);
    return response.data;
  },

  // Add a checklist item to a note
  async createChecklistItem(dashboardId: string, noteId: string, payload: CreateChecklistItemPayload) {
    const response = await axios.post(`${BASE_URL}/${dashboardId}/notes/${noteId}/items`, payload);
    return response.data;
  },

  // Update a checklist item
  async updateChecklistItem(
    dashboardId: string,
    noteId: string,
    itemId: string,
    payload: UpdateChecklistItemPayload
  ) {
    const response = await axios.put(
      `${BASE_URL}/${dashboardId}/notes/${noteId}/items/${itemId}`,
      payload
    );
    return response.data;
  },

  // Delete a checklist item
  async deleteChecklistItem(dashboardId: string, noteId: string, itemId: string) {
    const response = await axios.delete(
      `${BASE_URL}/${dashboardId}/notes/${noteId}/items/${itemId}`
    );
    return response.data;
  },
};
