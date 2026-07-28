"use client";

import { useMemo, useState } from "react";
import {
  Box, Button, Dialog, DialogContent, DialogTitle, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography,
} from "@mui/material";
import { useAppSelector } from "@/app/redux/hook";
import { aggregateMemberWorkload, getSubtaskStatus } from "@/app/utils/teamAggregation";

interface Props {
  projectId: string | null;
  allProjectsData?: ProjectTree[] | null;
}

type Status = "Completed" | "In Progress" | "Pending" | "Overdue";
type ProjectTree = {
  id: string;
  name: string;
  scopes?: Array<{
    name: string;
    tasks?: Array<{
      title: string;
      subtasks?: Array<{
        id: string;
        title: string;
        progress?: number;
        projectedEndDate?: string;
      }>;
    }>;
  }>;
};
type SubtaskRow = {
  id: string;
  project: string;
  scope: string;
  task: string;
  subtask: string;
  progress: number;
  status: Status;
};

const statusConfig: Array<{ status: Status; color: string; background: string }> = [
  { status: "Completed", color: "#047857", background: "#ECFDF5" },
  { status: "In Progress", color: "#2563EB", background: "#EFF6FF" },
  { status: "Pending", color: "#64748B", background: "#F8FAFC" },
  { status: "Overdue", color: "#DC2626", background: "#FEF2F2" },
];

export default function TaskStatus({ projectId, allProjectsData }: Props) {
  const fullProject = useAppSelector((state) => state.project.fullProject);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);

  const rows = useMemo<SubtaskRow[]>(() => {
    const projects =
      projectId === "all-projects"
        ? allProjectsData ?? []
        : fullProject && fullProject.id === projectId
          ? [fullProject as unknown as ProjectTree]
          : [];
    const result: SubtaskRow[] = [];

    projects.forEach((project) => {
      project.scopes?.forEach((scope) => {
        scope.tasks?.forEach((task) => {
          task.subtasks?.forEach((subtask) => {
            const rawStatus = getSubtaskStatus(subtask.progress ?? 0, subtask.projectedEndDate);
            const status: Status =
              rawStatus === "completed" ? "Completed" :
              rawStatus === "in-progress" ? "In Progress" :
              rawStatus === "overdue" ? "Overdue" : "Pending";
            result.push({
              id: subtask.id,
              project: project.name,
              scope: scope.name,
              task: task.title,
              subtask: subtask.title,
              progress: subtask.progress ?? 0,
              status,
            });
          });
        });
      });
    });
    return result;
  }, [allProjectsData, fullProject, projectId]);

  const filteredRows = selectedStatus ? rows.filter((row) => row.status === selectedStatus) : [];
  const projectData = fullProject?.id === projectId ? fullProject : null;
  const teamMemberCount = Object.keys(
    aggregateMemberWorkload(
      projectData,
      projectId === "all-projects" ? allProjectsData ?? [] : undefined,
    ),
  ).length;

  return (
    <>
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 6px 18px rgba(15,15,15,0.04)", bgcolor: "#fff" }}>
        <Typography sx={{ fontWeight: 900, fontSize: 18 }}>Subtask Status</Typography>
        <Typography sx={{ color: "#64748B", fontSize: 11, mt: 0.25, mb: 1.5 }}>Click a status to view its subtasks.</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25 }}>
          {statusConfig.map((item) => {
            const count = rows.filter((row) => row.status === item.status).length;
            return (
              <Box
                component="button"
                type="button"
                key={item.status}
                onClick={() => setSelectedStatus(item.status)}
                sx={{
                  minHeight: 78, p: 1.25, borderRadius: 2.25, border: `1px solid ${item.color}28`,
                  bgcolor: item.background, textAlign: "center", cursor: "pointer",
                  transition: "transform .15s ease, border-color .15s ease",
                  "&:hover": { borderColor: item.color, transform: "translateY(-2px)" },
                }}
              >
                <Typography sx={{ color: item.color, fontSize: 20, fontWeight: 900, lineHeight: 1.2 }}>{count}</Typography>
                <Typography sx={{ color: "#334155", fontSize: 10.5, fontWeight: 700, mt: 0.75 }}>{item.status}</Typography>
              </Box>
            );
          })}
        </Box>
        <Box sx={{ mt: 1.75, pt: 1.5, borderTop: "1px solid #E2E8F0" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
            <Typography sx={{ color: "#334155", fontSize: 11, fontWeight: 800 }}>Total Subtasks</Typography>
            <Typography sx={{ color: "#312E81", fontSize: 11, fontWeight: 900 }}>{rows.length}</Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography sx={{ color: "#334155", fontSize: 11, fontWeight: 800 }}>Team Members</Typography>
            <Typography sx={{ color: "#312E81", fontSize: 11, fontWeight: 900 }}>{teamMemberCount}</Typography>
          </Box>
        </Box>
      </Paper>

      <Dialog open={Boolean(selectedStatus)} onClose={() => setSelectedStatus(null)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 900 }}>{selectedStatus} Subtasks ({filteredRows.length})</DialogTitle>
        <DialogContent dividers>
          {filteredRows.length ? (
            <TableContainer sx={{ border: "1px solid #E2E8F0", borderRadius: 2, maxHeight: 520 }}>
              <Table stickyHeader size="small" sx={{ minWidth: 650 }}>
                <TableHead><TableRow><TableCell sx={{ fontWeight: 800 }}>Scope</TableCell><TableCell sx={{ fontWeight: 800 }}>Task</TableCell><TableCell sx={{ fontWeight: 800 }}>Subtask</TableCell><TableCell align="right" sx={{ fontWeight: 800 }}>Progress</TableCell></TableRow></TableHead>
                <TableBody>
                  {filteredRows.map((row) => (
                    <TableRow key={`${row.project}-${row.id}`} hover>
                      <TableCell sx={{ fontSize: 12 }}>{row.scope}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{row.task}</TableCell>
                      <TableCell sx={{ fontSize: 12, fontWeight: 700 }}>{row.subtask}</TableCell>
                      <TableCell align="right" sx={{ fontSize: 12, fontWeight: 700 }}>{row.progress}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ py: 4, textAlign: "center", color: "#64748B" }}>No {selectedStatus?.toLowerCase()} subtasks.</Typography>
          )}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}><Button onClick={() => setSelectedStatus(null)}>Close</Button></Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
