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
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import {
  createWeeklyReport,
  updateWeeklyReport,
} from "@/app/redux/controllers/weeklyReportController";
import { getUsers } from "@/app/redux/controllers/userController";
import { WeeklyReport } from "@/app/redux/slices/weeklyReportSlice";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

interface WeeklyReportModalProps {
  open: boolean;
  onClose: () => void;
  report: WeeklyReport | null;
}

interface FormData {
  title: string;
  dateFrom: string;
  dateTo: string;
  remarks: string;
  attachments: string[];
  receiverIds: string[];
}

export default function WeeklyReportModal({
  open,
  onClose,
  report,
}: WeeklyReportModalProps) {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    dateFrom: "",
    dateTo: "",
    remarks: "",
    attachments: [],
    receiverIds: [],
  });

  const users = useAppSelector((state) => state.user.users);
  const usersLoading = useAppSelector((state) => state.user.loading);

  useEffect(() => {
    if (open && users.length === 0) {
      dispatch(getUsers() as any);
    }
  }, [open, dispatch, users.length]);

  useEffect(() => {
    if (report) {
      setFormData({
        title: report.title,
        dateFrom: report.dateFrom.split("T")[0],
        dateTo: report.dateTo.split("T")[0],
        remarks: report.remarks,
        attachments: report.attachments || [],
        receiverIds: report.receivers.map((r) => r.user.id),
      });
    } else {
      const today = new Date().toISOString().split("T")[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      setFormData({
        title: "",
        dateFrom: weekAgo,
        dateTo: today,
        remarks: "",
        attachments: [],
        receiverIds: [],
      });
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
    if (!formData.title.trim() || !formData.remarks.trim()) {
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
          updateWeeklyReport(report.id, {
            title: formData.title,
            dateFrom: formData.dateFrom,
            dateTo: formData.dateTo,
            remarks: formData.remarks,
            attachments: formData.attachments,
            receiverIds: formData.receiverIds,
          }) as any
        );
      } else {
        await dispatch(
          createWeeklyReport({
            title: formData.title,
            dateFrom: formData.dateFrom,
            dateTo: formData.dateTo,
            remarks: formData.remarks,
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {report ? "Edit Weekly Report" : "Create Weekly Report"}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Title */}
          <TextField
            fullWidth
            label="Title"
            placeholder="e.g., Week of January 15-19"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
          />

          {/* Date Range */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              fullWidth
              label="From Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.dateFrom}
              onChange={(e) => handleInputChange("dateFrom", e.target.value)}
            />
            <TextField
              fullWidth
              label="To Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.dateTo}
              onChange={(e) => handleInputChange("dateTo", e.target.value)}
            />
          </Box>

          {/* Remarks */}
          <TextField
            fullWidth
            label="Remarks"
            placeholder="Describe the week's accomplishments and progress"
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
            <Autocomplete
              multiple
              loading={usersLoading}
              options={users}
              getOptionLabel={(user) => `${user.name} (${user.email})`}
              value={selectedReceivers}
              onChange={(e, newValue) => handleReceiverChange(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select recipients"
                  placeholder="Search users..."
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index });
                  return (
                    <Chip
                      key={key}
                      variant="outlined"
                      label={option.name}
                      {...tagProps}
                      sx={{
                        borderColor: "#4B2E83",
                        color: "#4B2E83",
                      }}
                    />
                  );
                })
              }
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
