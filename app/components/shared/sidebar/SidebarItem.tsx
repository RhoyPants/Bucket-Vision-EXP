"use client";

import { Box, Tooltip, Typography } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";

export default function SidebarItem({
  label,
  href,
  badgeCount,
  icon,
  collapsed = false,
}: {
  label: string;
  href: string;
  badgeCount?: number;
  icon?: ReactNode;
  collapsed?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const active = pathname === href;

  const item = (
    <Box
      onClick={() => router.push(href)}
      sx={{
        position: "relative",
        height: "48px",
        px: collapsed ? "4px" : "16px",
        mb: "8px",
        borderRadius: "12px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        backgroundColor: active ? "#1F2A6B" : "transparent",
        color: "#F8FAFC",
        transition: "background-color 0.2s ease, box-shadow 0.2s ease",
        boxShadow: active ? "0 0 0 1px rgba(255,255,255,.05)" : "none",

        "&:hover": {
          backgroundColor: "#18225B",
        },
      }}
    >
      {icon ? (
        <Box
          sx={{
            width: 20,
            height: 20,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            mr: collapsed ? 0 : "12px",
            color: "#F8FAFC",
            opacity: 1,
            "& .MuiSvgIcon-root": {
              fontSize: 20,
            },
          }}
        >
          {icon}
        </Box>
      ) : null}

      <Typography
        fontSize="15px"
        fontWeight={500}
        sx={{
          display: collapsed ? "none" : "block",
          color: "inherit",
          fontFamily: "var(--font-ftsterling)",
          lineHeight: 1,
        }}
      >
        {label}
      </Typography>

      {!!badgeCount && badgeCount > 0 && (
        <Box
          sx={{
            position: "absolute",
            top: collapsed ? 8 : "50%",
            transform: collapsed ? "none" : "translateY(-50%)",
            right: collapsed ? 6 : 12,
            minWidth: 16,
            height: 16,
            px: 0.5,
            borderRadius: "50%",
            backgroundColor: "#ef4444",
            color: "#fff",
            fontSize: "10px",
            lineHeight: "16px",
            fontWeight: 700,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {badgeCount > 99 ? "99+" : badgeCount}
        </Box>
      )}
    </Box>
  );

  if (collapsed) {
    return (
      <Tooltip title={label} placement="right" arrow>
        {item}
      </Tooltip>
    );
  }

  return item;
}
