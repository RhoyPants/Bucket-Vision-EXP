"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";
import {
  approveSsoRegistrationRequest,
  getSsoRegistrationAudits,
  getSsoRegistrationRequests,
  rejectSsoRegistrationRequest,
} from "@/app/api-service/ssoRegistrationService";
import { getBusinessUnitsDropdown } from "@/app/api-service/businessUnitService";
import { getRoles } from "@/app/lib/role.api";
import { usePermissions } from "@/app/lib/usePermissions";

interface Role {
  id: string;
  name: string;
}

interface BusinessUnit {
  id: string;
  code: string;
  name: string;
  buHead?: string;
}

interface RegistrationRequest {
  id: string;
  referenceNo?: string;
  status?: string;
  rejectReason?: string;
  createdAt?: string;
  updatedAt?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  position?: string;
  remarks?: string;
  company?: string;
  buHead?: string;
  requestedRoleId?: string;
  businessUnitId?: string;
  requestedRole?: { id?: string; name?: string };
  businessUnit?: { id?: string; name?: string; code?: string; buHead?: string };
  prefill?: {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    company?: string;
    buHead?: string;
  };
  user?: { fullName?: string; name?: string; email?: string };
}

interface RegistrationAudit {
  id: string;
  registrationId?: string;
  action?: string;
  fromStatus?: string;
  toStatus?: string;
  reason?: string;
  changedById?: string;
  createdAt?: string;
  changedBy?: { id?: string; name?: string; email?: string };
}

type TabKey = "PENDING" | "REJECTED" | "INACTIVE_ACCOUNT" | "APPROVED";

interface TabConfig {
  key: TabKey;
  label: string;
  color: "warning" | "error" | "default" | "success";
  canApprove: boolean;
  canReject: boolean;
}

const TABS: TabConfig[] = [
  { key: "PENDING", label: "Pending", color: "warning", canApprove: true, canReject: true },
  { key: "REJECTED", label: "Rejected", color: "error", canApprove: false, canReject: false },
  { key: "INACTIVE_ACCOUNT", label: "Inactive", color: "default", canApprove: true, canReject: false },
  { key: "APPROVED", label: "Approved", color: "success", canApprove: false, canReject: false },
];

const extractRoles = (res: any): Role[] => {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res)) return res;
  return [];
};

const getName = (item: RegistrationRequest) =>
  item.fullName ||
  `${item.firstName || ""} ${item.lastName || ""}`.trim() ||
  item.prefill?.fullName ||
  `${item.prefill?.firstName || ""} ${item.prefill?.lastName || ""}`.trim() ||
  item.user?.fullName ||
  item.user?.name ||
  "-";

const getEmail = (item: RegistrationRequest) =>
  item.email || item.prefill?.email || item.user?.email || "-";

export default function UserRequests() {
  const { can } = usePermissions();
  const canReadUsers = can("USERS", "READ");
  const canUpdateUsers = can("USERS", "UPDATE");

  const [allRequests, setAllRequests] = useState<Record<TabKey, RegistrationRequest[]>>({
    PENDING: [],
    REJECTED: [],
    INACTIVE_ACCOUNT: [],
    APPROVED: [],
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);

  const [activeTab, setActiveTab] = useState<TabKey>("PENDING");
  const [loading, setLoading] = useState(true);
  const [loadingTab, setLoadingTab] = useState<TabKey | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [buFilter, setBuFilter] = useState("ALL");

  const [selected, setSelected] = useState<Record<TabKey, Set<string>>>({
    PENDING: new Set(),
    REJECTED: new Set(),
    INACTIVE_ACCOUNT: new Set(),
    APPROVED: new Set(),
  });

  const [reviewItem, setReviewItem] = useState<RegistrationRequest | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    roleId: "",
    firstName: "",
    lastName: "",
    company: "",
    businessUnitId: "",
    position: "",
    remarks: "",
  });

  const [rejectItem, setRejectItem] = useState<RegistrationRequest | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");

  const [auditOpen, setAuditOpen] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditTarget, setAuditTarget] = useState<string>("");
  const [audits, setAudits] = useState<RegistrationAudit[]>([]);

  const loadTab = useCallback(async (tab: TabKey) => {
    setLoadingTab(tab);
    try {
      const list = await getSsoRegistrationRequests(tab);
      setAllRequests((prev) => ({ ...prev, [tab]: Array.isArray(list) ? list : [] }));
    } catch (err: any) {
      setError(err?.response?.data?.message || `Failed to load ${tab} requests.`);
    } finally {
      setLoadingTab(null);
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        const [rolesRes, buRes] = await Promise.all([getRoles(), getBusinessUnitsDropdown()]);
        setRoles(extractRoles(rolesRes));
        setBusinessUnits(Array.isArray(buRes) ? buRes : []);
        await Promise.all(TABS.map((t) => loadTab(t.key)));
      } catch (err) {
        console.error("Failed to load user request data", err);
      } finally {
        setLoading(false);
      }
    };

    if (canReadUsers) {
      bootstrap();
    } else {
      setLoading(false);
    }
  }, [loadTab, canReadUsers]);

  useEffect(() => {
    setSearch("");
    setRoleFilter("ALL");
    setBuFilter("ALL");
  }, [activeTab]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return allRequests[activeTab].filter((item) => {
      const rId = item.requestedRoleId || item.requestedRole?.id || "";
      const bId = item.businessUnitId || item.businessUnit?.id || "";
      const roleMatch = roleFilter === "ALL" || rId === roleFilter;
      const buMatch = buFilter === "ALL" || bId === buFilter;
      if (!keyword) return roleMatch && buMatch;

      const hay = [
        item.referenceNo,
        getName(item),
        getEmail(item),
        item.firstName,
        item.lastName,
        item.position,
        item.company,
        item.buHead,
        item.businessUnit?.buHead,
        item.requestedRole?.name,
        item.businessUnit?.name,
        item.rejectReason,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return roleMatch && buMatch && hay.includes(keyword);
    });
  }, [allRequests, activeTab, search, roleFilter, buFilter]);

  const tabCfg = TABS.find((t) => t.key === activeTab)!;
  const tabSelection = selected[activeTab];
  const visibleIds = filteredRows.map((r) => r.id);
  const allVisibleSel = visibleIds.length > 0 && visibleIds.every((id) => tabSelection.has(id));
  const someSelected = visibleIds.some((id) => tabSelection.has(id)) && !allVisibleSel;

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev[activeTab]);
      next.has(id) ? next.delete(id) : next.add(id);
      return { ...prev, [activeTab]: next };
    });

  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev[activeTab]);
      if (allVisibleSel) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return { ...prev, [activeTab]: next };
    });

  const clearSelection = () =>
    setSelected((prev) => ({ ...prev, [activeTab]: new Set() }));

  const openReview = (item: RegistrationRequest) => {
    setReviewItem(item);
    setReviewForm({
      roleId: item.requestedRoleId || item.requestedRole?.id || "",
      firstName: item.firstName || item.prefill?.firstName || "",
      lastName: item.lastName || item.prefill?.lastName || "",
      company: item.company || item.prefill?.company || "",
      businessUnitId: item.businessUnitId || item.businessUnit?.id || "",
      position: item.position || "",
      remarks: item.remarks || "",
    });
    setReviewOpen(true);
  };

  const openReject = (item: RegistrationRequest) => {
    setRejectItem(item);
    setRejectReason("");
    setRejectOpen(true);
  };

  const openAudit = async (item: RegistrationRequest) => {
    setAuditTarget(item.referenceNo || item.id);
    setAuditOpen(true);
    setAuditLoading(true);
    setError(null);

    try {
      const rows = await getSsoRegistrationAudits({ registrationId: item.id });
      setAudits(Array.isArray(rows) ? rows : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load registration audits.");
      setAudits([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!reviewItem) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await approveSsoRegistrationRequest(reviewItem.id, reviewForm);
      setSuccess("Request approved successfully.");
      setReviewOpen(false);
      await Promise.all([loadTab(activeTab), loadTab("APPROVED")]);
      clearSelection();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to approve request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectItem || !rejectReason.trim()) {
      setError("Rejection reason is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await rejectSsoRegistrationRequest(rejectItem.id, { reason: rejectReason.trim() });
      setSuccess("Request rejected.");
      setRejectOpen(false);
      await Promise.all([loadTab(activeTab), loadTab("REJECTED")]);
      clearSelection();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to reject request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkApprove = async () => {
    const ids = Array.from(tabSelection);
    if (!ids.length) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await Promise.all(ids.map((id) => approveSsoRegistrationRequest(id, {})));
      setSuccess(`${ids.length} request(s) approved.`);
      await Promise.all([loadTab(activeTab), loadTab("APPROVED")]);
      clearSelection();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Bulk approve partially failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkReject = async () => {
    if (!bulkRejectReason.trim()) {
      setError("Rejection reason is required.");
      return;
    }

    const ids = Array.from(tabSelection);
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await Promise.all(
        ids.map((id) => rejectSsoRegistrationRequest(id, { reason: bulkRejectReason.trim() }))
      );
      setSuccess(`${ids.length} request(s) rejected.`);
      setBulkRejectOpen(false);
      setBulkRejectReason("");
      await Promise.all([loadTab(activeTab), loadTab("REJECTED")]);
      clearSelection();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Bulk reject partially failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const roleName = (item: RegistrationRequest) =>
    item.requestedRole?.name ||
    roles.find((r) => r.id === (item.requestedRoleId || item.requestedRole?.id))?.name ||
    "-";

  const buName = (item: RegistrationRequest) =>
    item.businessUnit?.name ||
    businessUnits.find((b) => b.id === (item.businessUnitId || item.businessUnit?.id))?.name ||
    "-";

  const isTabLoading = loadingTab === activeTab;

  return (
    <Box>
      {!canReadUsers && (
        <Alert severity="error" sx={{ mb: 2 }}>
          You do not have USERS READ permission.
        </Alert>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          User Requests
        </Typography>
        <Tooltip title="Refresh current tab">
          <span>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => loadTab(activeTab)}
              disabled={isTabLoading || !canReadUsers}
            >
              Refresh
            </Button>
          </span>
        </Tooltip>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper elevation={0} sx={{ borderBottom: "1px solid #e0e0e0" }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v as TabKey)}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          {TABS.map((t) => (
            <Tab
              key={t.key}
              value={t.key}
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <span>{t.label}</span>
                  <Chip
                    label={allRequests[t.key].length}
                    size="small"
                    color={t.color}
                    sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
                  />
                </Stack>
              }
              sx={{ textTransform: "none", fontWeight: 600, minHeight: 48 }}
            />
          ))}
        </Tabs>
      </Paper>

      <Paper
        elevation={0}
        sx={{ p: 2, border: "1px solid #e0e0e0", borderTop: 0, borderRadius: "0 0 4px 4px", mb: 2 }}
      >
        <Stack direction={{ xs: "column", md: "row" }} gap={1.5}>
          <TextField
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, email, reference..."
            size="small"
            sx={{ minWidth: { xs: "100%", md: 260 } }}
          />
          <TextField
            select
            label="Role"
            size="small"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            sx={{ minWidth: { xs: "100%", md: 200 } }}
          >
            <MenuItem value="ALL">All Roles</MenuItem>
            {roles.map((r) => (
              <MenuItem key={r.id} value={r.id}>
                {r.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Business Unit"
            size="small"
            value={buFilter}
            onChange={(e) => setBuFilter(e.target.value)}
            sx={{ minWidth: { xs: "100%", md: 220 } }}
          >
            <MenuItem value="ALL">All Business Units</MenuItem>
            {businessUnits.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name} ({b.code})
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {tabSelection.size > 0 && (
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            px: 2,
            py: 1,
            mb: 1,
            backgroundColor: "#eef2ff",
            border: "1px solid #c7d2fe",
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            {tabSelection.size} selected
          </Typography>
          {tabCfg.canApprove && canUpdateUsers && (
            <Button
              size="small"
              variant="contained"
              startIcon={<CheckCircleIcon />}
              onClick={handleBulkApprove}
              disabled={submitting}
            >
              Bulk Approve
            </Button>
          )}
          {tabCfg.canReject && canUpdateUsers && (
            <Button
              size="small"
              color="error"
              variant="outlined"
              startIcon={<BlockIcon />}
              onClick={() => {
                setBulkRejectReason("");
                setBulkRejectOpen(true);
              }}
              disabled={submitting}
            >
              Bulk Reject
            </Button>
          )}
          <Button size="small" onClick={clearSelection} disabled={submitting}>
            Clear
          </Button>
        </Paper>
      )}

      {loading || isTabLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : filteredRows.length === 0 ? (
        <Alert severity="info">No {tabCfg.label.toLowerCase()} requests match the current filters.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
              <TableRow>
                {(tabCfg.canApprove || tabCfg.canReject) && canUpdateUsers && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={allVisibleSel}
                      indeterminate={someSelected}
                      onChange={toggleAll}
                    />
                  </TableCell>
                )}
                <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Business Unit</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>BU Head</TableCell>
                {activeTab === "REJECTED" && <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>}
                <TableCell sx={{ fontWeight: 700 }}>Submitted</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.map((item) => (
                <TableRow
                  key={item.id}
                  hover
                  selected={tabSelection.has(item.id)}
                  sx={{ "&.Mui-selected": { backgroundColor: "#f0f4ff" } }}
                >
                  {(tabCfg.canApprove || tabCfg.canReject) && canUpdateUsers && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={tabSelection.has(item.id)}
                        onChange={() => toggleOne(item.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{item.referenceNo || "-"}</Typography>
                  </TableCell>
                  <TableCell>{getName(item)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: 12 }}>{getEmail(item)}</Typography>
                  </TableCell>
                  <TableCell>{roleName(item)}</TableCell>
                  <TableCell>{buName(item)}</TableCell>
                  <TableCell>{item.buHead || item.businessUnit?.buHead || item.prefill?.buHead || "-"}</TableCell>
                  {activeTab === "REJECTED" && (
                    <TableCell>
                      <Tooltip title={item.rejectReason || ""}>
                        <Typography
                          variant="body2"
                          color="error"
                          sx={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        >
                          {item.rejectReason || "-"}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  )}
                  <TableCell>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      {tabCfg.canApprove && canUpdateUsers && (
                        <Button size="small" variant="contained" onClick={() => openReview(item)}>
                          {activeTab === "INACTIVE_ACCOUNT" ? "Activate" : "Approve"}
                        </Button>
                      )}
                      <Button size="small" variant="outlined" onClick={() => openReview(item)}>
                        Edit
                      </Button>
                      <Button size="small" variant="outlined" onClick={() => openAudit(item)}>
                        Audit
                      </Button>
                      {tabCfg.canReject && canUpdateUsers && (
                        <Button size="small" color="error" variant="outlined" onClick={() => openReject(item)}>
                          Reject
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Review and Edit Request
          {reviewItem && (
            <Typography variant="body2" color="text.secondary">
              {getName(reviewItem)} - {reviewItem.referenceNo}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
            <TextField
              label="First Name"
              size="small"
              fullWidth
              value={reviewForm.firstName}
              onChange={(e) => setReviewForm((p) => ({ ...p, firstName: e.target.value }))}
            />
            <TextField
              label="Last Name"
              size="small"
              fullWidth
              value={reviewForm.lastName}
              onChange={(e) => setReviewForm((p) => ({ ...p, lastName: e.target.value }))}
            />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
            <TextField label="Email" value={reviewItem ? getEmail(reviewItem) : ""} disabled fullWidth size="small" />
            <TextField
              label="Company"
              size="small"
              fullWidth
              value={reviewForm.company}
              onChange={(e) => setReviewForm((p) => ({ ...p, company: e.target.value }))}
            />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
            <TextField
              select
              label="Requested Role"
              size="small"
              fullWidth
              value={reviewForm.roleId}
              onChange={(e) => setReviewForm((p) => ({ ...p, roleId: e.target.value }))}
            >
              <MenuItem value="">-- Select Role --</MenuItem>
              {roles.map((r) => (
                <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Business Unit"
              size="small"
              fullWidth
              value={reviewForm.businessUnitId}
              onChange={(e) => setReviewForm((p) => ({ ...p, businessUnitId: e.target.value }))}
            >
              <MenuItem value="">-- Select Business Unit --</MenuItem>
              {businessUnits.map((b) => (
                <MenuItem key={b.id} value={b.id}>{b.name} ({b.code})</MenuItem>
              ))}
            </TextField>
          </Stack>
          <TextField
            label="Position"
            size="small"
            fullWidth
            value={reviewForm.position}
            onChange={(e) => setReviewForm((p) => ({ ...p, position: e.target.value }))}
          />
          <TextField
            label="Admin Notes"
            multiline
            minRows={3}
            fullWidth
            value={reviewForm.remarks}
            onChange={(e) => setReviewForm((p) => ({ ...p, remarks: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setReviewOpen(false)} disabled={submitting}>Cancel</Button>
          {tabCfg.canApprove && canUpdateUsers && (
            <Button onClick={handleApprove} variant="contained" disabled={submitting}>
              {submitting ? "Saving..." : activeTab === "INACTIVE_ACCOUNT" ? "Activate" : "Approve"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Reject Request
          {rejectItem && (
            <Typography variant="body2" color="text.secondary">
              {getName(rejectItem)} - {rejectItem.referenceNo}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Reason *"
            multiline
            minRows={4}
            fullWidth
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleReject} color="error" variant="contained" disabled={submitting}>
            {submitting ? "Rejecting..." : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkRejectOpen} onClose={() => setBulkRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Reject - {tabSelection.size} Request(s)</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Reason (applies to all selected) *"
            multiline
            minRows={4}
            fullWidth
            value={bulkRejectReason}
            onChange={(e) => setBulkRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBulkRejectOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleBulkReject} color="error" variant="contained" disabled={submitting}>
            {submitting ? "Rejecting..." : `Reject ${tabSelection.size}`}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={auditOpen} onClose={() => setAuditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Registration Audit Trail
          {auditTarget && (
            <Typography variant="body2" color="text.secondary">Target: {auditTarget}</Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {auditLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : audits.length === 0 ? (
            <Alert severity="info">No audit records found for this registration.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status Change</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Changed By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {audits.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.createdAt ? new Date(a.createdAt).toLocaleString() : "-"}</TableCell>
                      <TableCell>{a.action || "-"}</TableCell>
                      <TableCell>{`${a.fromStatus || "-"} -> ${a.toStatus || "-"}`}</TableCell>
                      <TableCell>{a.reason || "-"}</TableCell>
                      <TableCell>{a.changedBy?.name || a.changedBy?.email || a.changedById || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAuditOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
