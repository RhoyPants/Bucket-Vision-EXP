"use client";

import { Box, Typography } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";

export default function SidebarItem({
  label,
  href,
  badgeCount,
}: {
  label: string;
  href: string;
  badgeCount?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const active = pathname === href;

  return (
    <Box
      onClick={() => router.push(href)}
      sx={{
        position: "relative",
        padding: "12px 16px",
        borderRadius: "8px",
        cursor: "pointer",
        backgroundColor: active ? "#210e64" : "transparent",
        // FIX: force white text when active
        color: active ? "#FFFFFF" : "#555",
        transition: "0.2s",

        "&:hover": {
          backgroundColor: "#210e64",
          color: "#FFFFFF", // FIX: hover text white
        },
      }}
    >
      <Typography
        fontSize="14px"
        fontWeight={600}
        sx={{
          // force Typography to follow parent color
          color: "inherit !important", // 🔥 FIX TEXT COLOR OVERRIDE
          fontFamily: "var(--font-ftsterling)",
        }}
      >
        {label}
      </Typography>

      {!!badgeCount && badgeCount > 0 && (
        <Box
          sx={{
            position: "absolute",
            top: 6,
            right: 8,
            minWidth: 18,
            height: 18,
            px: 0.5,
            borderRadius: "50%",
            backgroundColor: "#dc2626",
            color: "#fff",
            fontSize: 11,
            lineHeight: "18px",
            fontWeight: 700,
            textAlign: "center",
            border: "1px solid rgba(255,255,255,0.5)",
          }}
        >
          {badgeCount > 99 ? "99+" : badgeCount}
        </Box>
      )}
    </Box>
  );
}
