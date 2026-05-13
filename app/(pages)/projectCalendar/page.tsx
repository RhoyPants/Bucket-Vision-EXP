"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Box, Container, CircularProgress, Alert } from "@mui/material";
import { Suspense } from "react";
import { AppDispatch, RootState } from "@/app/redux/store";
import {
  fetchCalendarScopes,
  fetchCalendarMonth,
} from "@/app/redux/controllers/projectCalendarController";
import {
  setSelectedScope,
  setMonth,
  setProjectId,
} from "@/app/redux/slices/projectCalendarSlice";
import CalendarHeader from "@/app/components/shared/calendar/CalendarHeader";
import CalendarGrid from "@/app/components/shared/calendar/CalendarGrid";
import ScopeFilter from "@/app/components/shared/calendar/ScopeFilter";
import ProgressCalendarModal from "@/app/components/shared/modals/ProgressCalendarModal";

function ProjectCalendarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  // ✅ Get projectId from URL
  const projectId = searchParams.get("projectId") || "";

  // ✅ Redux state
  const {
    currentMonth,
    currentYear,
    scopes,
    selectedScopeId,
    subtasks,
    loading,
    error,
  } = useSelector((state: RootState) => state.projectCalendar);

  // ✅ Local state for modal
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // ✅ Initialize calendar on mount
  useEffect(() => {
    if (projectId) {
      dispatch(setProjectId(projectId));
      // Fetch scopes
      dispatch(fetchCalendarScopes(projectId) as any);
      // Fetch calendar data for current month
      dispatch(
        fetchCalendarMonth(
          projectId,
          currentYear,
          currentMonth,
          selectedScopeId || undefined
        ) as any
      );
    }
  }, [projectId, dispatch]);

  // ✅ Fetch when month changes
  useEffect(() => {
    if (projectId) {
      dispatch(
        fetchCalendarMonth(
          projectId,
          currentYear,
          currentMonth,
          selectedScopeId || undefined
        ) as any
      );
    }
  }, [currentMonth, currentYear, selectedScopeId, projectId, dispatch]);

  // ✅ Month navigation handlers
  const handlePrevMonth = useCallback(() => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    dispatch(setMonth({ month: newMonth, year: newYear }));
  }, [currentMonth, currentYear, dispatch]);

  const handleNextMonth = useCallback(() => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    dispatch(setMonth({ month: newMonth, year: newYear }));
  }, [currentMonth, currentYear, dispatch]);

  const handleToday = useCallback(() => {
    const today = new Date();
    dispatch(setMonth({ month: today.getMonth() + 1, year: today.getFullYear() }));
  }, [dispatch]);

  // ✅ Subtask click handler
  const handleSubtaskClick = (subtaskId: string) => {
    setSelectedSubtaskId(subtaskId);
    setModalOpen(true);
  };

  // ✅ Modal handlers
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedSubtaskId(null);
  };

  if (!projectId) {
    return (
      <Alert severity="error">
        Project ID not found. Please select a project.
      </Alert>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <CalendarHeader
        month={currentMonth}
        year={currentYear}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />

      {/* Scope Filter */}
      <Box sx={{ mb: 2 }}>
        <ScopeFilter
          scopes={scopes}
          selectedScopeId={selectedScopeId}
          onScopeChange={(scopeId) => dispatch(setSelectedScope(scopeId))}
          loading={loading && scopes.length === 0}
        />
      </Box>

      {/* Loading state */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Calendar Grid */}
      {!loading && (
        <CalendarGrid
          month={currentMonth}
          year={currentYear}
          subtasks={subtasks}
          onSubtaskClick={handleSubtaskClick}
        />
      )}

      {/* Progress Modal */}
      {selectedSubtaskId && (
        <ProgressCalendarModal
          open={modalOpen}
          onClose={handleCloseModal}
          subtaskId={selectedSubtaskId}
          onSuccess={handleCloseModal}
        />
      )}
    </Container>
  );
}

export default function ProjectCalendarPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <ProjectCalendarContent />
    </Suspense>
  );
}
