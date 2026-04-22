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
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAppDispatch } from "@/app/redux/hook";
import {
  createProject,
  updateProject,
  getProjectById,
} from "@/app/redux/controllers/projectController";

export default function ProjectModal({
  open,
  onClose,
  mode = "create",
  project,
}: any) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  // ========================================
  // STATE
  // ========================================
  const [saving, setSaving] = useState(false);

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

  // ========================================
  // LOAD PROJECT
  // ========================================
  useEffect(() => {
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

  // ========================================
  // FETCH LOCATION DATA
  // ========================================
  useEffect(() => {
    fetch("https://psgc.gitlab.io/api/provinces/")
      .then((res) => res.json())
      .then(setProvinces)
      .catch(console.error);
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
      })
      .catch(console.error);
  }, [form.location.provinceCode]);

  useEffect(() => {
    if (!form.location.cityCode) return;

    fetch(
      `https://psgc.gitlab.io/api/cities/${form.location.cityCode}/barangays/`
    )
      .then((res) => res.json())
      .then(setBarangays)
      .catch(console.error);
  }, [form.location.cityCode]);

  // ========================================
  // SUBMIT
  // ========================================
  const handleSubmit = async () => {
    if (!form.name) return alert("Project name is required");
    if (!form.startDate) return alert("Start date is required");
    if (!form.expectedEndDate) return alert("End date is required");

    try {
      setSaving(true);

      if (mode === "edit") {
        await dispatch(updateProject(project.id, form));
      } else {
        await dispatch(createProject(form));
      }

      onClose();
    } catch (err) {
      console.error("❌ Save failed", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      onClose={(e, reason) => {
        if (reason === "backdropClick") return;
        onClose();
      }}
    >
      {/* HEADER */}
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        {mode === "edit" ? "Edit Project" : "New Project"}

        {project?.id && (
          <IconButton
            onClick={() =>
              router.push(`/sprintManagement?projectId=${project.id}`)
            }
          >
            <InfoOutlinedIcon />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* LEFT */}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Project Name"
              fullWidth
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />

            <TextField
              label="Project Code (PIN)"
              fullWidth
              sx={{ mt: 2 }}
              value={form.pin}
              onChange={(e) =>
                setForm({ ...form, pin: e.target.value })
              }
            />

            <TextField
              select
              label="Priority"
              fullWidth
              sx={{ mt: 2 }}
              value={form.priority}
              onChange={(e) =>
                setForm({ ...form, priority: e.target.value })
              }
            >
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
            </TextField>

            <TextField
              label="Business Unit"
              fullWidth
              sx={{ mt: 2 }}
              value={form.businessUnit}
              onChange={(e) =>
                setForm({ ...form, businessUnit: e.target.value })
              }
            />

            <TextField
              label="Entity"
              fullWidth
              sx={{ mt: 2 }}
              value={form.entity}
              onChange={(e) =>
                setForm({ ...form, entity: e.target.value })
              }
            />

            <TextField
              label="Total Budget"
              type="number"
              fullWidth
              sx={{ mt: 2 }}
              value={form.totalBudget}
              onChange={(e) =>
                setForm({
                  ...form,
                  totalBudget: Math.max(0, Number(e.target.value)),
                })
              }
            />
          </Grid>

          {/* RIGHT */}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />

            {/* LOCATION */}
            <Box mt={2}>
              <TextField
                select
                label="Province"
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
              >
                {provinces.map((p) => (
                  <MenuItem key={p.code} value={p.code}>
                    {p.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="City"
                fullWidth
                sx={{ mt: 2 }}
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
              >
                {cities.map((c) => (
                  <MenuItem key={c.code} value={c.code}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Barangay"
                fullWidth
                sx={{ mt: 2 }}
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
              >
                {barangays.map((b) => (
                  <MenuItem key={b.code} value={b.code}>
                    {b.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Street"
                fullWidth
                sx={{ mt: 2 }}
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
              />
            </Box>

            {/* DATES */}
            <TextField
              label="Expected Start Date"
              type="date"
              fullWidth
              sx={{ mt: 2 }}
              InputLabelProps={{ shrink: true }}
              value={form.startDate}
              onChange={(e) =>
                setForm({ ...form, startDate: e.target.value })
              }
            />

            <TextField
              label="Expected End Date"
              type="date"
              fullWidth
              sx={{ mt: 2 }}
              InputLabelProps={{ shrink: true }}
              value={form.expectedEndDate}
              onChange={(e) =>
                setForm({
                  ...form,
                  expectedEndDate: e.target.value,
                })
              }
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving..." : mode === "edit" ? "Update" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}