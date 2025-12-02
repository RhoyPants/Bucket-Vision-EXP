"use client";

import { Box, Typography } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";

export default function SidebarItem({
  label,
  href,
}: {
  label: string;
  href: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const active = pathname === href;

  return (
    <Box
      onClick={() => router.push(href)}
      sx={{
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
          color: "inherit !important",  // 🔥 FIX TEXT COLOR OVERRIDE
          fontFamily: "var(--font-ftsterling)",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
