"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Grid,
  IconButton,
  Box,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  FormHelperText,
  Typography,
  Chip,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { useAppDispatch } from "@/app/redux/hook";
import {
  createProject,
  updateProject,
  getProjectById,
} from "@/app/redux/controllers/projectController";
import {
  validateProjectForm,
  getFieldError,
  hasFieldError,
  ProjectFormData,
  ValidationError,
} from "@/app/utils/projectValidation";
import { formatBudget } from "@/app/utils/formatters";
import ProjectTeamPanel from "@/app/(pages)/projects/[id]/setup/components/ProjectTeamPanel";

export default function ProjectModal({
  open,
  onClose,
  mode = "create",
  project,
}: any) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState(0);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [form, setForm] = useState<any>({
    name: "",
    description: "",
    location: {
      provinceCode: "",
      provinceName: "",
      cityCode: "",
      cityName: "",
      barangayCode: "",
      barangayName: "",
      street: "",
    },
    businessUnit: "",
    entity: "",
    startDate: "",
    expectedEndDate: "",
    pin: "",
    priority: "Medium",
    totalBudget: 0,
  });

  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [barangays, setBarangays] = useState<any[]>([]);

  const validationStatus = useMemo(() => validateProjectForm(form), [form]);

  useEffect(() => {
    setErrors([]);
    setTouched({});

    if (mode === "edit" && project?.id) {
      dispatch(getProjectById(project.id)).then((data: any) => {
        setForm({
          ...form,
          ...data,
          location: data.location || form.location,
          startDate: data.startDate?.slice(0, 10) || "",
          expectedEndDate: data.expectedEndDate?.slice(0, 10) || "",
        });
      });
    }

    if (mode === "create") {
      setForm({
        name: "",
        description: "",
        location: {
          provinceCode: "",
          provinceName: "",
          cityCode: "",
          cityName: "",
          barangayCode: "",
          barangayName: "",
          street: "",
        },
        businessUnit: "",
        entity: "",
        startDate: "",
        expectedEndDate: "",
        pin: "",
        priority: "Medium",
        totalBudget: 0,
      });
    }
  }, [open, project, mode]);

  useEffect(() => {
    fetch("https://psgc.gitlab.io/api/provinces/")
      .then((res) => res.json())
      .then(setProvinces);
  }, []);

  useEffect(() => {
    if (!form.location.provinceCode) return;
    fetch(
      `https://psgc.gitlab.io/api/provinces/${form.location.provinceCode}/cities/`
    )
      .then((res) => res.json())
      .then((data) => {
        setCities(data);
        setBarangays([]);
      });
  }, [form.location.provinceCode]);

  useEffect(() => {
    if (!form.location.cityCode) return;
    fetch(
      `https://psgc.gitlab.io/api/cities/${form.location.cityCode}/barangays/`
    )
      .then((res) => res.json())
      .then(setBarangays);
  }, [form.location.cityCode]);

  const handleSubmit = async () => {
    const validation = validateProjectForm(form);

    if (!validation.isValid) {
      setErrors(validation.errors);
      const allTouched: Record<string, boolean> = {};
      validation.errors.forEach((err) => {
        allTouched[err.field] = true;
      });
      setTouched(allTouched);
      return;
    }

    try {
      setSaving(true);
      setErrors([]);

      if (mode === "edit") {
        await dispatch(updateProject(project.id, form));
      } else {
        await dispatch(createProject(form));
      }

      onClose();
    } catch (err: any) {
      setErrors([
        {
          field: "submit",
          message: err?.message || "Failed to save project.",
        },
      ]);
    } finally {
      setSaving(false);
    }
  };

  const handleFieldBlur = (fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  };

  return (
    <Dialog
      open={open}
      maxWidth="lg"
      fullWidth
      onClose={(e, reason) => {
        if (reason === "backdropClick") return;
        onClose();
      }}
    >
      {/* HEADER */}
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e5e7eb",
          fontWeight: 700,
          fontSize: "1.25rem",
          py: 2.5,
          px: 3,
        }}
      >
        <Box>
          {mode === "edit" ? "Edit Project" : "New Project"}
        </Box>

        {project?.id && (
          <IconButton
            onClick={() =>
              router.push(`/sprintManagement?projectId=${project.id}`)
            }
            size="small"
          >
            <InfoOutlinedIcon />
          </IconButton>
        )}
      </DialogTitle>

      {mode === "edit" && (
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          sx={{
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <Tab label="Project Details" />
          <Tab label="Team Members" />
        </Tabs>
      )}

      <DialogContent
        dividers
        sx={{
          maxHeight: "calc(100vh - 300px)",
          overflowY: "auto",
          p: 3,
        }}
      >
        {/* ERROR SUMMARY */}
        {errors.length > 0 && errors.some((e) => e.field === "submit") && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: 1 }}
            icon={<ErrorIcon />}
          >
            <Typography fontWeight={600}>
              {errors.find((e) => e.field === "submit")?.message}
            </Typography>
          </Alert>
        )}

        {tab === 0 && (
          <Box>
            {/* VALIDATION SUMMARY HEADER */}
            {errors.length > 0 && !errors.some((e) => e.field === "submit") && (
              <Alert
                severity="warning"
                sx={{
                  mb: 3,
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
                icon={<WarningIcon />}
              >
                <Box>
                  <Typography fontWeight={600} fontSize="0.95rem">
                    Please fix {errors.length} error{errors.length !== 1 ? "s" : ""} below
                  </Typography>
                  <Box sx={{ mt: 0.5, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 0.5 }}>
                    All fields marked with <Chip label="*" size="small" variant="outlined" sx={{ height: 20 }} /> are required
                  </Box>
                </Box>
              </Alert>
            )}

            {/* FORM GRID - 2 COLUMNS */}
            <Grid container spacing={3}>
              {/* LEFT COLUMN */}
              <Grid size={{ xs: 12, lg: 6 }}>
                {/* PROJECT NAME */}
                <Box sx={{ mb: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Project Name
                    </Typography>
                    <Chip label="*" size="small" variant="outlined" sx={{ height: 20 }} />
                  </Box>
                  <TextField
                    fullWidth
                    placeholder="Enter project name (e.g., Website Redesign)"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    onBlur={() => handleFieldBlur("name")}
                    error={touched.name && hasFieldError("name", errors)}
                    helperText={touched.name && getFieldError("name", errors)}
                    variant="outlined"
                    size="small"
                    inputProps={{ maxLength: 100 }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                        backgroundColor: "white",
                        transition: "all 0.2s",
                        "&:hover fieldset": {
                          borderColor: "rgba(0, 0, 0, 0.23)",
                        },
                        "&.Mui-focused": {
                          backgroundColor: "white",
                        },
                      },
                    }}
                  />
                </Box>

                {/* PROJECT CODE (PIN) */}
                <Box sx={{ mb: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Project Code (PIN)
                    </Typography>
                    <Chip label="*" size="small" variant="outlined" sx={{ height: 20 }} />
                  </Box>
                  <TextField
                    fullWidth
                    placeholder="e.g., PRJ-001, WR-2024"
                    value={form.pin}
                    onChange={(e) =>
                      setForm({ ...form, pin: e.target.value.toUpperCase() })
                    }
                    onBlur={() => handleFieldBlur("pin")}
                    error={touched.pin && hasFieldError("pin", errors)}
                    helperText={touched.pin && getFieldError("pin", errors)}
                    variant="outlined"
                    size="small"
                    inputProps={{ maxLength: 20 }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                        backgroundColor: "white",
                        fontFamily: "monospace",
                      },
                    }}
                  />
                </Box>

                {/* PRIORITY */}
                <Box sx={{ mb: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Priority Level
                    </Typography>
                    <Chip label="*" size="small" variant="outlined" sx={{ height: 20 }} />
                  </Box>
                  <TextField
                    select
                    fullWidth
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value })
                    }
                    onBlur={() => handleFieldBlur("priority")}
                    error={touched.priority && hasFieldError("priority", errors)}
                    helperText={touched.priority && getFieldError("priority", errors)}
                    variant="outlined"
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                        backgroundColor: "white",
                      },
                    }}
                  >
                    <MenuItem value="High">
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#ef4444" }} />
                        High
                      </Box>
                    </MenuItem>
                    <MenuItem value="Medium">
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#f59e0b" }} />
                        Medium
                      </Box>
                    </MenuItem>
                    <MenuItem value="Low">
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#10b981" }} />
                        Low
                      </Box>
                    </MenuItem>
                  </TextField>
                </Box>

                {/* BUSINESS UNIT */}
                <Box sx={{ mb: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Business Unit
                    </Typography>
                    <Chip label="*" size="small" variant="outlined" sx={{ height: 20 }} />
                  </Box>
                  <TextField
                    fullWidth
                    placeholder="e.g., Engineering, Marketing, Sales"
                    value={form.businessUnit}
                    onChange={(e) =>
                      setForm({ ...form, businessUnit: e.target.value })
                    }
                    onBlur={() => handleFieldBlur("businessUnit")}
                    error={touched.businessUnit && hasFieldError("businessUnit", errors)}
                    helperText={touched.businessUnit && getFieldError("businessUnit", errors)}
                    variant="outlined"
                    size="small"
                    inputProps={{ maxLength: 100 }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                        backgroundColor: "white",
                      },
                    }}
                  />
                </Box>

                {/* ENTITY */}
                <Box sx={{ mb: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Entity
                    </Typography>
                    <Chip label="*" size="small" variant="outlined" sx={{ height: 20 }} />
                  </Box>
                  <TextField
                    fullWidth
                    placeholder="e.g., Department, Team, Organization"
                    value={form.entity}
                    onChange={(e) =>
                      setForm({ ...form, entity: e.target.value })
                    }
                    onBlur={() => handleFieldBlur("entity")}
                    error={touched.entity && hasFieldError("entity", errors)}
                    helperText={touched.entity && getFieldError("entity", errors)}
                    variant="outlined"
                    size="small"
                    inputProps={{ maxLength: 100 }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                        backgroundColor: "white",
                      },
                    }}
                  />
                </Box>

                {/* TOTAL BUDGET */}
                <Box sx={{ mb: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Total Budget
                    </Typography>
                    <Chip label="*" size="small" variant="outlined" sx={{ height: 20 }} />
                  </Box>
                  <TextField
                    fullWidth
                    type="text"
                    placeholder="0"
                    value={form.totalBudget ? formatBudget(form.totalBudget) : ""}
                    onChange={(e) => {
                      // Remove commas and get numeric value
                      const numericValue = e.target.value.replace(/,/g, "");
                      const cleanValue = Math.max(0, Number(numericValue) || 0);
                      setForm({
                        ...form,
                        totalBudget: cleanValue,
                      });
                    }}
                    onBlur={() => handleFieldBlur("totalBudget")}
                    error={touched.totalBudget && hasFieldError("totalBudget", errors)}
                    helperText={touched.totalBudget && getFieldError("totalBudget", errors)}
                    variant="outlined"
                    size="small"
                    InputProps={{
                      startAdornment: "₱ ",
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                        backgroundColor: "white",
                      },
                    }}
                  />
                </Box>
              </Grid>

              {/* RIGHT COLUMN */}
              <Grid size={{ xs: 12, lg: 6 }}>
                {/* LOCATION SECTION */}
                <Box sx={{ mb: 2.5 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
                  >
                    Project Location
                    <Chip label="*" size="small" variant="outlined" sx={{ height: 20 }} />
                  </Typography>

                  {/* PROVINCE */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 500, mb: 0.5, display: "block" }}>
                      Province
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      value={form.location.provinceCode}
                      onChange={(e) => {
                        const selected = provinces.find(
                          (p) => p.code === e.target.value
                        );

                        setForm({
                          ...form,
                          location: {
                            ...form.location,
                            provinceCode: selected.code,
                            provinceName: selected.name,
                            cityCode: "",
                            cityName: "",
                            barangayCode: "",
                            barangayName: "",
                          },
                        });
                      }}
                      onBlur={() => handleFieldBlur("location.province")}
                      error={touched["location.province"] && hasFieldError("location.province", errors)}
                      helperText={touched["location.province"] && getFieldError("location.province", errors)}
                      variant="outlined"
                      size="small"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1.5,
                          backgroundColor: "white",
                        },
                      }}
                    >
                      <MenuItem value="">---Select Province---</MenuItem>
                      {provinces.map((p) => (
                        <MenuItem key={p.code} value={p.code}>
                          {p.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>

                  {/* CITY */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 500, mb: 0.5, display: "block" }}>
                      City / Municipality
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      disabled={!form.location.provinceCode}
                      value={form.location.cityCode}
                      onChange={(e) => {
                        const selected = cities.find(
                          (c) => c.code === e.target.value
                        );

                        setForm({
                          ...form,
                          location: {
                            ...form.location,
                            cityCode: selected.code,
                            cityName: selected.name,
                            barangayCode: "",
                            barangayName: "",
                          },
                        });
                      }}
                      onBlur={() => handleFieldBlur("location.city")}
                      error={touched["location.city"] && hasFieldError("location.city", errors)}
                      helperText={touched["location.city"] && getFieldError("location.city", errors)}
                      variant="outlined"
                      size="small"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1.5,
                          backgroundColor: "white",
                        },
                      }}
                    >
                      <MenuItem value="">---Select City---</MenuItem>
                      {cities.map((c) => (
                        <MenuItem key={c.code} value={c.code}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>

                  {/* BARANGAY */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 500, mb: 0.5, display: "block" }}>
                      Barangay
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      disabled={!form.location.cityCode}
                      value={form.location.barangayCode}
                      onChange={(e) => {
                        const selected = barangays.find(
                          (b) => b.code === e.target.value
                        );

                        setForm({
                          ...form,
                          location: {
                            ...form.location,
                            barangayCode: selected.code,
                            barangayName: selected.name,
                          },
                        });
                      }}
                      onBlur={() => handleFieldBlur("location.barangay")}
                      error={touched["location.barangay"] && hasFieldError("location.barangay", errors)}
                      helperText={touched["location.barangay"] && getFieldError("location.barangay", errors)}
                      variant="outlined"
                      size="small"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1.5,
                          backgroundColor: "white",
                        },
                      }}
                    >
                      <MenuItem value="">---Select Barangay---</MenuItem>
                      {barangays.map((b) => (
                        <MenuItem key={b.code} value={b.code}>
                          {b.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>

                  {/* STREET ADDRESS */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 500, mb: 0.5, display: "block" }}>
                      Street Address
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="House number, street name, etc."
                      value={form.location.street}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          location: {
                            ...form.location,
                            street: e.target.value,
                          },
                        })
                      }
                      variant="outlined"
                      size="small"
                      inputProps={{ maxLength: 200 }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1.5,
                          backgroundColor: "white",
                        },
                      }}
                    />
                  </Box>
                </Box>

                {/* DATES SECTION */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
                  >
                    Timeline
                    <Chip label="*" size="small" variant="outlined" sx={{ height: 20 }} />
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 500, mb: 0.5, display: "block" }}>
                      Start Date
                    </Typography>
                    <TextField
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={form.startDate}
                      onChange={(e) =>
                        setForm({ ...form, startDate: e.target.value })
                      }
                      onBlur={() => handleFieldBlur("startDate")}
                      error={touched.startDate && hasFieldError("startDate", errors)}
                      helperText={touched.startDate && getFieldError("startDate", errors)}
                      variant="outlined"
                      size="small"
                      inputProps={{
                        min: new Date().toISOString().split("T")[0],
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1.5,
                          backgroundColor: "white",
                        },
                      }}
                    />
                    {!touched.startDate && (
                      <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "#6b7280", fontSize: "0.75rem" }}>
                        ℹ️ Must be today or later
                      </Typography>
                    )}
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 500, mb: 0.5, display: "block" }}>
                      End Date
                    </Typography>
                    <TextField
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={form.expectedEndDate}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          expectedEndDate: e.target.value,
                        })
                      }
                      onBlur={() => handleFieldBlur("expectedEndDate")}
                      error={touched.expectedEndDate && hasFieldError("expectedEndDate", errors)}
                      helperText={touched.expectedEndDate && getFieldError("expectedEndDate", errors)}
                      variant="outlined"
                      size="small"
                      inputProps={{
                        min: form.startDate 
                          ? new Date(form.startDate + "T00:00:00")
                              .getTime() > 0 
                            ? new Date(new Date(form.startDate).getTime() + 86400000)
                                .toISOString()
                                .split("T")[0]
                            : new Date().toISOString().split("T")[0]
                          : new Date().toISOString().split("T")[0],
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1.5,
                          backgroundColor: "white",
                        },
                      }}
                    />
                    {!touched.expectedEndDate && form.startDate && (
                      <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "#6b7280", fontSize: "0.75rem" }}>
                        ℹ️ Must be after start date (cannot be the same day)
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>

              {/* FULL WIDTH DESCRIPTION - SPANNING BOTH COLUMNS */}
              <Grid size={{ xs: 12 }}>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Description
                    </Typography>
                    <Chip label="Optional" size="small" variant="filled" sx={{ height: 20, fontSize: "0.7rem" }} />
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    placeholder="Describe the project's objectives, scope, and deliverables..."
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    variant="outlined"
                    size="small"
                    inputProps={{ maxLength: 1000 }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                        backgroundColor: "white",
                      },
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {mode === "edit" && tab === 1 && (
          <Box>
            <ProjectTeamPanel projectId={project.id} />
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          gap: 1,
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            borderRadius: 1,
          }}
        >
          Cancel
        </Button>
        {tab === 0 && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            sx={{
              borderRadius: 1,
              textTransform: "none",
              fontWeight: 600,
              minWidth: 120,
            }}
          >
            {saving ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={20} sx={{ color: "white" }} />
                Saving...
              </Box>
            ) : mode === "edit" ? (
              "Update Project"
            ) : (
              "Create Project"
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}