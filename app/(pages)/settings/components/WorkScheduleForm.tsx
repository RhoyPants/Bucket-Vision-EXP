"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Typography,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
} from "@mui/material";
import { Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/app/redux/store";
import {
  getScheduleById,
  createSchedule,
  updateSchedule,
  addHoliday,
  removeHoliday,
} from "@/app/redux/controllers/workScheduleController";

interface WorkScheduleFormProps {
  scheduleId?: string | null;
  onClose: () => void;
}

const DAYS_OF_WEEK = [
  { key: "monday", label: "Monday", short: "M" },
  { key: "tuesday", label: "Tuesday", short: "T" },
  { key: "wednesday", label: "Wednesday", short: "W" },
  { key: "thursday", label: "Thursday", short: "T" },
  { key: "friday", label: "Friday", short: "F" },
  { key: "saturday", label: "Saturday", short: "S" },
  { key: "sunday", label: "Sunday", short: "S" },
];

export default function WorkScheduleForm({ scheduleId, onClose }: WorkScheduleFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { selectedSchedule, loading } = useSelector(
    (state: RootState) => state.workSchedule
  );

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
    includeHolidays: true,
    isDefault: false,
  });

  const [holidays, setHolidays] = useState<Array<{ id: string; date: string; name: string }>>([]);
  const [newHoliday, setNewHoliday] = useState({ date: "", name: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (scheduleId) {
      dispatch(getScheduleById(scheduleId));
    }
  }, [scheduleId, dispatch]);

  useEffect(() => {
    if (selectedSchedule) {
      setFormData({
        name: selectedSchedule.name,
        description: selectedSchedule.description || "",
        monday: selectedSchedule.monday,
        tuesday: selectedSchedule.tuesday,
        wednesday: selectedSchedule.wednesday,
        thursday: selectedSchedule.thursday,
        friday: selectedSchedule.friday,
        saturday: selectedSchedule.saturday,
        sunday: selectedSchedule.sunday,
        includeHolidays: selectedSchedule.includeHolidays,
        isDefault: selectedSchedule.isDefault,
      });
      setHolidays(selectedSchedule.holidays || []);
    }
  }, [selectedSchedule]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Schedule name is required";
    }

    const hasDay =
      formData.monday ||
      formData.tuesday ||
      formData.wednesday ||
      formData.thursday ||
      formData.friday ||
      formData.saturday ||
      formData.sunday;

    if (!hasDay) {
      newErrors.days = "At least one day must be selected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddHoliday = async () => {
    if (!newHoliday.date || !newHoliday.name) {
      setSubmitError("Please enter both date and holiday name");
      return;
    }

    if (scheduleId) {
      try {
        setSaving(true);
        await dispatch(addHoliday(scheduleId, newHoliday) as any);
        setNewHoliday({ date: "", name: "" });
      } catch (err: any) {
        setSubmitError(err?.message || "Failed to add holiday");
      } finally {
        setSaving(false);
      }
    }
  };

  const handleRemoveHoliday = async (holidayId: string) => {
    if (scheduleId) {
      try {
        setSaving(true);
        await dispatch(removeHoliday(holidayId, scheduleId) as any);
      } catch (err: any) {
        setSubmitError(err?.message || "Failed to remove holiday");
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setSubmitError(null);

      if (scheduleId && selectedSchedule) {
        await dispatch(updateSchedule(scheduleId, formData) as any);
      } else {
        await dispatch(createSchedule(formData) as any);
      }

      onClose();
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to save schedule");
    } finally {
      setSaving(false);
    }
  };

  const isLoading = loading && scheduleId;
  const isDisabled = saving || !!isLoading;

  return (
    <Dialog open maxWidth="sm" fullWidth>
      <DialogTitle>
        {scheduleId ? "Edit Work Schedule" : "Create New Work Schedule"}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3}>
            {submitError && <Alert severity="error">{submitError}</Alert>}

            {/* Name and Description */}
            <TextField
              fullWidth
              label="Schedule Name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: "" });
              }}
              error={!!errors.name}
              helperText={errors.name}
              placeholder="e.g., Weekdays Only"
              disabled={isDisabled}
            />

            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
              placeholder="Optional: Describe the working pattern"
              disabled={isDisabled}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isDefault}
                  onChange={(e) =>
                    setFormData({ ...formData, isDefault: e.target.checked })
                  }
                  disabled={isDisabled}
                />
              }
              label="Set as default work schedule"
            />

            <Divider />

            {/* Days of Week Selection */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Working Days (M T W T F S S)
              </Typography>

              {errors.days && <Alert severity="error" sx={{ mb: 2 }}>{errors.days}</Alert>}

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
                {DAYS_OF_WEEK.map((day) => (
                  <FormControlLabel
                    key={day.key}
                    control={
                      <Checkbox
                        checked={formData[day.key as keyof typeof formData] as boolean}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [day.key]: e.target.checked,
                          })
                        }
                        disabled={isDisabled}
                        size="small"
                      />
                    }
                    label={day.short}
                    sx={{
                      m: 0,
                      "& .MuiFormControlLabel-label": {
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Divider />

            {/* Holiday Inclusion */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.includeHolidays}
                  onChange={(e) =>
                    setFormData({ ...formData, includeHolidays: e.target.checked })
                  }
                  disabled={isDisabled}
                />
              }
              label="Include holidays in schedule calculation"
            />

            {/* Holidays Management */}
            {formData.includeHolidays && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  📅 Holidays
                </Typography>

                {/* Add Holiday Form */}
                <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                  <TextField
                    type="date"
                    value={newHoliday.date}
                    onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                    disabled={isDisabled}
                    size="small"
                    sx={{ flex: 1 }}
                    inputProps={{ style: { fontSize: "0.875rem" } }}
                  />
                  <TextField
                    placeholder="Holiday name"
                    value={newHoliday.name}
                    onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                    disabled={isDisabled}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <IconButton
                    size="small"
                    onClick={handleAddHoliday}
                    disabled={isDisabled || !newHoliday.date || !newHoliday.name}
                    sx={{ color: "#10b981" }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* Holidays List */}
                {holidays.length > 0 ? (
                  <Table size="small" sx={{ mb: 2 }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f3f4f6" }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                          Date
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                          Name
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                          Action
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {holidays.map((holiday) => (
                        <TableRow key={holiday.id}>
                          <TableCell sx={{ fontSize: "0.875rem" }}>
                            {new Date(holiday.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.875rem" }}>
                            {holiday.name}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveHoliday(holiday.id)}
                              disabled={isDisabled}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Typography variant="caption" color="#9ca3af">
                    No holidays added yet
                  </Typography>
                )}
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isDisabled}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isDisabled}
        >
          {saving ? <CircularProgress size={24} /> : "Save Schedule"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
