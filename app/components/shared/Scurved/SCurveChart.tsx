"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";

import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  CircularProgress,
  Chip,
  Stack,
} from "@mui/material";

import { getSCurve } from "@/app/redux/controllers/scurveController";
import { RootState } from "@/app/redux/store";

function CustomXAxisTick(props: any) {
  const { x, y, payload } = props;
  const dateStr = payload.value;

  if (!dateStr) return null;

  try {
    const date = new Date(dateStr);

    return (
      <text
        x={x}
        y={y + 12}
        textAnchor="middle"
        fill="#7D8693"
        fontSize="12px"
      >
        {date.getDate()}
      </text>
    );
  } catch {
    return null;
  }
}

export default function SCurveChart({ projectId }: any) {
  const dispatch = useDispatch<any>();

  const data =
    useSelector(
      (state: RootState) =>
        state.scurve.dataByProject[projectId]
    ) || [];

  const status =
    useSelector(
      (state: RootState) =>
        state.scurve.statusByProject[projectId]
    ) || "ON_TRACK";

  const loading = useSelector(
    (state: RootState) => state.scurve.loading
  );

  useEffect(() => {
    if (!projectId) return;
    dispatch(getSCurve(projectId));
  }, [projectId, dispatch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELAYED":
        return "#EF4444";
      case "AHEAD":
        return "#4B2E83";
      default:
        return "#10B981";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "DELAYED":
        return "rgba(239,68,68,.1)";
      case "AHEAD":
        return "rgba(75,46,131,.1)";
      default:
        return "rgba(16,185,129,.1)";
    }
  };

  // =====================================
  // CUT ACTUAL LINE AT LAST REAL UPDATE
  // (last date progress changed)
  // =====================================
  const chartData = useMemo(() => {
    if (!data?.length) return [];

    let lastActualIndex = -1;
    let previousActual: number | null = null;

    data.forEach((item: any, idx: number) => {
      const actual = Number(item.actual || 0);

      if (
        actual > 0 &&
        actual !== previousActual
      ) {
        lastActualIndex = idx;
      }

      previousActual = actual;
    });

    return data.map((item: any, idx: number) => ({
      ...item,
      actualDisplay:
        idx <= lastActualIndex
          ? item.actual
          : null,
    }));
  }, [data]);


  // =====================================
  // MONTH + WEEK DIVIDERS
  // =====================================
  const dateMetadata = useMemo(() => {
    if (!chartData.length) {
      return {
        monthLines: [],
        monthLabels: [],
        weekLines: [],
      };
    }

    const monthLines:any[] = [];
    const monthLabels:any[] = [];
    const weekLines:any[] = [];

    let lastMonth = "";
    let lastWeek = "";

    chartData.forEach(
      (item:any, index:number) => {
        const d = new Date(item.date);

        const monthKey =
          `${d.getFullYear()}-${d.getMonth()}`;

        const weekKey =
          `${d.getFullYear()}-${Math.ceil(
             d.getDate()/7
          )}`;

        if(monthKey !== lastMonth){
          monthLines.push({
            date:item.date,
            index,
          });

          lastMonth = monthKey;
        }

        if(weekKey !== lastWeek){
          weekLines.push({
            date:item.date,
            index,
          });

          lastWeek = weekKey;
        }
      }
    );

    monthLines.forEach((m,i)=>{
      const start = m.index;

      const end =
        i < monthLines.length-1
          ? monthLines[i+1].index-1
          : chartData.length-1;

      const centerIndex = Math.floor(
        (start+end)/2
      );

      monthLabels.push({
        date: chartData[centerIndex]?.date,
        label:new Date(
          m.date
        ).toLocaleString(
          "default",
          {
            month:"short",
            year:"numeric"
          }
        )
      });
    });

    return {
      monthLines,
      monthLabels,
      weekLines,
    };

  }, [chartData]);


  return (
    <Box
      sx={{
        width:"100%",
        display:"flex",
        flexDirection:"column",
        gap:2,
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{mb:1}}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight:700,
            fontSize:15,
          }}
        >
          S-Curve Progress
        </Typography>

        <Chip
          label={status}
          size="small"
          sx={{
            backgroundColor:
              getStatusBgColor(status),
            color:
              getStatusColor(status),
            border:`1.5px solid ${getStatusColor(status)}`,
            fontWeight:600,
          }}
        />
      </Stack>

      {loading && (
        <Box
          sx={{
            height:320,
            display:"flex",
            justifyContent:"center",
            alignItems:"center",
          }}
        >
          <CircularProgress
            size={40}
            sx={{color:"#4B2E83"}}
          />
        </Box>
      )}

      {!loading && (
        <Box
          sx={{
            width:"100%",
            height:350,
            background:"#FAFBFC",
            border:"1px solid #E0E4EA",
            borderRadius:"3px",
            p:2,
          }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={chartData}
              margin={{
                top:50,
                right:30,
                left:0,
                bottom:10,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E0E4EA"
                vertical={false}
              />

              {/* Month boundaries */}
              {dateMetadata.monthLines.map(
                (line:any,idx:number)=>(
                  <ReferenceLine
                    key={idx}
                    x={line.date}
                    stroke="#D1D5DB"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                )
              )}

              {/* Week boundaries */}
              {dateMetadata.weekLines.map(
                (line:any,idx:number)=>(
                  <ReferenceLine
                    key={idx}
                    x={line.date}
                    stroke="#EEF2F7"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                  />
                )
              )}

              {/* Centered month labels */}
              {dateMetadata.monthLabels.map(
                (m:any,idx:number)=>(
                  <ReferenceLine
                    key={idx}
                    x={m.date}
                    stroke="transparent"
                    label={{
                      value:m.label,
                      position:"insideTop",
                      fill:"#4B2E83",
                      fontSize:13,
                      fontWeight:700,
                      offset:-25,
                    }}
                  />
                )
              )}

              <XAxis
                dataKey="date"
                tick={<CustomXAxisTick/>}
                tickLine={false}
                axisLine={{
                  stroke:"#E0E4EA"
                }}
              />

              <YAxis
                domain={[0,100]}
                tick={{
                  fontSize:12,
                  fill:"#7D8693"
                }}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip
                formatter={(v:any)=>`${v}%`}
                labelFormatter={(label:any)=>
                  new Date(label).toLocaleDateString(
                    "en-US",
                    {
                      month:"short",
                      day:"numeric",
                      year:"numeric"
                    }
                  )
                }
                contentStyle={{
                  borderRadius:6,
                  border:"1px solid #E0E4EA"
                }}
              />

              <Legend
                iconType="line"
                wrapperStyle={{
                  paddingTop:16,
                  fontSize:13,
                }}
              />

              <Line
                type="monotone"
                dataKey="planned"
                stroke="#3B82F6"
                strokeWidth={2.5}
                dot={false}
                name="Planned Progress"
              />

              {/* Stops exactly at last progress update */}
              <Line
                type="monotone"
                dataKey="actualDisplay"
                stroke="#10B981"
                strokeWidth={2.5}
                dot={false}
                connectNulls={false}
                name="Actual Progress"
              />

            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}

      <Stack
        direction="row"
        spacing={3}
        sx={{
          mt:1,
          fontSize:12,
          color:"#7D8693"
        }}
      >
        <Box
          sx={{
            display:"flex",
            alignItems:"center",
            gap:1,
          }}
        >
          <Box
            sx={{
              width:20,
              borderBottom:
                "2px dashed #D1D5DB"
            }}
          />
          <span>Month</span>
        </Box>

        <Box
          sx={{
            display:"flex",
            alignItems:"center",
            gap:1,
          }}
        >
          <Box
            sx={{
              width:20,
              borderBottom:
                "1px dashed #EEF2F7"
            }}
          />
          <span>Week</span>
        </Box>
      </Stack>
    </Box>
  );
}