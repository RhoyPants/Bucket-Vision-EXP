"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  MenuItem,
  Alert,
} from "@mui/material";
import { getRoles } from "@/app/lib/role.api";
import { getBusinessUnitsDropdown } from "@/app/api-service/businessUnitService";

interface Prefill {
  email: string;
  fullName: string;
  oid: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  department?: string;
  officeLocation?: string;
  company?: string;
  businessUnitId?: string;
}

interface Role {
  id: string;
  name: string;
}

interface BusinessUnit {
  id: string;
  code: string;
  name: string;
  entity: string;
}

export default function SSORegisterPage() {
  const router = useRouter();
  const [prefill, setPrefill] = useState<Prefill | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    requestedRoleId: "",
    businessUnitId: "",
    position: "",
    remarks: "",
  });

  useEffect(() => {
    // Get prefill data from localStorage
    const prefillStr = localStorage.getItem("sso_prefill");
    let parsedPrefill: Prefill | null = null;
    if (prefillStr) {
      try {
        const parsed = JSON.parse(prefillStr) as Prefill;
        parsedPrefill = parsed;
        setPrefill(parsed);
        setFormData((prev) => ({
          ...prev,
          position: parsed?.position || prev.position,
          businessUnitId: parsed?.businessUnitId || prev.businessUnitId,
        }));
        console.log("=== SSO PREFILL DEBUG ===");
        console.log("Full Prefill Object:", parsed);
        console.log("First Name:", parsed?.firstName);
        console.log("Last Name:", parsed?.lastName);
        console.log("Company:", parsed?.company);
        console.log("Position:", parsed?.position);
        console.log("Business Unit ID:", parsed?.businessUnitId);
        console.log("Department (for BU mapping):", parsed?.department);
        console.log("========================");
      } catch (e) {
        console.error("Failed to parse prefill data:", e);
      }
    }

    // Fetch roles and business units from backend
    const fetchData = async () => {
      try {
        const [rolesData, buData] = await Promise.all([
          getRoles(),
          getBusinessUnitsDropdown(),
        ]);

        // Extract roles from response
        const rolesList = rolesData?.data || rolesData || [];
        setRoles(
          Array.isArray(rolesList)
            ? rolesList
            : Object.values(rolesList)
        );

        // Extract business units from response
        const buList = buData || [];
        const normalizedBu = Array.isArray(buList) ? buList : Object.values(buList);
        setBusinessUnits(normalizedBu);

        // If backend prefill sends department text, map it to business unit by id/code/name.
        if (parsedPrefill?.department && !parsedPrefill?.businessUnitId) {
          const dept = parsedPrefill.department.trim().toLowerCase();
          const matchedBu = normalizedBu.find((bu) => {
            const id = (bu.id || "").toLowerCase();
            const code = (bu.code || "").toLowerCase();
            const name = (bu.name || "").toLowerCase();
            return id === dept || code === dept || name === dept;
          });

          if (matchedBu?.id) {
            setFormData((prev) => ({
              ...prev,
              businessUnitId: prev.businessUnitId || matchedBu.id,
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch roles or business units:", err);
        setError("Failed to load form options. Please try again.");
      }
    };

    fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const { name, value } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const idToken = localStorage.getItem("sso_idToken");
      if (!idToken) {
        setError("Session expired. Please login again.");
        setLoading(false);
        return;
      }

      const baseURL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

      const response = await fetch(`${baseURL}/auth/sso/microsoft/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken,
          firstName: prefill?.firstName || "",
          lastName: prefill?.lastName || "",
          company: prefill?.company || "",
          ...formData,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || "Registration failed");
        setLoading(false);
        return;
      }

      // Store registration info and redirect
      if (data.data?.registration) {
        localStorage.setItem("sso_registration", JSON.stringify(data.data.registration));
      }

      // Redirect to pending approval page
      router.replace("/sso/pending");
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  if (!prefill) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography>Loading registration form...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at 10% 20%, #dbeafe 0%, transparent 35%), radial-gradient(circle at 90% 80%, #e0f2fe 0%, transparent 40%), linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 640,
          p: 4,
          borderRadius: "16px",
          border: "1px solid #e5e7eb",
        }}
      >
        <Typography sx={{ fontSize: 28, fontWeight: 700, color: "#111827", mb: 1 }}>
          Complete Your Registration
        </Typography>
        <Typography sx={{ color: "#6b7280", mb: 3 }}>
          Please provide the following information to complete your registration.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            value={prefill.email}
            disabled
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Full Name"
            value={prefill.fullName}
            disabled
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="First Name"
              value={prefill.firstName || ""}
              disabled
            />
            <TextField
              fullWidth
              label="Last Name"
              value={prefill.lastName || ""}
              disabled
            />
          </Box>

          <TextField
            fullWidth
            label="Company"
            value={prefill.company || ""}
            disabled
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            select
            label="Business Unit"
            name="businessUnitId"
            value={formData.businessUnitId}
            onChange={handleChange}
            disabled
            sx={{ mb: 2 }}
          >
            <MenuItem value="">-- Select Business Unit --</MenuItem>
            {businessUnits.map((bu) => (
              <MenuItem key={bu.id} value={bu.id}>
                {bu.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Position"
            name="position"
            value={formData.position}
            onChange={handleChange}
            placeholder="e.g., Project Coordinator"
            disabled
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            select
            label="Requested Role"
            name="requestedRoleId"
            value={formData.requestedRoleId}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          >
            <MenuItem value="">-- Select Role --</MenuItem>
            {roles.map((role) => (
              <MenuItem key={role.id} value={role.id}>
                {role.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Remarks"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            placeholder="Additional remarks or reasons for access request"
            sx={{ mb: 3 }}
          />

          <Button
            fullWidth
            variant="contained"
            type="submit"
            disabled={loading}
            sx={{ mb: 2 }}
          >
            {loading ? "Submitting..." : "Submit Registration"}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              localStorage.removeItem("sso_idToken");
              localStorage.removeItem("sso_prefill");
              localStorage.removeItem("sso_registration");
              router.replace("/");
            }}
            disabled={loading}
          >
            Back
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
