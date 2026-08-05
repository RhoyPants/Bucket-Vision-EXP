"use client";

import { useState } from "react";
import { TextField, TextFieldProps } from "@mui/material";

type DecimalBudgetFieldProps = Omit<TextFieldProps, "value" | "onChange" | "type"> & {
  value: number | string;
  onValueChange: (value: number) => void;
};

const inputFromValue = (value: number | string) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return String(amount);
};

const formatInput = (input: string) => {
  if (!input) return "";
  const [wholePart, decimalPart] = input.split(".");
  const whole = wholePart
    ? Number(wholePart).toLocaleString("en-US")
    : "";
  return input.includes(".") ? `${whole}.${decimalPart ?? ""}` : whole;
};

export default function DecimalBudgetField({
  value,
  onValueChange,
  inputProps,
  sx,
  onFocus,
  onBlur,
  ...props
}: DecimalBudgetFieldProps) {
  const [editingValue, setEditingValue] = useState(() => inputFromValue(value));
  const [isEditing, setIsEditing] = useState(false);
  const displayedValue = isEditing ? editingValue : inputFromValue(value);

  return (
    <TextField
      {...props}
      type="text"
      value={formatInput(displayedValue)}
      inputProps={{ inputMode: "decimal", ...inputProps }}
      sx={[
        {
          "& .MuiInputBase-input": {
            fontFamily: 'Consolas, "Courier New", monospace',
            fontVariantNumeric: "tabular-nums",
            fontWeight: 600,
            letterSpacing: "0.04em",
          },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      onFocus={(event) => {
        setEditingValue(inputFromValue(value));
        setIsEditing(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setIsEditing(false);
        onBlur?.(event);
      }}
      onChange={(event) => {
        const next = event.target.value.replace(/,/g, "");
        if (!/^\d*(?:\.\d{0,2})?$/.test(next)) return;
        setEditingValue(next);
        onValueChange(next === "" || next === "." ? 0 : Number(next));
      }}
    />
  );
}
