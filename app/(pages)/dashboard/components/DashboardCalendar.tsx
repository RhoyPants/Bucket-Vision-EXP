"use client";

import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import {
  fetchCalendarScopes,
  fetchCalendarMonth,
} from "@/app/redux/controllers/projectCalendarController";
import {
  Box,
  Card,
  CircularProgress,
  Alert,
} from "@mui/material";
import CalendarHeader from "@/app/components/shared/calendar/CalendarHeader";
import CalendarGrid from "@/app/components/shared/calendar/CalendarGrid";
import ScopeFilter from "@/app/components/shared/calendar/ScopeFilter";
import ProgressCalendarModal from "@/app/components/shared/modals/ProgressCalendarModal";

interface DashboardCalendarProps {
  projectId: string | null;
  projectStartDate?: string | null; // used to auto-navigate to the project's month
}

export default function DashboardCalendar({ projectId, projectStartDate }: DashboardCalendarProps) {
  const dispatch = useAppDispatch();

  // Initialize to project's start month if provided, otherwise today
  const getInitialDate = () => {
    if (projectStartDate) {
      const d = new Date(projectStartDate);
      if (!isNaN(d.getTime())) return { month: d.getMonth() + 1, year: d.getFullYear() };
    }
    return { month: new Date().getMonth() + 1, year: new Date().getFullYear() };
  };

  const initial = getInitialDate();
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);
  const [scopeId, setScopeId] = useState<string | null>(null);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { loading, error, scopes, subtasks } =
    useAppSelector((state) => state.projectCalendar);

  // Fetch scopes once when project changes; also reset to project's start month
  useEffect(() => {
    if (projectId) {
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
  }, [projectId, projectStartDate, dispatch]);

  // Fetch subtasks whenever project/month/year/scope changes
  useEffect(() => {
    if (projectId) {
      dispatch(
        fetchCalendarMonth(projectId, year, month, scopeId || undefined) as any
      );
    }
  }, [projectId, year, month, scopeId, dispatch]);

  const handlePrevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const handleNextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const handleToday = () => {
    const today = new Date();
    setMonth(today.getMonth() + 1);
    setYear(today.getFullYear());
  };

  const handleSubtaskClick = (subtaskId: string) => {
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
        mb: 3,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        border: "1px solid #e5e7eb",
      }}
    >
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
            Subtask Calendar
          </h3>
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
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Calendar Grid */}
        {!loading && (
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

