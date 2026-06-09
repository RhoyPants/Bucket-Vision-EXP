"use client";

import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Typography,
  Chip,
  Checkbox,
  FormControlLabel,
  Alert,
} from "@mui/material";
import type { ReactNode } from "react";
import { formatBudget } from "@/app/utils/formatters";
import { hasFieldError, getFieldError } from "@/app/utils/projectValidation";

interface CreateProjectProps {
  form: any;
  setForm: (form: any) => void;
  workSchedule: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
    includeGlobalHolidays: boolean;
  };
  setWorkSchedule: (ws: any) => void;
  errors: any[];
  touched: Record<string, boolean>;
  onFieldBlur: (field: string) => void;
  regions: any[];
  provinces: any[];
  cities: any[];
  barangays: any[];
  businessUnits: any[];
  entities: any[];
  attachmentsSection?: ReactNode;
}

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

export default function CreateProject({
  form,
  setForm,
  workSchedule,
  setWorkSchedule,
  errors,
  touched,
  onFieldBlur,
  regions,
  provinces,
  cities,
  barangays,
  businessUnits,
  entities,
  attachmentsSection,
}: CreateProjectProps) {
  return (
    <Box>
      {/* PROJECT DETAILS */}
      <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
        Project Details
      </Typography>

      <Grid container spacing={3}>
        {/* LEFT COLUMN */}
        <Grid size={{ xs: 12, lg: 6 }}>
          {/* PROJECT NAME */}
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>Project Name</Typography>
              <Chip label="*" size="small" variant="outlined" sx={{ height: 20 }} />
            </Box>
            <TextField
              fullWidth
              placeholder="Enter project name (e.g., Website Redesign)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onBlur={() => onFieldBlur("name")}
              error={touched.name && hasFieldError("name", errors)}
              helperText={touched.name && getFieldError("name", errors)}
              variant="outlined"
              size="small"
              inputProps={{ maxLength: 100 }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
            />
          </Box>

          {/* PROJECT CODE (PIN) */}
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>Project Code (PIN)</Typography>
              <Chip label="*" size="small" variant="outlined" sx={{ height: 20 }} />
            </Box>
            <TextField
              fullWidth
              placeholder="e.g., PRJ-001, WR-2024"
              value={form.pin}
              onChange={(e) => setForm({ ...form, pin: e.target.value.toUpperCase() })}
              onBlur={() => onFieldBlur("pin")}
              error={touched.pin && hasFieldError("pin", errors)}
              helperText={touched.pin && getFieldError("pin", errors)}
              variant="outlined"
              size="small"
              inputProps={{ maxLength: 20 }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5, fontFamily: "monospace" } }}
            />
          </Box>

          {/* PRIORITY */}
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>Priority Level</Typography>
              <Chip label="*" size="small" variant="outlined" sx={{ height: 20 }} />
            </Box>
            <TextField
              select
              fullWidth
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              onBlur={() => onFieldBlur("priority")}
              error={touched.priority && hasFieldError("priority", errors)}
              helperText={touched.priority && getFieldError("priority", errors)}
              variant="outlined"
              size="small"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
            >
              <MenuItem value="High">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#ef4444" }} /> High
                </Box>
              </MenuItem>
              <MenuItem value="Medium">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#f59e0b" }} /> Medium
                </Box>
              </MenuItem>
              <MenuItem value="Low">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#10b981" }} /> Low
                </Box>
              </MenuItem>
            </TextField>
          </Box>

          {/* BUSINESS UNIT */}
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>Business Unit</Typography>
              <Chip label="*" size="small" variant="outlined" sx={{ height: 20 }} />
            </Box>
            <TextField
              select
              fullWidth
              value={form.businessUnit}
              onChange={(e) => {
                const selected = businessUnits.find((bu) => bu.id === e.target.value);
                setForm({
                  ...form,
                  businessUnit: selected?.id,
                  businessUnitCode: selected?.code,
                  businessUnitName: selected?.name,
                });
              }}
              onBlur={() => onFieldBlur("businessUnit")}
              error={touched.businessUnit && hasFieldError("businessUnit", errors)}
              helperText={touched.businessUnit && getFieldError("businessUnit", errors)}
              variant="outlined"
              size="small"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
            >
              <MenuItem value="">---Select Business Unit---</MenuItem>
              {businessUnits.map((bu) => (
                <MenuItem key={bu.id} value={bu.id}>
                  {bu.name} ({bu.code})
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* ENTITY */}
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>Entity</Typography>
              <Chip label="*" size="small" variant="outlined" sx={{ height: 20 }} />
            </Box>
            <TextField
              select
              fullWidth
              value={form.entity}
              onChange={(e) => setForm({ ...form, entity: e.target.value })}
              onBlur={() => onFieldBlur("entity")}
              error={touched.entity && hasFieldError("entity", errors)}
              helperText={touched.entity && getFieldError("entity", errors)}
              variant="outlined"
              size="small"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
            >
              <MenuItem value="">---Select Entity---</MenuItem>
              {entities.map((e) => (
                <MenuItem key={e} value={e}>
                  {e}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* TOTAL BUDGET */}
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>Total Budget</Typography>
              <Chip label="*" size="small" variant="outlined" sx={{ height: 20 }} />
            </Box>
            <TextField
              fullWidth
              type="text"
              placeholder="0"
              value={form.totalBudget ? formatBudget(form.totalBudget) : ""}
              onChange={(e) => {
                const cleanValue = Math.max(0, Number(e.target.value.replace(/,/g, "")) || 0);
                setForm({ ...form, totalBudget: cleanValue });
              }}
              onBlur={() => onFieldBlur("totalBudget")}
              error={touched.totalBudget && hasFieldError("totalBudget", errors)}
              helperText={touched.totalBudget && getFieldError("totalBudget", errors)}
              variant="outlined"
              size="small"
              InputProps={{ startAdornment: "₱ " }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
            />
          </Box>
        </Grid>

        {/* RIGHT COLUMN */}
        <Grid size={{ xs: 12, lg: 6 }}>
          {/* LOCATION */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
              Project Location
              <Chip label="*" size="small" variant="outlined" sx={{ height: 20 }} />
            </Typography>

            {/* REGION */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 500, mb: 0.5, display: "block" }}>Region</Typography>
              <TextField
                select
                fullWidth
                value={form.location.regionCode}
                onChange={(e) => {
                  const selected = regions.find((r) => r.regCode === e.target.value);
                  setForm({
                    ...form,
                    location: {
                      ...form.location,
                      regionCode: selected?.regCode || "",
                      regionName: selected?.regName || "",
                      provinceCode: "",
                      provinceName: "",
                      cityCode: "",
                      cityName: "",
                      barangayCode: "",
                      barangayName: "",
                    },
                  });
                }}
                onBlur={() => onFieldBlur("location.region")}
                error={touched["location.region"] && hasFieldError("location.region", errors)}
                helperText={touched["location.region"] && getFieldError("location.region", errors)}
                variant="outlined"
                size="small"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
              >
                <MenuItem value="">---Select Region---</MenuItem>
                {regions.map((r) => (
                  <MenuItem key={r.regCode} value={r.regCode}>{r.regName}</MenuItem>
                ))}
              </TextField>
            </Box>

            {/* PROVINCE */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 500, mb: 0.5, display: "block" }}>Province</Typography>
              <TextField
                select
                fullWidth
                disabled={!form.location.regionCode}
                value={form.location.provinceCode}
                onChange={(e) => {
                  const selected = provinces.find((p) => p.provCode === e.target.value);
                  setForm({
                    ...form,
                    location: {
                      ...form.location,
                      provinceCode: selected?.provCode || "",
                      provinceName: selected?.provName || "",
                      cityCode: "",
                      cityName: "",
                      barangayCode: "",
                      barangayName: "",
                    },
                  });
                }}
                onBlur={() => onFieldBlur("location.province")}
                error={touched["location.province"] && hasFieldError("location.province", errors)}
                helperText={touched["location.province"] && getFieldError("location.province", errors)}
                variant="outlined"
                size="small"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
              >
                <MenuItem value="">---Select Province---</MenuItem>
                {provinces.map((p) => (
                  <MenuItem key={p.provCode} value={p.provCode}>{p.provName}</MenuItem>
                ))}
              </TextField>
            </Box>

            {/* CITY */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 500, mb: 0.5, display: "block" }}>City / Municipality</Typography>
              <TextField
                select
                fullWidth
                disabled={!form.location.provinceCode}
                value={form.location.cityCode}
                onChange={(e) => {
                  const selected = cities.find((c) => c.cityCode === e.target.value);
                  setForm({
                    ...form,
                    location: {
                      ...form.location,
                      cityCode: selected?.cityCode || "",
                      cityName: selected?.cityName || "",
                      barangayCode: "",
                      barangayName: "",
                    },
                  });
                }}
                onBlur={() => onFieldBlur("location.city")}
                error={touched["location.city"] && hasFieldError("location.city", errors)}
                helperText={touched["location.city"] && getFieldError("location.city", errors)}
                variant="outlined"
                size="small"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
              >
                <MenuItem value="">---Select City---</MenuItem>
                {cities.map((c) => (
                  <MenuItem key={c.cityCode} value={c.cityCode}>{c.cityName}</MenuItem>
                ))}
              </TextField>
            </Box>

            {/* BARANGAY */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 500, mb: 0.5, display: "block" }}>Barangay</Typography>
              <TextField
                select
                fullWidth
                disabled={!form.location.cityCode}
                value={form.location.barangayCode}
                onChange={(e) => {
                  const selected = barangays.find((b) => b.brgyCode === e.target.value);
                  setForm({
                    ...form,
                    location: {
                      ...form.location,
                      barangayCode: selected?.brgyCode || "",
                      barangayName: selected?.brgyName || "",
                    },
                  });
                }}
                onBlur={() => onFieldBlur("location.barangay")}
                error={touched["location.barangay"] && hasFieldError("location.barangay", errors)}
                helperText={touched["location.barangay"] && getFieldError("location.barangay", errors)}
                variant="outlined"
                size="small"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
              >
                <MenuItem value="">---Select Barangay---</MenuItem>
                {barangays.map((b) => (
                  <MenuItem key={b.brgyCode} value={b.brgyCode}>{b.brgyName}</MenuItem>
                ))}
              </TextField>
            </Box>

            {/* STREET */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 500, mb: 0.5, display: "block" }}>Street Address</Typography>
              <TextField
                fullWidth
                placeholder="House number, street name, etc."
                value={form.location.street}
                onChange={(e) => setForm({ ...form, location: { ...form.location, street: e.target.value } })}
                variant="outlined"
                size="small"
                inputProps={{ maxLength: 200 }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
              />
            </Box>
          </Box>

          {/* TIMELINE */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
              Timeline
              <Chip label="*" size="small" variant="outlined" sx={{ height: 20 }} />
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 500, mb: 0.5, display: "block" }}>Start Date</Typography>
              <TextField
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                onBlur={() => onFieldBlur("startDate")}
                error={touched.startDate && hasFieldError("startDate", errors)}
                helperText={touched.startDate && getFieldError("startDate", errors)}
                variant="outlined"
                size="small"
                inputProps={{ min: new Date().toISOString().split("T")[0] }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 500, mb: 0.5, display: "block" }}>End Date</Typography>
              <TextField
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.expectedEndDate}
                onChange={(e) => setForm({ ...form, expectedEndDate: e.target.value })}
                onBlur={() => onFieldBlur("expectedEndDate")}
                error={touched.expectedEndDate && hasFieldError("expectedEndDate", errors)}
                helperText={touched.expectedEndDate && getFieldError("expectedEndDate", errors)}
                variant="outlined"
                size="small"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
              />
            </Box>
          </Box>
        </Grid>

        {/* DESCRIPTION - FULL WIDTH */}
        <Grid size={{ xs: 12 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>Description</Typography>
              <Chip label="Optional" size="small" variant="filled" sx={{ height: 20, fontSize: "0.7rem" }} />
            </Box>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Describe the project's objectives, scope, and deliverables..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              variant="outlined"
              size="small"
              inputProps={{ maxLength: 1000 }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
            />
          </Box>
        </Grid>
      </Grid>

      {attachmentsSection && <Box sx={{ mt: 4 }}>{attachmentsSection}</Box>}

      {/* WORK SCHEDULE */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
          Work Schedule
        </Typography>
        <Typography sx={{ fontSize: 13, color: "#666", mb: 3 }}>
          Configure your project's working days. This determines how project duration is calculated.
        </Typography>

        {/* DAY CHECKBOXES */}
        <Box sx={{ mb: 3, p: 2, backgroundColor: "#f8faff", borderRadius: 1.5, border: "1px solid #e0e7ff" }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: "#4f46e5" }}>
            Working Days
          </Typography>
          <Grid container spacing={1}>
            {DAYS.map((day) => (
              <Grid size={{ xs: 6, sm: 4, md: 3 }} key={day.key}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={workSchedule[day.key as keyof typeof workSchedule] as boolean}
                      onChange={(e) => setWorkSchedule({ ...workSchedule, [day.key]: e.target.checked })}
                    />
                  }
                  label={day.label}
                />
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* GLOBAL HOLIDAYS TOGGLE */}
        <Box sx={{ p: 2, backgroundColor: "#fef3c7", borderRadius: 1.5, border: "1px solid #fcd34d" }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={workSchedule.includeGlobalHolidays}
                onChange={(e) => setWorkSchedule({ ...workSchedule, includeGlobalHolidays: e.target.checked })}
              />
            }
            label={
              <Box>
                <Typography fontWeight={600}>Include Global Holidays</Typography>
                <Typography sx={{ fontSize: "0.85rem", color: "#78350f" }}>
                  Excludes globally configured holidays from project duration calculations
                </Typography>
              </Box>
            }
          />
        </Box>
      </Box>
    </Box>
  );
}
