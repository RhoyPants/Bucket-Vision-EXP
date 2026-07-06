"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  IconButton,
  Checkbox,
  Alert,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import NoteIcon from "@mui/icons-material/Note";
import { DashboardNote, ChecklistItem } from "@/app/api-service/personalNotesService";

const NOTE_LIST_TAB = "__note_list__";

interface DashboardNotesProps {
  notes: DashboardNote[];
  loading: boolean;
  error: string | null;
  onCreateNote: (payload: { title: string; content: string; sortOrder: number; items?: Array<{ text: string; isDone: boolean; sortOrder: number }> }) => Promise<void>;
  onEditNote: (noteId: string, payload: { title?: string; content?: string; sortOrder?: number }) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  onAddChecklistItem: (noteId: string, payload: { text: string; isDone: boolean; sortOrder: number }) => Promise<void>;
  onEditChecklistItem: (noteId: string, itemId: string, payload: { text?: string; isDone?: boolean; sortOrder?: number }) => Promise<void>;
  onDeleteChecklistItem: (noteId: string, itemId: string) => Promise<void>;
}

export default function DashboardNotes({
  notes,
  loading,
  error,
  onCreateNote,
  onEditNote,
  onDeleteNote,
  onAddChecklistItem,
  onEditChecklistItem,
  onDeleteChecklistItem,
}: DashboardNotesProps) {
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<DashboardNote | null>(null);
  const [noteForm, setNoteForm] = useState({ title: "", content: "", sortOrder: 0 });
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState("");

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [selectedNoteForItem, setSelectedNoteForItem] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({ text: "", sortOrder: 0 });
  const [itemSaving, setItemSaving] = useState(false);
  const [itemError, setItemError] = useState("");

  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string>(NOTE_LIST_TAB);
  const [inlineItemText, setInlineItemText] = useState("");
  const [inlineItemSavingNoteId, setInlineItemSavingNoteId] = useState<string | null>(null);
  const [inlineItemError, setInlineItemError] = useState("");

  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => a.sortOrder - b.sortOrder),
    [notes]
  );

  const selectedNote = useMemo(
    () => sortedNotes.find((note) => note.id === selectedNoteId) ?? null,
    [selectedNoteId, sortedNotes]
  );

  const isListView = selectedNoteId === NOTE_LIST_TAB;

  useEffect(() => {
    if (!sortedNotes.length) {
      setSelectedNoteId(NOTE_LIST_TAB);
      return;
    }
    if (selectedNoteId !== NOTE_LIST_TAB && !sortedNotes.some((note) => note.id === selectedNoteId)) {
      setSelectedNoteId(NOTE_LIST_TAB);
    }
  }, [selectedNoteId, sortedNotes]);

  const handleOpenNoteDialog = (note?: DashboardNote) => {
    if (note) {
      setEditingNote(note);
      setNoteForm({ title: note.title, content: note.content, sortOrder: note.sortOrder });
    } else {
      setEditingNote(null);
      setNoteForm({ title: "", content: "", sortOrder: notes.length });
    }
    setNoteError("");
    setNoteDialogOpen(true);
  };

  const handleCloseNoteDialog = () => {
    setNoteDialogOpen(false);
    setEditingNote(null);
    setNoteForm({ title: "", content: "", sortOrder: 0 });
  };

  const handleSaveNote = async () => {
    if (!noteForm.title.trim()) {
      setNoteError("Note title is required");
      return;
    }

    setNoteSaving(true);
    setNoteError("");
    try {
      if (editingNote) {
        await onEditNote(editingNote.id, {
          title: noteForm.title.trim(),
          content: noteForm.content.trim(),
          sortOrder: noteForm.sortOrder,
        });
      } else {
        await onCreateNote({
          title: noteForm.title.trim(),
          content: noteForm.content.trim(),
          sortOrder: noteForm.sortOrder,
        });
      }
      handleCloseNoteDialog();
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : "Failed to save note");
    } finally {
      setNoteSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm("Delete this note and all its items?")) return;
    try {
      await onDeleteNote(noteId);
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : "Failed to delete note");
    }
  };

  const handleOpenItemDialog = (note: DashboardNote, item?: ChecklistItem) => {
    setSelectedNoteForItem(note.id);
    if (item) {
      setEditingItem(item);
      setItemForm({ text: item.text, sortOrder: item.sortOrder });
    } else {
      setEditingItem(null);
      setItemForm({ text: "", sortOrder: note.items.length });
    }
    setItemError("");
    setItemDialogOpen(true);
  };

  const handleCloseItemDialog = () => {
    setItemDialogOpen(false);
    setSelectedNoteForItem(null);
    setEditingItem(null);
    setItemForm({ text: "", sortOrder: 0 });
  };

  const handleSaveItem = async () => {
    if (!itemForm.text.trim() || !selectedNoteForItem) {
      setItemError("Item text is required");
      return;
    }

    setItemSaving(true);
    setItemError("");
    try {
      if (editingItem) {
        await onEditChecklistItem(selectedNoteForItem, editingItem.id, {
          text: itemForm.text.trim(),
          sortOrder: itemForm.sortOrder,
        });
      } else {
        await onAddChecklistItem(selectedNoteForItem, {
          text: itemForm.text.trim(),
          isDone: false,
          sortOrder: itemForm.sortOrder,
        });
      }
      handleCloseItemDialog();
    } catch (err) {
      setItemError(err instanceof Error ? err.message : "Failed to save item");
    } finally {
      setItemSaving(false);
    }
  };

  const handleAddInlineItem = async (note: DashboardNote) => {
    const text = inlineItemText.trim();
    if (!text) {
      setInlineItemError("Checklist item is required");
      return;
    }

    setInlineItemSavingNoteId(note.id);
    setInlineItemError("");
    try {
      await onAddChecklistItem(note.id, {
        text,
        isDone: false,
        sortOrder: note.items.length,
      });
      setInlineItemText("");
    } catch (err) {
      setInlineItemError(err instanceof Error ? err.message : "Failed to add checklist item");
    } finally {
      setInlineItemSavingNoteId(null);
    }
  };

  const handleToggleItemDone = async (note: DashboardNote, item: ChecklistItem) => {
    try {
      await onEditChecklistItem(note.id, item.id, { isDone: !item.isDone });
    } catch (err) {
      console.error("Failed to update item:", err);
    }
  };

  const handleDeleteItem = async (noteId: string, itemId: string) => {
    if (!window.confirm("Delete this checklist item?")) return;
    try {
      await onDeleteChecklistItem(noteId, itemId);
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  if (loading) {
    return (
      <Card sx={{ borderRadius: 2, border: "1px solid #dbeafe", boxShadow: "none", backgroundColor: "#fff" }}>
        <CardContent sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={32} />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card sx={{ borderRadius: 2, border: "1px solid #dbeafe", boxShadow: "none", backgroundColor: "#fff" }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <NoteIcon sx={{ color: "#4B2E83" }} />
              <Typography fontWeight={900}>Notes & Checklist</Typography>
            </Stack>
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenNoteDialog()}
              sx={{ textTransform: "none", fontWeight: 800, backgroundColor: "#4B2E83" }}
            >
              Add Note
            </Button>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {notes.length === 0 ? (
            <Alert severity="info">
              No notes yet. Create one to organize your dashboard activities.
            </Alert>
          ) : (
            <Card sx={{ border: "1px solid #dbeafe", borderRadius: 2, boxShadow: "none", backgroundColor: "#fff" }}>
              <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                <Tabs
                  value={selectedNoteId}
                  onChange={(_, value) => setSelectedNoteId(value)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    px: 1,
                    borderBottom: "1px solid #e2e8f0",
                    minHeight: 42,
                    "& .MuiTab-root": {
                      minHeight: 42,
                      textTransform: "none",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#64748b",
                      maxWidth: 220,
                    },
                    "& .Mui-selected": {
                      color: "#1d4ed8",
                    },
                  }}
                >
                  <Tab value={NOTE_LIST_TAB} label="Note List" sx={{ fontWeight: 800 }} />
                  {sortedNotes.map((note) => (
                    <Tab
                      key={note.id}
                      value={note.id}
                      label={note.title}
                      sx={{
                        maxWidth: 220,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    />
                  ))}
                </Tabs>

                {isListView && (
                  <Box sx={{ p: 1.5 }}>
                    <Stack spacing={1}>
                      {sortedNotes.map((note) => (
                        <Box
                          key={note.id}
                          onClick={() => setSelectedNoteId(note.id)}
                          sx={{
                            p: 1,
                            borderRadius: 1.25,
                            border: "1px solid #e2e8f0",
                            backgroundColor: "#f8fbff",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            "&:hover": {
                              borderColor: "#93c5fd",
                              backgroundColor: "#eff6ff",
                            },
                          }}
                        >
                          <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#1e3a8a", mb: 0.25 }}>
                            {note.title}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 11,
                              color: "#64748b",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {note.content || "No description"}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}

                {!isListView && selectedNote && (
                  <Box sx={{ p: 1.5 }}>
                    <Box
                      sx={{
                        position: "relative",
                        "&:hover .note-actions": {
                          opacity: 1,
                          pointerEvents: "auto",
                        },
                      }}
                    >
                      <Box sx={{ minWidth: 0, pr: { sm: 6 }, mb: 1 }}>
                        <Typography fontWeight={800} sx={{ fontSize: 14, color: "#1e3a8a" }}>
                          {selectedNote.title}
                        </Typography>
                        {selectedNote.content && (
                          <Typography sx={{ fontSize: 12, color: "#64748b", mt: 0.5 }}>
                            {selectedNote.content}
                          </Typography>
                        )}
                      </Box>

                      <Stack
                        className="note-actions"
                        direction="row"
                        spacing={0.5}
                        sx={{
                          position: "absolute",
                          top: -2,
                          right: -4,
                          opacity: 0,
                          pointerEvents: "none",
                          transition: "opacity 0.18s ease",
                          backgroundColor: "rgba(255,255,255,0.92)",
                          border: "1px solid #e2e8f0",
                          borderRadius: 1,
                          px: 0.25,
                        }}
                      >
                        <Tooltip title="Edit note">
                          <IconButton size="small" onClick={() => handleOpenNoteDialog(selectedNote)}>
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete note">
                          <IconButton size="small" color="error" onClick={() => handleDeleteNote(selectedNote.id)}>
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>

                    {selectedNote.items.length > 0 && (
                      <Stack spacing={0.75} sx={{ mt: 1.25 }}>
                        {[...selectedNote.items]
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map((item) => (
                            <Box
                              key={item.id}
                              sx={{
                                position: "relative",
                                "&:hover .item-actions": {
                                  opacity: 1,
                                  pointerEvents: "auto",
                                },
                              }}
                            >
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                                sx={{
                                  p: 0.75,
                                  pr: { xs: 0.75, sm: 5.5 },
                                  borderRadius: 1,
                                  backgroundColor: "#f8fafc",
                                  border: "1px solid #e2e8f0",
                                }}
                              >
                                <Checkbox
                                  size="small"
                                  checked={item.isDone}
                                  onChange={() => handleToggleItemDone(selectedNote, item)}
                                  sx={{ py: 0 }}
                                />
                                <Typography
                                  sx={{
                                    fontSize: 12,
                                    flex: 1,
                                    textDecoration: item.isDone ? "line-through" : "none",
                                    color: item.isDone ? "#9ca3af" : "#334155",
                                  }}
                                >
                                  {item.text}
                                </Typography>
                              </Stack>

                              <Stack
                                className="item-actions"
                                direction="row"
                                spacing={0.25}
                                sx={{
                                  position: "absolute",
                                  top: "50%",
                                  right: 6,
                                  transform: "translateY(-50%)",
                                  opacity: 0,
                                  pointerEvents: "none",
                                  transition: "opacity 0.18s ease",
                                  backgroundColor: "rgba(255,255,255,0.95)",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: 1,
                                  px: 0.25,
                                }}
                              >
                                <Tooltip title="Edit">
                                  <IconButton
                                    size="small"
                                    sx={{ py: 0, px: 0.5 }}
                                    onClick={() => handleOpenItemDialog(selectedNote, item)}
                                  >
                                    <EditIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    sx={{ py: 0, px: 0.5 }}
                                    onClick={() => handleDeleteItem(selectedNote.id, item.id)}
                                  >
                                    <DeleteIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </Box>
                          ))}
                      </Stack>
                    )}

                    <Stack spacing={0.75} sx={{ mt: 1 }}>
                      {inlineItemError && (
                        <Alert severity="error" sx={{ py: 0.25, fontSize: 11 }}>
                          {inlineItemError}
                        </Alert>
                      )}
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={0.75}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Add checklist item..."
                          value={inlineItemText}
                          onChange={(e) => {
                            setInlineItemText(e.target.value);
                            setInlineItemError("");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddInlineItem(selectedNote);
                            }
                          }}
                          disabled={inlineItemSavingNoteId === selectedNote.id}
                          sx={{
                            "& .MuiInputBase-input": {
                              fontSize: 12,
                              py: 0.8,
                            },
                          }}
                        />
                      <Button
                        size="small"
                        startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                        variant="outlined"
                        onClick={() => handleAddInlineItem(selectedNote)}
                        disabled={inlineItemSavingNoteId === selectedNote.id}
                        sx={{ fontSize: 11, textTransform: "none", fontWeight: 800, whiteSpace: "nowrap" }}
                      >
                        {inlineItemSavingNoteId === selectedNote.id ? "Adding..." : "Add"}
                      </Button>
                      </Stack>
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Dialog open={noteDialogOpen} onClose={handleCloseNoteDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingNote ? "Edit Note" : "Create Note"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {noteError && <Alert severity="error">{noteError}</Alert>}
            <TextField
              label="Note Title"
              fullWidth
              required
              value={noteForm.title}
              onChange={(e) => setNoteForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Today's priorities"
              size="small"
            />
            <TextField
              label="Note Content"
              fullWidth
              multiline
              rows={3}
              value={noteForm.content}
              onChange={(e) => setNoteForm((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Add details or context..."
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseNoteDialog}>Cancel</Button>
          <Button variant="contained" disabled={noteSaving} onClick={handleSaveNote}>
            {noteSaving ? "Saving..." : editingNote ? "Update Note" : "Create Note"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={itemDialogOpen} onClose={handleCloseItemDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingItem ? "Edit Checklist Item" : "Add Checklist Item"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {itemError && <Alert severity="error">{itemError}</Alert>}
            <TextField
              label="Item Description"
              fullWidth
              required
              multiline
              rows={2}
              value={itemForm.text}
              onChange={(e) => setItemForm((prev) => ({ ...prev, text: e.target.value }))}
              placeholder="What needs to be done?"
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseItemDialog}>Cancel</Button>
          <Button variant="contained" disabled={itemSaving} onClick={handleSaveItem}>
            {itemSaving ? "Saving..." : editingItem ? "Update Item" : "Add Item"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
