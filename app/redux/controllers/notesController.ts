import { AppDispatch } from "../store";
import {
  setLoading,
  setError,
  setNotes,
  addNote,
  updateNote,
  removeNote,
  addChecklistItem,
  updateChecklistItem,
  removeChecklistItem,
} from "../slices/notesSlice";
import {
  personalNotesService,
  CreateNotePayload,
  UpdateNotePayload,
  CreateChecklistItemPayload,
  UpdateChecklistItemPayload,
} from "@/app/api-service/personalNotesService";

const notesInFlight = new Map<
  string,
  ReturnType<typeof personalNotesService.getNotes>
>();

export const fetchNotes = (dashboardId: string) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    const request =
      notesInFlight.get(dashboardId) ||
      personalNotesService.getNotes(dashboardId).finally(() => {
        notesInFlight.delete(dashboardId);
      });
    notesInFlight.set(dashboardId, request);

    const response = await request;
    dispatch(setNotes(response.data || []));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch notes";
    dispatch(setError(message));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const createNote = (dashboardId: string, payload: CreateNotePayload) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setError(null));
    const response = await personalNotesService.createNote(dashboardId, payload);
    dispatch(addNote(response.data));
    return response.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create note";
    dispatch(setError(message));
    throw error;
  }
};

export const editNote = (dashboardId: string, noteId: string, payload: UpdateNotePayload) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setError(null));
    const response = await personalNotesService.updateNote(dashboardId, noteId, payload);
    dispatch(updateNote(response.data));
    return response.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update note";
    dispatch(setError(message));
    throw error;
  }
};

export const deleteNote = (dashboardId: string, noteId: string) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setError(null));
    await personalNotesService.deleteNote(dashboardId, noteId);
    dispatch(removeNote(noteId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete note";
    dispatch(setError(message));
    throw error;
  }
};

export const addChecklistItemToNote = (
  dashboardId: string,
  noteId: string,
  payload: CreateChecklistItemPayload
) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setError(null));
    const response = await personalNotesService.createChecklistItem(dashboardId, noteId, payload);
    dispatch(addChecklistItem({ noteId, item: response.data }));
    return response.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add checklist item";
    dispatch(setError(message));
    throw error;
  }
};

export const editChecklistItem = (
  dashboardId: string,
  noteId: string,
  itemId: string,
  payload: UpdateChecklistItemPayload
) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setError(null));
    const response = await personalNotesService.updateChecklistItem(
      dashboardId,
      noteId,
      itemId,
      payload
    );
    dispatch(updateChecklistItem({ noteId, item: response.data }));
    return response.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update checklist item";
    dispatch(setError(message));
    throw error;
  }
};

export const removeChecklistItemFromNote = (
  dashboardId: string,
  noteId: string,
  itemId: string
) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setError(null));
    await personalNotesService.deleteChecklistItem(dashboardId, noteId, itemId);
    dispatch(removeChecklistItem({ noteId, itemId }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete checklist item";
    dispatch(setError(message));
    throw error;
  }
};
