"use client";

import {
  AccountTreeOutlined,
  BadgeOutlined,
  BusinessOutlined,
  CheckCircleOutline,
  EmailOutlined,
  FolderOutlined,
  GroupsOutlined,
  PersonOutline,
  SupervisorAccountOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { getBusinessUnitsDropdown } from "@/app/api-service/businessUnitService";
import { getUserById } from "@/app/lib/user.api";
import { getUserRelations } from "@/app/lib/userRelation.api";
import { brandColors } from "@/app/lib/theme";
import { getProjects } from "@/app/redux/controllers/projectController";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";

type ProfileRecord = Record<string, any>;
type RelationUser = { id?: string; name?: string; email?: string; role?: string | { name?: string }; position?: string };
type BusinessUnit = { id?: string; code?: string; name?: string; entity?: string; buHead?: string; buHeadUserId?: string; assistantHead?: string; isActive?: boolean };

const readable = (value?: string) =>
  value ? value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Not assigned";

function Detail({ icon, label, value, helper }: { icon: React.ReactNode; label: string; value?: React.ReactNode; helper?: string }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
      <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: brandColors.lavenderMist, color: brandColors.vividRoyal, display: "grid", placeItems: "center", flexShrink: 0 }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color: "#747184", fontSize: 12, mb: 0.25 }}>{label}</Typography>
        <Typography sx={{ color: brandColors.deepTwilight, fontSize: 14, fontWeight: 600, overflowWrap: "anywhere" }}>{value || "Not provided"}</Typography>
        {helper && <Typography sx={{ color: "#8C8998", fontSize: 11.5, mt: 0.25 }}>{helper}</Typography>}
      </Box>
    </Stack>
  );
}

function PersonRow({ person, emptyText }: { person?: RelationUser; emptyText: string }) {
  if (!person) return <Typography sx={{ color: "#89859A", fontSize: 13 }}>{emptyText}</Typography>;
  const role = typeof person.role === "string" ? person.role : person.role?.name;
  return (
    <Stack direction="row" spacing={1.25} alignItems="center">
      <Avatar sx={{ width: 38, height: 38, bgcolor: brandColors.lavenderMist, color: brandColors.vividRoyal, fontSize: 14, fontWeight: 700 }}>
        {(person.name || "U").split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography noWrap sx={{ color: brandColors.deepTwilight, fontSize: 13.5, fontWeight: 650 }}>{person.name || "Unnamed user"}</Typography>
        <Typography noWrap sx={{ color: "#777386", fontSize: 12 }}>{person.position || readable(role) || person.email}</Typography>
      </Box>
    </Stack>
  );
}

export default function UserProfile() {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);
  const permissions = useAppSelector((state) => state.auth.permissions);
  const { projects, loading: projectsLoading } = useAppSelector((state) => state.project);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [relations, setRelations] = useState<{ managers: RelationUser[]; members: RelationUser[] }>({ managers: [], members: [] });
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadWarning, setLoadWarning] = useState(false);

  useEffect(() => {
    if (!authUser?.id) return;
    let active = true;
    setLoading(true);
    Promise.allSettled([getUserById(authUser.id), getUserRelations(), getBusinessUnitsDropdown()]).then((results) => {
      if (!active) return;
      const [userResult, relationResult, unitResult] = results;
      setProfile(userResult.status === "fulfilled" ? userResult.value : authUser);
      if (relationResult.status === "fulfilled") setRelations(relationResult.value);
      if (unitResult.status === "fulfilled") setBusinessUnits(unitResult.value);
      setLoadWarning(results.some((result) => result.status === "rejected"));
      setLoading(false);
    });
    dispatch(getProjects());
    return () => { active = false; };
  }, [authUser, dispatch]);

  const user = { ...authUser, ...(profile || {}) } as ProfileRecord;
  const roleName = typeof user.role === "string" ? user.role : user.role?.name;
  const businessUnit = useMemo(() => {
    if (user.businessUnit && typeof user.businessUnit === "object") return user.businessUnit as BusinessUnit;
    return businessUnits.find((unit) => unit.id === user.businessUnitId || unit.code === user.businessUnitCode);
  }, [businessUnits, user.businessUnit, user.businessUnitCode, user.businessUnitId]);
  const relatedProjects = useMemo(() => projects.filter((project: any) =>
    project.ownerId === user.id || project.projectMembers?.some((member: any) => member.userId === user.id || member.user?.id === user.id)
  ), [projects, user.id]);
  const ownedCount = relatedProjects.filter((project: any) => project.ownerId === user.id || project.projectMembers?.some((member: any) => member.userId === user.id && member.role === "OWNER")).length;
  const initials = (user.name || "User").split(" ").map((part: string) => part[0]).slice(0, 2).join("").toUpperCase();
  const statusActive = user.isActive !== false;
  const buHead = businessUnit?.buHead || user.buHead || relations.managers[0]?.name;
  const permissionRows = useMemo(() => Object.values(permissions || {})
    .filter((permission) => permission.canView || permission.canCreate || permission.canUpdate || permission.canDelete || permission.canApprove)
    .sort((a, b) => (a.name || a.key).localeCompare(b.name || b.key)), [permissions]);

  if (!authUser || loading) return <Box sx={{ minHeight: 320, display: "grid", placeItems: "center" }}><CircularProgress size={30} /></Box>;

  return (
    <Box sx={{ pb: 3 }}>
      {loadWarning && <Alert severity="warning" sx={{ mb: 2 }}>Some organization details could not be loaded. Available profile information is shown below.</Alert>}

      <Paper elevation={0} sx={{ overflow: "hidden", border: "1px solid #E3E0EA", borderRadius: 3, bgcolor: "#fff" }}>
        <Box sx={{ height: 76, background: `linear-gradient(110deg, ${brandColors.deepTwilight} 0%, ${brandColors.vividRoyal} 58%, ${brandColors.mediumSlateBlue} 100%)` }} />
        <Box sx={{ px: { xs: 2, md: 3 }, pb: 2.5, mt: -38 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "flex-end" }}>
            <Avatar sx={{ width: 86, height: 86, bgcolor: "#fff", color: brandColors.vividRoyal, border: "5px solid #fff", boxShadow: "0 3px 12px rgba(17,9,71,.18)", fontSize: 25, fontWeight: 750 }}>{initials}</Avatar>
            <Box sx={{ flex: 1, pb: 0.5 }}>
              <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                <Typography sx={{ color: brandColors.deepTwilight, fontSize: { xs: 22, md: 26 }, fontWeight: 750, lineHeight: 1.2 }}>{user.name || "Unnamed user"}</Typography>
                <Chip label={statusActive ? "Active" : "Inactive"} size="small" sx={{ bgcolor: statusActive ? "#E5F8F1" : "#FDECEC", color: statusActive ? "#087A57" : "#B42318", fontWeight: 700 }} />
              </Stack>
              <Typography sx={{ color: "#696578", fontSize: 13.5, mt: 0.5 }}>{user.position || readable(roleName)}{businessUnit?.name ? ` · ${businessUnit.name}` : ""}</Typography>
            </Box>
            <Chip icon={<BadgeOutlined />} label={readable(roleName)} sx={{ mb: { sm: 0.75 }, bgcolor: brandColors.lavenderMist, color: brandColors.deepTwilight, fontWeight: 650, "& .MuiChip-icon": { color: brandColors.vividRoyal } }} />
          </Stack>
        </Box>
      </Paper>

      <Grid container spacing={2} sx={{ mt: 0 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, height: "100%", border: "1px solid #E3E0EA", borderRadius: 3 }}>
            <Typography sx={{ color: brandColors.deepTwilight, fontSize: 16, fontWeight: 700 }}>Profile information</Typography>
            <Typography sx={{ color: "#7A7688", fontSize: 12.5, mt: 0.25 }}>Your account and organization details</Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}><Detail icon={<PersonOutline fontSize="small" />} label="Full name" value={user.name} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Detail icon={<EmailOutlined fontSize="small" />} label="Email address" value={user.email} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Detail icon={<BadgeOutlined fontSize="small" />} label="System role" value={readable(roleName)} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Detail icon={<AccountTreeOutlined fontSize="small" />} label="Position / job title" value={user.position || user.jobTitle} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Detail icon={<BusinessOutlined fontSize="small" />} label="Business unit" value={businessUnit?.name || user.businessUnitName} helper={businessUnit?.code ? `${businessUnit.code}${businessUnit.entity ? ` · ${businessUnit.entity}` : ""}` : undefined} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Detail icon={<SupervisorAccountOutlined fontSize="small" />} label="Business Unit Head / Approver" value={buHead} /></Grid>
              {user.department && <Grid size={{ xs: 12, sm: 6 }}><Detail icon={<BusinessOutlined fontSize="small" />} label="Department" value={user.department} /></Grid>}
              {user.employeeId && <Grid size={{ xs: 12, sm: 6 }}><Detail icon={<BadgeOutlined fontSize="small" />} label="Employee ID" value={user.employeeId} /></Grid>}
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={2} sx={{ height: "100%" }}>
            <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #E3E0EA", borderRadius: 3 }}>
              <Typography sx={{ color: brandColors.deepTwilight, fontSize: 16, fontWeight: 700 }}>Reporting relationships</Typography>
              <Typography sx={{ color: "#7A7688", fontSize: 12.5, mt: 0.25, mb: 2 }}>People connected to your account</Typography>
              <Typography sx={{ color: "#7A7688", fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", mb: 1 }}>Manager / Approver</Typography>
              <Stack spacing={1.25}>{relations.managers.length ? relations.managers.map((person, index) => <PersonRow key={person.id || index} person={person} emptyText="" />) : <PersonRow emptyText="No manager or approver assigned" />}</Stack>
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box><Typography sx={{ color: brandColors.deepTwilight, fontSize: 13.5, fontWeight: 650 }}>Direct members</Typography><Typography sx={{ color: "#7A7688", fontSize: 12 }}>Users reporting to you</Typography></Box>
                <Chip label={relations.members.length} size="small" sx={{ bgcolor: brandColors.aliceBlue, color: "#2656A8", fontWeight: 700 }} />
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ p: 2.5, flex: 1, border: "1px solid #E3E0EA", borderRadius: 3 }}>
              <Typography sx={{ color: brandColors.deepTwilight, fontSize: 16, fontWeight: 700, mb: 1.75 }}>Project involvement</Typography>
              <Grid container spacing={1.25}>
                {[{ label: "Assigned projects", value: relatedProjects.length, icon: <FolderOutlined /> }, { label: "Project owner", value: ownedCount, icon: <SupervisorAccountOutlined /> }, { label: "Team member", value: Math.max(0, relatedProjects.length - ownedCount), icon: <GroupsOutlined /> }].map((item) => (
                  <Grid size={{ xs: 12, sm: 4, lg: 12 }} key={item.label}>
                    <Stack direction="row" alignItems="center" spacing={1.25} sx={{ p: 1.25, bgcolor: "#FAF9FD", borderRadius: 2 }}>
                      <Box sx={{ color: brandColors.vividRoyal, display: "flex" }}>{item.icon}</Box>
                      <Box sx={{ flex: 1 }}><Typography sx={{ color: "#777386", fontSize: 12 }}>{item.label}</Typography><Typography sx={{ color: brandColors.deepTwilight, fontSize: 18, fontWeight: 750, lineHeight: 1.1 }}>{projectsLoading ? "—" : item.value}</Typography></Box>
                    </Stack>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ mt: 2, p: { xs: 2, md: 2.5 }, border: "1px solid #E3E0EA", borderRadius: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={1}>
          <Box>
            <Typography sx={{ color: brandColors.deepTwilight, fontSize: 16, fontWeight: 700 }}>Access permissions</Typography>
            <Typography sx={{ color: "#7A7688", fontSize: 12.5, mt: 0.25 }}>Read-only summary of the access assigned to your role</Typography>
          </Box>
          <Chip label={`${permissionRows.length} accessible modules`} size="small" sx={{ bgcolor: brandColors.lavenderMist, color: brandColors.vividRoyal, fontWeight: 700 }} />
        </Stack>
        <Divider sx={{ my: 2 }} />

        {permissionRows.length ? (
          <Grid container spacing={1.25}>
            {permissionRows.map((permission) => {
              const actions = [
                { label: "View", enabled: permission.canView },
                { label: "Create", enabled: permission.canCreate },
                { label: "Update", enabled: permission.canUpdate },
                { label: "Delete", enabled: permission.canDelete },
                { label: "Approve", enabled: permission.canApprove },
              ].filter((action) => action.enabled);
              return (
                <Grid size={{ xs: 12, md: 6 }} key={permission.key}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={1} sx={{ p: 1.5, minHeight: 66, border: "1px solid #ECE9F1", borderRadius: 2, bgcolor: "#FCFBFE" }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap sx={{ color: brandColors.deepTwilight, fontSize: 13.5, fontWeight: 650 }}>{permission.name || readable(permission.key)}</Typography>
                      <Typography noWrap sx={{ color: "#8A8697", fontSize: 11.5 }}>{permission.path || permission.key}</Typography>
                    </Box>
                    <Stack direction="row" gap={0.6} flexWrap="wrap" useFlexGap>
                      {actions.map((action) => (
                        <Chip key={action.label} icon={<CheckCircleOutline />} label={action.label} size="small" sx={{ height: 25, bgcolor: action.label === "View" ? brandColors.aliceBlue : brandColors.lavenderMist, color: action.label === "View" ? "#2656A8" : brandColors.vividRoyal, fontSize: 11, fontWeight: 650, "& .MuiChip-icon": { fontSize: 14, color: "inherit" } }} />
                      ))}
                    </Stack>
                  </Stack>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Typography sx={{ color: "#89859A", fontSize: 13 }}>No module permissions are currently assigned to this account.</Typography>
        )}
      </Paper>

      <Typography sx={{ color: "#94909F", fontSize: 11.5, mt: 1.5, px: 0.5 }}>Account ID: {user.id}</Typography>
    </Box>
  );
}
