"use client";

import React, { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";

export default function MeasuredChartContainer({
  height = 260,
  children,
}: {
  height?: number;
  children: (size: { width: number; height: number }) => React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateSize = () => {
      const nextWidth = Math.max(0, Math.floor(element.clientWidth));
      setWidth(nextWidth);
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <Box ref={containerRef} sx={{ height, width: "100%", minWidth: 0, minHeight: height }}>
      {width > 0 ? children({ width, height }) : null}
    </Box>
  );
}
