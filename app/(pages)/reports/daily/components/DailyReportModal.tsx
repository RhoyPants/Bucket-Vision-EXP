"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Autocomplete,
  Chip,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import {
  createDailyReport,
  updateDailyReport,
} from "@/app/redux/controllers/dailyReportController";
import { getProjects } from "@/app/redux/controllers/projectController";
import { getUsers } from "@/app/redux/controllers/userController";
import { getProjectMembers } from "@/app/redux/controllers/projectMemberController";
import { DailyReport } from "@/app/redux/slices/dailyReportSlice";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

interface DailyReportModalProps {
  open: boolean;
  onClose: () => void;
  report: DailyReport | null;
}

interface FormData {
  dayNumber: number;
  date: string;
  remarks: string;
  location: string;
  attachments: string[];
  receiverIds: string[];
}

export default function DailyReportModal({
  open,
  onClose,
  report,
}: DailyReportModalProps) {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [formData, setFormData] = useState<FormData>({
    dayNumber: 1,
    date: new Date().toISOString().split("T")[0],
    remarks: "",
    location: "",
    attachments: [],
    receiverIds: [],
  });

  const users = useAppSelector((state) => state.user.users);
  const projects = useAppSelector((state) => state.project.projects);
  const usersLoading = useAppSelector((state) => state.user.loading);
  const projectsLoading = useAppSelector((state) => state.project.loading);
  const projectMembers = useAppSelector((state) => state.projectMembers.projectMembers);

  useEffect(() => {
    if (open && users.length === 0) {
      dispatch(getUsers() as any);
    }
  }, [open, dispatch, users.length]);

  useEffect(() => {
    if (open && projects.length === 0) {
      dispatch(getProjects() as any);
    }
  }, [open, dispatch, projects.length]);

  // Fetch project members when project is selected
  useEffect(() => {
    if (selectedProject && open) {
      dispatch(getProjectMembers(selectedProject) as any);
    }
  }, [selectedProject, open, dispatch]);

  useEffect(() => {
    if (report) {
      setFormData({
        dayNumber: report.dayNumber,
        date: report.date.split("T")[0],
        remarks: report.remarks,
        location: report.location,
        attachments: report.attachments || [],
        receiverIds: report.receivers.map((r) => r.user.id),
      });
      setSelectedProject(report.projectId);
    } else {
      setFormData({
        dayNumber: 1,
        date: new Date().toISOString().split("T")[0],
        remarks: "",
        location: "",
        attachments: [],
        receiverIds: [],
      });
      setSelectedProject("");
    }
  }, [report, open]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleReceiverChange = (selectedUsers: any[]) => {
    setFormData((prev) => ({
      ...prev,
      receiverIds: selectedUsers.map((u) => u.id),
    }));
  };

  const handleSubmit = async () => {
    if (!selectedProject) {
      alert("Please select a project");
      return;
    }

    if (!formData.remarks.trim() || !formData.location.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    if (formData.receiverIds.length === 0) {
      alert("Please select at least one receiver");
      return;
    }

    setLoading(true);

    try {
      if (report) {
        await dispatch(
          updateDailyReport(report.id, {
            dayNumber: formData.dayNumber,
            date: formData.date,
            remarks: formData.remarks,
            location: formData.location,
            attachments: formData.attachments,
            receiverIds: formData.receiverIds,
          }) as any
        );
      } else {
        await dispatch(
          createDailyReport({
            projectId: selectedProject,
            dayNumber: formData.dayNumber,
            date: formData.date,
            remarks: formData.remarks,
            location: formData.location,
            attachments: formData.attachments,
            receiverIds: formData.receiverIds,
          }) as any
        );
      }
      onClose();
    } catch (error) {
      console.error("Error saving report:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedReceivers = users.filter((u) =>
    formData.receiverIds.includes(u.id)
  );

  // Get only owner and sub-owners of the selected project
  const filterAvailableReceivers = () => {
    if (!selectedProject || !projectMembers) {
      return users; // Show all users if no project selected or members not loaded
    }

    const membersGrouped = projectMembers as any;
    const allowedUserIds = new Set<string>();

    // Add owner
    if (membersGrouped.owner && Array.isArray(membersGrouped.owner)) {
      membersGrouped.owner.forEach((member: any) => {
        const userId = member.userId || member.user?.id;
        if (userId) allowedUserIds.add(userId);
      });
    }

    // Add sub-owners
    if (membersGrouped.subOwners && Array.isArray(membersGrouped.subOwners)) {
      membersGrouped.subOwners.forEach((member: any) => {
        const userId = member.userId || member.user?.id;
        if (userId) allowedUserIds.add(userId);
      });
    }

    // Return filtered users
    return users.filter((u) => allowedUserIds.has(u.id));
  };

  const availableReceivers = filterAvailableReceivers();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {report ? "Edit Daily Report" : "Create Daily Report"}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Project */}
          {!report && (
            <TextField
              fullWidth
              select
              label="Project"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              disabled={projectsLoading || projects.length === 0}
            >
              <MenuItem value="">
                {projectsLoading ? "Loading projects..." : "Select a project..."}
              </MenuItem>
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </TextField>
          )}

          {/* Day Number */}
          <TextField
            fullWidth
            label="Day Number"
            type="number"
            value={formData.dayNumber}
            onChange={(e) => handleInputChange("dayNumber", parseInt(e.target.value))}
            inputProps={{ min: 1 }}
          />

          {/* Date */}
          <TextField
            fullWidth
            label="Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formData.date}
            onChange={(e) => handleInputChange("date", e.target.value)}
          />

          {/* Location */}
          <TextField
            fullWidth
            label="Location"
            placeholder="e.g., Site A, Building 2"
            value={formData.location}
            onChange={(e) => handleInputChange("location", e.target.value)}
          />

          {/* Remarks */}
          <TextField
            fullWidth
            label="Remarks"
            placeholder="Describe the day's accomplishments"
            multiline
            rows={4}
            value={formData.remarks}
            onChange={(e) => handleInputChange("remarks", e.target.value)}
          />

          {/* Attachments */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Attachments (Optional)
            </Typography>
            <TextField
              fullWidth
              type="file"
              inputProps={{ 
                accept: ".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.png",
                multiple: true 
              }}
              onChange={(e: any) => {
                const files = Array.from(e.target.files || []).map((file: any) => file.name);
                handleInputChange("attachments", files);
              }}
              sx={{
                "& .MuiInputBase-input": {
                  cursor: "pointer",
                },
              }}
            />
            {formData.attachments.length > 0 && (
              <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
                {formData.attachments.map((file, idx) => (
                  <Chip
                    key={idx}
                    label={file}
                    onDelete={() =>
                      handleInputChange(
                        "attachments",
                        formData.attachments.filter((_, i) => i !== idx)
                      )
                    }
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: "#4B2E83",
                      color: "#4B2E83",
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* Receivers */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Share With (Recipients)
            </Typography>
            {!selectedProject && (
              <Typography variant="caption" sx={{ color: "#F59E0B", display: "block", mb: 1 }}>
                ⚠ Please select a project first to see available recipients
              </Typography>
            )}
            <Autocomplete
              multiple
              loading={usersLoading}
              options={availableReceivers}
              getOptionLabel={(user) => `${user.name} (${user.email})`}
              value={selectedReceivers}
              onChange={(e, newValue) => handleReceiverChange(newValue)}
              disabled={!selectedProject}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select recipients (Project Owner/Sub-Owners)"
                  placeholder="Search users..."
                />
              )}
              renderTags={(value, getTagProps) => {
                const { key, ...tagProps } = getTagProps({ index: 0 });
                return value.map((option, index) => {
                  const { key: itemKey, ...itemProps } = getTagProps({ index });
                  return (
                    <Chip
                      key={itemKey}
                      variant="outlined"
                      label={option.name}
                      {...itemProps}
                      sx={{
                        borderColor: "#4B2E83",
                        color: "#4B2E83",
                      }}
                    />
                  );
                });
              }}
            />
          </Box>

          {/* Info Text */}
          <Typography variant="caption" sx={{ color: "#999", mt: 1 }}>
            * All fields are required. Recipients will be notified of this report.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{
            backgroundColor: "#4B2E83",
            "&:hover": { backgroundColor: "#3d2363" },
          }}
        >
          {loading ? <CircularProgress size={24} /> : report ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
