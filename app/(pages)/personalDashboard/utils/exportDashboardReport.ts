import type { Cell, Row, Worksheet } from "exceljs";
import type { DashboardReportTable } from "@/app/api-service/personalDashboardService";

export type TimelineExportRow = {
  type: "project" | "scope" | "task" | "subtask";
  key: string;
  itemNo: string;
  title: string;
  progress: number;
  amount: number;
  budgetPercent: number;
  projectedStartDate?: string | null;
  projectedEndDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  progressLogs?: { date?: string | null; dailyPercent?: number | null }[];
};

type ExportOptions = {
  reportTable: DashboardReportTable;
  timelineRows?: TimelineExportRow[];
  startDate?: string | null;
  showProjected?: boolean;
  showActual?: boolean;
  showProjectedPercent?: boolean;
  showActualPercent?: boolean;
  sheets?: "all" | "timeline" | "report";
};

const COLORS = {
  dark: "FF3F3F3F",
  navy: "FF172B55",
  white: "FFFFFFFF",
  grid: "FFD1D5DB",
  projected: "FFB9D8EF",
  actual: "FFF5C6A7",
  actualText: "FFDC2626",
  green: "FF047857",
  progressInput: "FFC6E0B4",
  projectLight: "FFE2E8F0",
  scopeLight: "FFB4C7E7",
  taskLight: "FFE0F2FE",
  headerLight: "FFEAF2F8",
  light: "FFF8FAFC",
};

const dateKey = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.slice(0, 10) : date.toISOString().slice(0, 10);
};

const inRange = (date: string, start?: string | null, end?: string | null) => {
  const current = dateKey(date);
  return Boolean(current && dateKey(start) && dateKey(end) && current >= dateKey(start) && current <= dateKey(end));
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

const thinBorder = {
  top: { style: "thin" as const, color: { argb: COLORS.grid } },
  left: { style: "thin" as const, color: { argb: COLORS.grid } },
  bottom: { style: "thin" as const, color: { argb: COLORS.grid } },
  right: { style: "thin" as const, color: { argb: COLORS.grid } },
};

const styleCells = (row: Row, from: number, to: number, fill?: string, color = "FF111827", bold = false) => {
  for (let column = from; column <= to; column += 1) {
    const cell = row.getCell(column);
    cell.border = thinBorder;
    cell.alignment = { vertical: "middle", horizontal: column === 2 ? "left" : "center" };
    cell.font = { name: "Arial", size: 9, bold, color: { argb: color } };
    if (fill) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
  }
};

const setNumeric = (cell: Cell, value: number, format: string) => {
  cell.value = Number.isFinite(value) ? value : 0;
  cell.numFmt = format;
};

const setReportValue = (cell: Cell, value: number, format: string) => {
  if (format === "percent") {
    setNumeric(cell, value / 100, "0.00%");
    return;
  }
  setNumeric(cell, value, format === "currency" ? "#,##0.00" : "0.00");
};

const projectedValue = (row: TimelineExportRow, date: string, columns: DashboardReportTable["columns"]) => {
  if (!inRange(date, row.projectedStartDate, row.projectedEndDate)) return null;
  const days = columns.filter((column) => inRange(column.date, row.projectedStartDate, row.projectedEndDate)).length;
  return days ? row.budgetPercent / days / 100 : null;
};

const actualValue = (row: TimelineExportRow, date: string) => {
  const log = row.progressLogs?.find((item) => dateKey(item.date) === dateKey(date));
  return log ? (Number(log.dailyPercent ?? 0) * (row.budgetPercent / 100)) / 100 : null;
};

const configureTimelineColumns = (sheet: Worksheet, count: number) => {
  [10, 38, 12, 16, 10, 14].forEach((width, index) => { sheet.getColumn(index + 1).width = width; });
  for (let index = 0; index < count; index += 1) sheet.getColumn(index + 7).width = 5;
};

const addTimelineSheet = (sheet: Worksheet, options: ExportOptions) => {
  const { reportTable, timelineRows = [] } = options;
  const lastColumn = 6 + reportTable.columns.length;
  configureTimelineColumns(sheet, reportTable.columns.length);
  sheet.views = [{ state: "frozen", xSplit: 6, ySplit: 4 }];

  sheet.mergeCells(1, 1, 1, 6);
  sheet.getCell(1, 1).value = `START DATE:   ${formatDate(options.startDate)}`;
  const monthGroups: { label: string; start: number; end: number }[] = [];
  reportTable.columns.forEach((column, index) => {
    const date = new Date(`${column.date}T00:00:00`);
    const label = Number.isNaN(date.getTime()) ? column.date : date.toLocaleDateString("en-US", { month: "long" }).toUpperCase();
    const current = monthGroups[monthGroups.length - 1];
    if (current?.label === label) current.end = index + 7;
    else monthGroups.push({ label, start: index + 7, end: index + 7 });
  });
  monthGroups.forEach((group) => {
    if (group.end > group.start) sheet.mergeCells(1, group.start, 1, group.end);
    sheet.getCell(1, group.start).value = group.label;
  });
  styleCells(sheet.getRow(1), 1, lastColumn, COLORS.white, "FF111827", true);

  ["ITEM NO.", "SCOPE OF WORK", "PROGRESS", "AMOUNT", "%W", "COLUMN 1"].forEach((value, index) => {
    sheet.getCell(2, index + 1).value = value;
  });
  let timelineWeekStart = 7;
  reportTable.weekGroups.forEach((week) => {
    const start = timelineWeekStart;
    const end = start + week.colspan - 1;
    if (end > start) sheet.mergeCells(2, start, 2, end);
    sheet.getCell(2, start).value = week.label;
    timelineWeekStart = end + 1;
  });
  styleCells(sheet.getRow(2), 1, lastColumn, COLORS.dark, COLORS.white, true);

  reportTable.columns.forEach((column, index) => {
    const date = new Date(`${column.date}T00:00:00`);
    sheet.getCell(3, index + 7).value = Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
    sheet.getCell(4, index + 7).value = Number.isNaN(date.getTime()) ? column.label : date.getDate();
  });
  styleCells(sheet.getRow(3), 1, lastColumn, COLORS.dark, COLORS.white, true);
  styleCells(sheet.getRow(4), 1, lastColumn, COLORS.dark, COLORS.white, true);

  timelineRows.forEach((item) => {
    if (item.type !== "subtask") {
      const row = sheet.addRow([item.itemNo, item.title]);
      const fill = item.type === "task" ? COLORS.navy : COLORS.dark;
      setNumeric(row.getCell(3), item.progress / 100, "0.00%");
      setNumeric(row.getCell(4), item.amount, "#,##0.00");
      setNumeric(row.getCell(5), item.budgetPercent / 100, "0.00%");
      styleCells(row, 1, lastColumn, fill, COLORS.white, true);
      return;
    }

    if (options.showProjected !== false) {
      const row = sheet.addRow([item.itemNo, item.title]);
      setNumeric(row.getCell(3), item.progress / 100, "0.00%");
      setNumeric(row.getCell(4), item.amount, "#,##0.00");
      setNumeric(row.getCell(5), item.budgetPercent / 100, "0.00%");
      row.getCell(6).value = "PROJECTED";
      styleCells(row, 1, lastColumn, COLORS.white, "FF111827", false);
      reportTable.columns.forEach((column, index) => {
        const value = projectedValue(item, column.date, reportTable.columns);
        if (value === null) return;
        const cell = row.getCell(index + 7);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.projected } };
        if (options.showProjectedPercent) setNumeric(cell, value, "0.00%");
      });
    }
    if (options.showActual !== false) {
      const row = sheet.addRow(["", "", "", "", (item.budgetPercent * (item.progress / 100)) / 100, "ACTUAL"]);
      row.getCell(5).numFmt = "0.00%";
      row.getCell(6).font = { name: "Arial", size: 9, bold: true, color: { argb: COLORS.actualText } };
      styleCells(row, 1, lastColumn, COLORS.white, "FF111827", false);
      reportTable.columns.forEach((column, index) => {
        const value = actualValue(item, column.date);
        if (value === null) return;
        const cell = row.getCell(index + 7);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.actual } };
        if (options.showActualPercent) setNumeric(cell, value, "0.00%");
      });
    }
  });
  sheet.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: lastColumn } };
};

const addReportSheet = (sheet: Worksheet, reportTable: DashboardReportTable) => {
  const lastColumn = reportTable.columns.length + 1;
  sheet.getColumn(1).width = 30;
  reportTable.columns.forEach((_, index) => { sheet.getColumn(index + 2).width = 11; });
  sheet.views = [{ state: "frozen", xSplit: 1, ySplit: 2 }];

  const header = sheet.addRow(["", ...reportTable.columns.map((column) => column.label)]);
  styleCells(header, 1, lastColumn, COLORS.white, "FF111827", true);
  const weeks = sheet.addRow([""]);
  let reportWeekStart = 2;
  const weekLayouts = reportTable.weekGroups.map((week) => {
    const start = reportWeekStart;
    const end = start + week.colspan - 1;
    reportWeekStart = end + 1;
    return { week, start, end };
  });
  weekLayouts.forEach(({ week, start, end }) => {
    if (end > start) sheet.mergeCells(2, start, 2, end);
    weeks.getCell(start).value = week.label.toUpperCase();
  });
  styleCells(weeks, 1, lastColumn, COLORS.dark, COLORS.white, true);

  reportTable.summaryRows.forEach((summary) => {
    const byWeek = new Map(summary.values.map((value) => [value.weekNumber, value]));
    const row = sheet.addRow([summary.label]);
    weekLayouts.forEach(({ week, start, end }) => {
      if (end > start) sheet.mergeCells(row.number, start, row.number, end);
      const value = byWeek.get(week.weekNumber)?.value;
      if (value !== null && value !== undefined) setReportValue(row.getCell(start), value, summary.format);
    });
    styleCells(row, 1, lastColumn, COLORS.light, summary.key.toLowerCase().includes("actual") ? COLORS.green : "FF111827", true);
  });
  sheet.addRow([]).height = 8;
  reportTable.detailRows.forEach((detail) => {
    const byColumn = new Map(detail.values.map((value) => [value.columnIndex, value]));
    const row = sheet.addRow([detail.label]);
    const isVariance = detail.key.toLowerCase().includes("variance");
    styleCells(row, 1, lastColumn, COLORS.white, "FF111827", false);
    reportTable.columns.forEach((column, index) => {
      const value = byColumn.get(column.index)?.value;
      if (value !== null && value !== undefined) {
        const cell = row.getCell(index + 2);
        setReportValue(cell, value, detail.format);
        if (isVariance) {
          cell.font = {
            name: "Arial",
            size: 9,
            color: { argb: value < 0 ? COLORS.actualText : COLORS.green },
          };
        }
      }
    });
    row.getCell(1).font = { name: "Arial", size: 9, bold: true, color: { argb: "FF111827" } };
  });
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: lastColumn } };
};

const addProgressTimesheet = (sheet: Worksheet, options: ExportOptions) => {
  const { reportTable, timelineRows = [] } = options;
  const lastColumn = reportTable.columns.length + 3;
  sheet.getColumn(1).width = 12;
  sheet.getColumn(2).width = 52;
  sheet.getColumn(3).width = 13;
  reportTable.columns.forEach((_, index) => { sheet.getColumn(index + 4).width = 7; });
  sheet.views = [{ state: "frozen", xSplit: 3, ySplit: 3 }];

  sheet.mergeCells(1, 1, 3, 1);
  sheet.mergeCells(1, 2, 3, 2);
  sheet.mergeCells(1, 3, 3, 3);
  sheet.getCell(1, 1).value = "ITEM NO.";
  sheet.getCell(1, 2).value = "SCOPE OF WORK";
  sheet.getCell(1, 3).value = "PROGRESS";

  const monthGroups: { label: string; start: number; end: number }[] = [];
  reportTable.columns.forEach((column, index) => {
    const date = new Date(`${column.date}T00:00:00`);
    const label = Number.isNaN(date.getTime()) ? column.date : date.toLocaleDateString("en-US", { month: "long" }).toUpperCase();
    const current = monthGroups[monthGroups.length - 1];
    if (current?.label === label) current.end = index + 4;
    else monthGroups.push({ label, start: index + 4, end: index + 4 });
  });
  monthGroups.forEach((group) => {
    if (group.end > group.start) sheet.mergeCells(1, group.start, 1, group.end);
    sheet.getCell(1, group.start).value = group.label;
  });

  reportTable.columns.forEach((column, index) => {
    const date = new Date(`${column.date}T00:00:00`);
    const columnNumber = index + 4;
    sheet.getCell(2, columnNumber).value = Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
    sheet.getCell(3, columnNumber).value = Number.isNaN(date.getTime()) ? column.label : date.getDate();
  });
  [1, 2, 3].forEach((rowNumber) => styleCells(sheet.getRow(rowNumber), 1, lastColumn, COLORS.headerLight, "FF1E3A5F", true));
  sheet.getRow(1).height = 22;

  timelineRows.forEach((item) => {
    const row = sheet.addRow([item.itemNo, item.title]);
    if (item.type !== "subtask") {
      const fill = item.type === "task" ? COLORS.taskLight : item.type === "scope" ? COLORS.scopeLight : COLORS.projectLight;
      styleCells(row, 1, lastColumn, fill, "FF1E3A5F", true);
      if (item.type !== "project") setNumeric(row.getCell(3), item.progress / 100, "0.00%");
      return;
    }

    setNumeric(row.getCell(3), item.progress / 100, "0.00%");
    styleCells(row, 1, lastColumn, COLORS.white, "FF111827", false);
    reportTable.columns.forEach((column, index) => {
      // The displayed ACTUAL row is the single source of truth for this sheet.
      const value = actualValue(item, column.date);
      if (value === null) return;
      const cell = row.getCell(index + 4);
      setNumeric(cell, value, "0.00%");
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.progressInput } };
      cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF000000" } };
    });
  });

  sheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: lastColumn } };
  sheet.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
};

export async function exportDashboardReport(options: ExportOptions) {
  const browserBundle = await import("exceljs/dist/exceljs.min.js");
  const ExcelJS = browserBundle.default ?? browserBundle;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Bucket Vision";
  workbook.created = new Date();

  if (options.sheets !== "report" && options.timelineRows?.length) {
    addTimelineSheet(workbook.addWorksheet("Projected vs Actual"), options);
    addProgressTimesheet(workbook.addWorksheet("Progress Timesheet"), options);
  }
  if (options.sheets !== "timeline") {
    addReportSheet(workbook.addWorksheet("Report Table"), options.reportTable);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const link = document.createElement("a");
  const projectName = options.reportTable.project?.name || "project-report";
  link.href = URL.createObjectURL(blob);
  link.download = `${projectName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}-report.xlsx`;
  link.click();
  URL.revokeObjectURL(link.href);
}
