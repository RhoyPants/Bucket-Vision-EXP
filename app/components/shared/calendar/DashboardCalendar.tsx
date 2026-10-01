"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import {
  fetchCalendarScopes,
  fetchCalendarMonth,
} from "@/app/redux/controllers/projectCalendarController";
import { Box, Card, CircularProgress, Alert, Stack, Typography, Chip } from "@mui/material";
import CalendarHeader from "@/app/components/shared/calendar/CalendarHeader";
import CalendarGrid from "@/app/components/shared/calendar/CalendarGrid";
import ScopeFilter from "@/app/components/shared/calendar/ScopeFilter";
import ProgressCalendarModal from "@/app/components/shared/modals/ProgressCalendarModal";
import { usePermissions } from "@/app/lib/usePermissions";

interface DashboardCalendarProps {
  projectId: string | null;
  projectStartDate?: string | null; // used to auto-navigate to the project's month
  projectTree?: any;
}

export default function DashboardCalendar({
  projectId,
  projectStartDate,
  projectTree,
}: DashboardCalendarProps) {
  const dispatch = useAppDispatch();
  const { canView } = usePermissions();
  const canViewProgress = canView("progress");

  // Initialize to project's start month if provided, otherwise today
  const getInitialDate = () => {
    if (projectStartDate) {
      const d = new Date(projectStartDate);
      if (!isNaN(d.getTime())) {
        return { month: d.getMonth() + 1, year: d.getFullYear() };
      }
    }
    return { month: new Date().getMonth() + 1, year: new Date().getFullYear() };
  };

  const initial = getInitialDate();
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);
  const [scopeId, setScopeId] = useState<string | null>(null);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { loading, error, scopes: fetchedScopes, subtasks: fetchedSubtasks } = useAppSelector(
    (state) => state.projectCalendar
  );

  const treeMatchesProject = Boolean(projectTree && String(projectTree.id) === String(projectId));
  const treeScopes = useMemo(
    () => (treeMatchesProject ? projectTree.scopes || [] : []),
    [projectTree, treeMatchesProject],
  );
  const scopes = useMemo(
    () => treeMatchesProject
      ? treeScopes.map((scope: any) => {
          const phase = projectTree?.isPhasing ? projectTree?.phases?.find((item: any) => item.id === scope.phaseId) : null;
          const scopeName = scope.name || scope.title || "Unnamed";
          return { id: scope.id, name: phase ? `${phase.name} / ${scopeName}` : scopeName };
        })
      : fetchedScopes,
    [fetchedScopes, treeMatchesProject, treeScopes],
  );
  const subtasks = useMemo(() => {
    if (!treeMatchesProject) return fetchedSubtasks;

    return treeScopes.flatMap((scope: any) =>
      (scope.tasks || []).flatMap((task: any) =>
        (task.subtasks || []).map((subtask: any) => {
          const phase = projectTree?.isPhasing ? projectTree?.phases?.find((item: any) => item.id === scope.phaseId) : null;
          return {
          id: subtask.id,
          title: subtask.title || subtask.name || "Untitled",
          progress: subtask.progress ?? 0,
          startDate: subtask.projectedStartDate || subtask.startDate || "",
          endDate: subtask.projectedEndDate || subtask.endDate || "",
          scopeId: scope.id,
          scopeName: `${phase ? `${phase.name} / ` : ""}${scope.name || scope.title || "Unnamed"}`,
        };}),
      ),
    ).filter((subtask: any) => !scopeId || String(subtask.scopeId) === String(scopeId));
  }, [fetchedSubtasks, scopeId, treeMatchesProject, treeScopes]);

  // Fetch scopes once when project changes; also reset to project's start month
  useEffect(() => {
    if (projectId && !treeMatchesProject) {
      dispatch(fetchCalendarScopes(projectId) as any);
      setScopeId(null);
      // Navigate to project's start month
      if (projectStartDate) {
        const d = new Date(projectStartDate);
        if (!isNaN(d.getTime())) {
          setMonth(d.getMonth() + 1);
          setYear(d.getFullYear());
        }
      }
    }
  }, [projectId, projectStartDate, dispatch, treeMatchesProject]);

  // Fetch subtasks whenever project/month/year/scope changes
  useEffect(() => {
    if (projectId && !treeMatchesProject) {
      dispatch(
        fetchCalendarMonth(projectId, year, month, scopeId || undefined) as any
      );
    }
  }, [projectId, year, month, scopeId, dispatch, treeMatchesProject]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setMonth(today.getMonth() + 1);
    setYear(today.getFullYear());
  };

  const handleSubtaskClick = (subtaskId: string) => {
    if (!canViewProgress) return;
    setSelectedSubtaskId(subtaskId);
    setModalOpen(true);
  };

  if (!projectId) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        Please select a project to view the calendar
      </Alert>
    );
  }

  return (
    <Card
      sx={{
        borderRadius: 2.5,
        boxShadow: "0 8px 24px rgba(15,23,42,.06)",
        border: "1px solid #CBD5E1",
        overflow: "hidden",
      }}
    >
      <Box sx={{ p: { xs: 1.25, md: 2 } }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1.5,
            gap: 2,
          }}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center"><Typography sx={{ color: "#0F172A", fontSize: 15, fontWeight: 900 }}>Delivery Calendar</Typography>{projectTree?.isPhasing && <Chip size="small" label="Phase aware" sx={{ height: 20, bgcolor: "#EDE9FE", color: "#5B21B6", fontSize: 9, fontWeight: 800 }} />}</Stack>
            <Typography sx={{ mt: 0.25, color: "#64748B", fontSize: 11 }}>Review scheduled work by month and open progress details directly from an activity.</Typography>
          </Box>
          <ScopeFilter
            scopes={scopes}
            selectedScopeId={scopeId}
            onScopeChange={setScopeId}
          />
        </Box>

        {/* Calendar Navigation */}
        <CalendarHeader
          month={month}
          year={year}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
        />

        {/* Loading */}
        {loading && !treeMatchesProject && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error */}
        {error && !treeMatchesProject && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Calendar Grid */}
        {(!loading || treeMatchesProject) && (
          <CalendarGrid
            month={month}
            year={year}
            subtasks={subtasks}
            onSubtaskClick={handleSubtaskClick}
          />
        )}
      </Box>

      {selectedSubtaskId && (
        <ProgressCalendarModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedSubtaskId(null);
          }}
          subtaskId={selectedSubtaskId}
        />
      )}
    </Card>
  );
}
