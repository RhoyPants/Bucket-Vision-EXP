"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Chip,
  Grid,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import TableRowsOutlinedIcon from "@mui/icons-material/TableRowsOutlined";
import MemberCard from "./MemberCard";
import { useAppSelector } from "@/app/redux/hook";
import {
  aggregateMemberWorkload,
  getSortedMembers,
} from "@/app/utils/teamAggregation";
import type { Projects } from "@/app/redux/slices/projectSlice";

interface Props {
  projectId: string | null;
  allProjectsData?: Projects[] | null;
}

export default function TeamMembers({ projectId, allProjectsData }: Props) {
  const [query, setQuery] = useState("");
  const [workloadFilter, setWorkloadFilter] = useState("ALL");
  const [view, setView] = useState<"cards" | "table">("cards");
  const fullProject = useAppSelector((state) => state.project.fullProject);

  // Determine data to use
  let projectData = null;
  
  if (projectId === "all-projects" && allProjectsData && allProjectsData.length > 0) {
    projectData = null;
  } else if (projectId && projectId !== "all-projects") {
    projectData = fullProject && fullProject.id === projectId ? fullProject : null;
  }

  const memberWorkload = aggregateMemberWorkload(
    projectData,
    projectId === "all-projects" ? allProjectsData || [] : undefined
  );
  const sortedMembers = getSortedMembers(memberWorkload, "progress");
  const filteredMembers = useMemo(() => {
    const search = query.trim().toLowerCase();
    return sortedMembers.filter((member) => {
      const matchesSearch = !search || member.memberName.toLowerCase().includes(search);
      const matchesWorkload =
        workloadFilter === "ALL" ||
        (workloadFilter === "OVERDUE" && member.overdue > 0) ||
        (workloadFilter === "IN_PROGRESS" && member.inProgress > 0) ||
        (workloadFilter === "COMPLETED" && member.assigned > 0 && member.completed === member.assigned) ||
        (workloadFilter === "UNASSIGNED" && member.assigned === 0);
      return matchesSearch && matchesWorkload;
    });
  }, [query, sortedMembers, workloadFilter]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1,
        borderRadius: 3,
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 6px 18px rgba(15,15,15,0.03)",
        backgroundColor: "#fff",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 1.25, mb: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 900, fontSize: 20 }}>Team Members</Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 11.5 }}>
            Showing {filteredMembers.length} of {sortedMembers.length}
          </Typography>
        </Box>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={view}
          onChange={(_, next) => next && setView(next)}
          aria-label="Team member display"
        >
          <ToggleButton value="cards" aria-label="Card view"><GridViewOutlinedIcon fontSize="small" /></ToggleButton>
          <ToggleButton value="table" aria-label="Table view"><TableRowsOutlinedIcon fontSize="small" /></ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(180px, 1fr) 180px" }, gap: 1, mb: 1.5 }}>
        <TextField
          size="small"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search member name"
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlinedIcon fontSize="small" /></InputAdornment> }}
        />
        <TextField select size="small" label="Filter" value={workloadFilter} onChange={(event) => setWorkloadFilter(event.target.value)}>
          <MenuItem value="ALL">All members</MenuItem>
          <MenuItem value="OVERDUE">With overdue tasks</MenuItem>
          <MenuItem value="IN_PROGRESS">With work in progress</MenuItem>
          <MenuItem value="COMPLETED">All tasks completed</MenuItem>
          <MenuItem value="UNASSIGNED">No assigned tasks</MenuItem>
        </TextField>
      </Box>

      {view === "cards" ? (
        <Grid container spacing={1}>
          {filteredMembers.map((member) => (
            <Grid key={member.userId} size={{ xs: 12, sm: 6, md: 4 }}>
              <MemberCard
                projectId={projectId}
                memberId={member.userId}
                name={member.memberName}
                email={member.userEmail}
                assigned={member.assigned}
                completed={member.completed}
                inProgress={member.inProgress}
                pending={member.pending}
                overdue={member.overdue}
                progressPercent={member.progressPercent}
                allProjectsData={projectId === "all-projects" ? allProjectsData : null}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <TableContainer sx={{ border: "1px solid #E2E8F0", borderRadius: 2, maxHeight: 520 }}>
          <Table stickyHeader size="small" sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Member</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>Progress</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>Assigned</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>Completed</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>In Progress</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>Pending</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>Overdue</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.userId} hover>
                  <TableCell><Typography noWrap title={member.memberName} sx={{ maxWidth: 180, fontSize: 12, fontWeight: 800 }}>{member.memberName}</Typography></TableCell>
                  <TableCell sx={{ minWidth: 130 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LinearProgress variant="determinate" value={member.progressPercent} sx={{ flex: 1, height: 6, borderRadius: 4, "& .MuiLinearProgress-bar": { bgcolor: "#4B2E83" } }} />
                      <Typography sx={{ width: 34, fontSize: 11, fontWeight: 700 }}>{member.progressPercent}%</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">{member.assigned}</TableCell>
                  <TableCell align="center" sx={{ color: "#059669", fontWeight: 700 }}>{member.completed}</TableCell>
                  <TableCell align="center" sx={{ color: "#2563EB", fontWeight: 700 }}>{member.inProgress}</TableCell>
                  <TableCell align="center">{member.pending}</TableCell>
                  <TableCell align="center">{member.overdue > 0 ? <Chip size="small" label={member.overdue} color="error" sx={{ height: 20, fontWeight: 800 }} /> : "0"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {filteredMembers.length === 0 && (
        <Typography sx={{ textAlign: "center", color: "text.secondary", py: 3 }}>
          {sortedMembers.length === 0 ? "No team members assigned yet" : "No members match your search or filter"}
        </Typography>
      )}
    </Paper>
  );
}
