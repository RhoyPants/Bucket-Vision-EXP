"use client";

import { useState } from "react";
import {
  Box,
  Card,
  Typography,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import PieChartOutlineIcon from "@mui/icons-material/PieChartOutline";
import { formatBudgetShort } from "@/app/utils/formatters";

interface Scope {
  id: string;
  name: string;
  budgetAllocated?: number;
  budgetPercent?: number;
  progress?: number;
}

interface Props {
  scopes: Scope[];
  currentScopeId: string | null;
  onChange: (id: string) => void;
}

export default function ScopeSelector({
  scopes,
  currentScopeId,
  onChange,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("sm"));

  const selected =
    scopes.find((c) => c.id === currentScopeId) || scopes[0];

  const progress = selected?.progress ?? 0;

  const progressColor =
    progress < 40 ? "#f59e0b" : progress < 90 ? "#3b82f6" : "#22c55e";

  const handleSelect = (id: string) => {
    onChange(id);
    setExpanded(false);
  };

  // Calculated widths for expanding card - responsive max width
  const OPTION_CARD_WIDTH = 170;
  const BASE_CARD_WIDTH = 260;
  
  // Responsive max width based on screen size
  const MAX_DRAWER_WIDTH = mobile ? 500 : 750;

  const expandedWidth = Math.min(
    BASE_CARD_WIDTH +
      scopes.length * OPTION_CARD_WIDTH +
      (scopes.length - 1) * 16,
    MAX_DRAWER_WIDTH,
  );

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 1, width: "100%" }}
    >
      {/* Main Cabinet Drawer */}
      <Box
        sx={{
          position: "relative",
          display: "flex",
          flexWrap: "nowrap",
          alignItems: "flex-start",
          width: "100%",
          overflow: "visible",
        }}
      >
        {/* CABINET DRAWER WRAPPER */}
        <Box
          sx={{
            width: expanded ? expandedWidth : BASE_CARD_WIDTH,
            minWidth: expanded ? expandedWidth : BASE_CARD_WIDTH,
            flexShrink: 0,
            position: "relative",
            zIndex: 3,
            transition: "transform .35s cubic-bezier(0.4,0,0.2,1)",
            transformOrigin: "left center",
            overflow: "hidden",
          }}
        >
          {/* CABINET FRONT - Main Scope KPI Card */}
          <Card
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
            sx={{
              width: expanded ? expandedWidth : BASE_CARD_WIDTH,
              borderRadius: "12px",
              overflow: "hidden",
              cursor: "pointer",
              border: "1px solid #e0e2e7",
              position: "relative",
              zIndex: 3,
              ...(expanded && {
                "&::after": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  right: -4,
                  width: 8,
                  height: "100%",
                  background: "#fff",
                  zIndex: 4,
                },
              }),
            }}
          >
            {/* COMPACT HEADER */}
            {/* Scope Name Pill - Responsive with Ellipsis */}
            <Box
              sx={{
                minWidth: 0,
                alignItems: "center",
                gap: 0.6,
              }}
            >
              <Box
                sx={{
                  px: { xs: 1, sm: 1.2, md: 1.4 },
                  py: { xs: 0.5, sm: 0.6, md: 0.7 },
                  background: "#fff",
                  border: "1px solid #e5e0f0",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: "12px", sm: "13px", md: "14px" },
                    fontWeight: 700,
                    color: "#210e64",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {selected?.name || "Select Scope"}
                </Typography>
              </Box>

              {/* FLEX ROW: KPI + Drawer Side-by-Side */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "stretch",
                  gap: 0,
                }}
              >
                {/* COMPACT KPI METRICS GRID */}
                <Box
                  sx={{
                    width: BASE_CARD_WIDTH,
                    minWidth: BASE_CARD_WIDTH,
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "0.8fr 1fr",
                      sm: "0.75fr 1.25fr",
                      md: "0.7fr 1.3fr",
                    },
                    gap: { xs: 1, sm: 1.2, md: 1.4 },
                    p: { xs: 1.2, sm: 1.4, md: 7 },
                    pl: { xs: 1.2, sm: 1.4, md: 3 },
                    // alignItems: "center",
                  }}
                >
                  {/* LEFT: Compact Circular Progress */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 0.4,
                    }}
                  >
                    <Box
                      sx={{
                        position: "relative",
                        width: { xs: "56px", sm: "64px", md: "72px" },
                        height: { xs: "56px", sm: "64px", md: "72px" },
                      }}
                    >
                      {/* Background Ring */}
                      <CircularProgress
                        variant="determinate"
                        value={100}
                        size={mobile ? 56 : 72}
                        thickness={3.5}
                        sx={{
                          color: "#e8e8ed",
                          position: "absolute",
                        }}
                      />

                      {/* Progress Ring */}
                      <CircularProgress
                        variant="determinate"
                        value={progress}
                        size={mobile ? 56 : 72}
                        thickness={3.5}
                        sx={{
                          color: progressColor,
                          position: "absolute",
                        }}
                      />

                      {/* Center Content */}
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "column",
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 800,
                            fontSize: { xs: "16px", sm: "17px", md: "18px" },
                            color: "#210e64",
                            lineHeight: 1,
                          }}
                        >
                          {Math.round(progress)}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "8px",
                            fontWeight: 700,
                            color: "#999",
                            mt: 0.2,
                          }}
                        >
                          %
                        </Typography>
                      </Box>
                    </Box>

                    <Typography
                      sx={{
                        fontSize: { xs: "9px", sm: "10px", md: "10px" },
                        fontWeight: 700,
                        color: "#888",
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                      }}
                    >
                      Done
                    </Typography>
                  </Box>

                  {/* RIGHT: Compact KPI Metrics */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.8,
                    }}
                  >
                    {/* Budget KPI */}
                    <Box
                      sx={{
                        display: "flex",
                        gap: 0.6,
                        alignItems: "flex-start",
                      }}
                    >
                      <AccountBalanceWalletOutlinedIcon
                        sx={{
                          color: "#1e40af",
                          fontSize: { xs: "16px", sm: "17px", md: "18px" },
                          mt: 0.2,
                          flexShrink: 0,
                        }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: { xs: "8px", sm: "9px", md: "9px" },
                            fontWeight: 700,
                            color: "#888",
                            textTransform: "uppercase",
                            letterSpacing: "0.3px",
                            mb: 0.2,
                          }}
                        >
                          Budget
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: 800,
                            fontSize: { xs: "13px", sm: "14px", md: "15px" },
                            color: "#1e40af",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {selected?.budgetAllocated?.toLocaleString() || "0"}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Weight KPI */}
                    <Box
                      sx={{
                        display: "flex",
                        gap: 0.6,
                        alignItems: "flex-start",
                      }}
                    >
                      <PieChartOutlineIcon
                        sx={{
                          color: "#0369a1",
                          fontSize: { xs: "16px", sm: "17px", md: "18px" },
                          mt: 0.2,
                          flexShrink: 0,
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          sx={{
                            fontSize: { xs: "8px", sm: "9px", md: "9px" },
                            fontWeight: 700,
                            color: "#888",
                            textTransform: "uppercase",
                            letterSpacing: "0.3px",
                            mb: 0.2,
                          }}
                        >
                          Weight
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: 800,
                            fontSize: { xs: "13px", sm: "14px", md: "15px" },
                            color: "#0369a1",
                          }}
                        >
                          {selected?.budgetPercent?.toFixed(2) || "0.00"}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* DRAWER PANEL - Connected Pull-Out Tray */}
                {expanded && (
                  <Box
                    onMouseEnter={() => setExpanded(true)}
                    onMouseLeave={() => setExpanded(false)}
                    sx={{
                      position: "static",
                      flex: 1,
                      minWidth: 0,
                      maxWidth: expandedWidth - BASE_CARD_WIDTH,
                      marginLeft: 0,
                      borderRadius: "0",
                      boxShadow: "none",
                      background: "#f2f3fc",
                      border: "none",
                      borderLeft: "1px solid #ECEAF5",
                      p: { xs: 1.2, sm: 1.4, md: 1.6 },
                      zIndex: 2,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-start",
                      animation: "drawerPull 0.35s ease",
                      "@keyframes drawerPull": {
                        from: {
                          opacity: 0,
                          transform: "translateX(-25px)",
                        },
                        to: {
                          opacity: 1,
                          transform: "translateX(0)",
                        },
                      },
                    }}
                  >
                    {/* DRAWER LABEL - Tactile affordance */}
                    <Typography
                      sx={{
                        fontSize: { xs: "9px", sm: "10px" },
                        fontWeight: 700,
                        color: "#999",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        mb: 1.2,
                        pl: 0.5,
                      }}
                    >
                      Select Scope
                    </Typography>

                    {/* DRAWER CONTENTS - Horizontal Scrollable Card Items */}
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "nowrap",
                        gap: { xs: 1, sm: 1.2, md: 1.4 },
                        overflowX: "scroll",
                        overflowY: "hidden",
                        pr: 1,
                        pb: 1,
                        scrollBehavior: "smooth",
                        alignItems: "center",
                        flex: 1,
                        "&::-webkit-scrollbar": {
                          height: 8,
                        },
                        "&::-webkit-scrollbar-track": {
                          background: "#EEF1F7",
                          borderRadius: 8,
                        },
                        "&::-webkit-scrollbar-thumb": {
                          background: "#C8C2E8",
                          borderRadius: 8,
                        },
                      }}
                    >
                      {scopes
                        .filter((c) => c.id !== currentScopeId)
                        .map((cat, idx) => {
                          const active = cat.id === currentScopeId;
                          const catProgress = cat.progress ?? 0;
                          const catProgressColor =
                            catProgress < 40
                              ? "#f59e0b"
                              : catProgress < 90
                                ? "#3b82f6"
                                : "#22c55e";

                          return (
                            <Box
                              key={cat.id}
                              sx={{
                                flex: "0 0 auto",
                                animation: `itemSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.05}s both`,
                                "@keyframes itemSlideIn": {
                                  from: {
                                    opacity: 0,
                                    transform: "translateY(12px)",
                                  },
                                  to: {
                                    opacity: 1,
                                    transform: "translateY(0)",
                                  },
                                },
                              }}
                            >
                              <Card
                                onClick={() => handleSelect(cat.id)}
                                sx={{
                                  p: { xs: 1, sm: 1.2, md: 1.3 },
                                  cursor: "pointer",
                                  borderRadius: "10px",
                                  border: active
                                    ? "1.5px solid #210e64"
                                    : "1px solid #e0e2e7",
                                  background: active
                                    ? "linear-gradient(135deg, #f7f5ff 0%, #efe9ff 100%)"
                                    : "#fff",
                                  transition:
                                    "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                  minWidth: OPTION_CARD_WIDTH,
                                  maxWidth: OPTION_CARD_WIDTH,
                                  height: "auto",
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "center",
                                  boxShadow: active
                                    ? "0 4px 12px rgba(33,14,100,.12)"
                                    : "0 1px 3px rgba(0,0,0,.03)",
                                  "&:hover": {
                                    borderColor: active ? "#210e64" : "#b8acdb",
                                    boxShadow: "0 0 12px rgba(33,14,100,.15)",
                                  },
                                }}
                              >
                                {/* Scope Header with Active Indicator */}
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    gap: 0.4,
                                    mb: 0.8,
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      fontWeight: 700,
                                      fontSize: { xs: "12px", sm: "13px" },
                                      color: "#210e64",
                                      flex: 1,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {cat.name}
                                  </Typography>

                                  {active && (
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "18px",
                                        height: "18px",
                                        borderRadius: "50%",
                                        background: "#210e64",
                                        color: "#fff",
                                        fontSize: "10px",
                                        fontWeight: 900,
                                        flexShrink: 0,
                                        boxShadow:
                                          "0 2px 6px rgba(33,14,100,.25)",
                                      }}
                                    >
                                      Ã¢Å“â€œ
                                    </Box>
                                  )}
                                </Box>

                                {/* Mini Circular Progress */}
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 0.4,
                                    mb: 1,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      position: "relative",
                                      width: "44px",
                                      height: "44px",
                                    }}
                                  >
                                    <CircularProgress
                                      variant="determinate"
                                      value={100}
                                      size={44}
                                      thickness={3.5}
                                      sx={{
                                        color: "#e8e8ed",
                                        position: "absolute",
                                      }}
                                    />
                                    <CircularProgress
                                      variant="determinate"
                                      value={catProgress}
                                      size={44}
                                      thickness={3.5}
                                      sx={{
                                        color: catProgressColor,
                                        position: "absolute",
                                      }}
                                    />
                                    <Box
                                      sx={{
                                        position: "absolute",
                                        inset: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <Typography
                                        sx={{
                                          fontWeight: 800,
                                          fontSize: "12px",
                                          color: "#210e64",
                                        }}
                                      >
                                        {Math.round(catProgress)}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>

                                {/* Compact Metrics */}
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 0.4,
                                  }}
                                >
                                  {cat.budgetAllocated && (
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.4,
                                      }}
                                    >
                                      <AccountBalanceWalletOutlinedIcon
                                        sx={{
                                          color: "#1e40af",
                                          fontSize: "12px",
                                          flexShrink: 0,
                                        }}
                                      />
                                      <Typography
                                        sx={{
                                          fontSize: "10px",
                                          color: "#1e40af",
                                          fontWeight: 700,
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        
                                        {formatBudgetShort(cat.budgetAllocated)}
                                      </Typography>
                                    </Box>
                                  )}

                                  {cat.budgetPercent && (
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.4,
                                      }}
                                    >
                                      <PieChartOutlineIcon
                                        sx={{
                                          color: "#0369a1",
                                          fontSize: "12px",
                                          flexShrink: 0,
                                        }}
                                      />
                                      <Typography
                                        sx={{
                                          fontSize: "10px",
                                          color: "#0369a1",
                                          fontWeight: 700,
                                        }}
                                      >
                                        {cat.budgetPercent.toFixed(1)}%
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </Card>
                            </Box>
                          );
                        })}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
