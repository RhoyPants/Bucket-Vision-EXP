"use client";

import Popper, { PopperProps } from "@mui/material/Popper";

export default function AnchoredDropdownPopper(props: PopperProps) {
  const anchor = typeof props.anchorEl === "function" ? props.anchorEl() : props.anchorEl;
  const width = anchor instanceof Element ? anchor.getBoundingClientRect().width : undefined;

  return (
    <Popper
      {...props}
      placement="bottom-start"
      modifiers={[
        ...(props.modifiers || []).filter((modifier) => modifier.name !== "flip"),
        { name: "flip", enabled: false },
      ]}
      style={{ ...props.style, width }}
    />
  );
}
