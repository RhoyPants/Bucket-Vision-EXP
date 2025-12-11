import { Box } from "@mui/material";
import { forwardRef } from "react";
import { TimelineContainerProps } from "../types";

const TimelineContainer = forwardRef<HTMLDivElement, TimelineContainerProps>(
  ({ children }, ref) => {
    return (
      <Box
        ref={ref}
        sx={{
          overflowX: "auto",
          overflowY: "auto",
          maxWidth: "100%",
          maxHeight: "70vh",
          borderRadius: 3,
          border: "1px solid #ddd",
          background: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          position: "relative",
        }}
      >
        {children}
      </Box>
    );
  }
);

export default TimelineContainer;
