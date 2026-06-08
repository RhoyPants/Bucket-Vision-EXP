import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DashboardNote, ChecklistItem } from "@/app/api-service/personalNotesService";

interface NotesState {
  notes: DashboardNote[];
  loading: boolean;
  error: string | null;
}

const initialState: NotesState = {
  notes: [],
  loading: false,
  error: null,
};

const notesSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setNotes: (state, action: PayloadAction<DashboardNote[]>) => {
      state.notes = action.payload;
    },
    addNote: (state, action: PayloadAction<DashboardNote>) => {
      state.notes.push(action.payload);
    },
    updateNote: (state, action: PayloadAction<DashboardNote>) => {
      const index = state.notes.findIndex((n) => n.id === action.payload.id);
      if (index !== -1) {
        state.notes[index] = action.payload;
      }
    },
    removeNote: (state, action: PayloadAction<string>) => {
      state.notes = state.notes.filter((n) => n.id !== action.payload);
    },
    addChecklistItem: (state, action: PayloadAction<{ noteId: string; item: ChecklistItem }>) => {
      const note = state.notes.find((n) => n.id === action.payload.noteId);
      if (note) {
        note.items.push(action.payload.item);
      }
    },
    updateChecklistItem: (state, action: PayloadAction<{ noteId: string; item: ChecklistItem }>) => {
      const note = state.notes.find((n) => n.id === action.payload.noteId);
      if (note) {
        const itemIndex = note.items.findIndex((i) => i.id === action.payload.item.id);
        if (itemIndex !== -1) {
          note.items[itemIndex] = action.payload.item;
        }
      }
    },
    removeChecklistItem: (state, action: PayloadAction<{ noteId: string; itemId: string }>) => {
      const note = state.notes.find((n) => n.id === action.payload.noteId);
      if (note) {
        note.items = note.items.filter((i) => i.id !== action.payload.itemId);
      }
    },
  },
});

export const {
  setLoading,
  setError,
  setNotes,
  addNote,
  updateNote,
  removeNote,
  addChecklistItem,
  updateChecklistItem,
  removeChecklistItem,
} = notesSlice.actions;

export default notesSlice.reducer;
