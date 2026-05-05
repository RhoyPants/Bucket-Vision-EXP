'use client';

import { createTheme, darken, hexToRgb, lighten, rgbToHex } from '@mui/material/styles';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

declare module '@mui/material/styles' {
  interface Palette {
    drawer: Palette['primary'];
    slate: Palette['primary'];
    grayishBlue: Palette['primary'];
    textGray: Palette['primary'];
  }
  interface PaletteOptions {
    slate?: {
      main?: string;
    };
    drawer?: {
      main?: string;
      contrastText?: string;
    };
    grayishBlue?: {
      main?: string;
    };
    textGray?: {
      main?: string;
    };
  }
}
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    mainTitle: true;
    label: true;
    title: true;
  }
}

const typography: any = {
  fontFamily: "var(--font-ftsterling), sans-serif",
  // Base font size scale: ~87.5% of original (16px root → ~14px effective)
  htmlFontSize: 16,
  fontSize: 13,
  h1: {
    fontSize: "1.875rem",
    fontWeight: 700,
    color: "#1E1E1E",
  },
  h2: {
    fontSize: "1.5rem",
    fontWeight: 600,
    color: "#1E1E1E",
  },
  h3: {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#333333",
  },

  // Subheadings / Section titles
  subtitle1: {
    fontSize: "0.9375rem",
    fontWeight: 500,
    color: "#4A4A4A",
  },

  // Table and labels
  body1: {
    fontSize: "0.875rem",
    fontWeight: 400,
    color: "#2C2C2C",
  },
  body2: {
    fontSize: "0.8125rem",
    fontWeight: 400,
    color: "#555555",
  },

  // Inventory statuses
  caption: {
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "#777777",
    letterSpacing: "0.05em",
  },
};





const theme = createTheme({
  typography,
  shape: {
    borderRadius: 10
  },
  palette: {
    primary: {
      main: '#210e64',
    },
    secondary: {
      main: '#e0dae6',
    },
    slate: {
      main: '#e8e7e2',
    },
    grayishBlue: {
      main: '#F1F5F9',
    },
    textGray: {
      main: '#555',
    },
    // text: {
    //   primary: '#F1F5F9',
    //   secondary: '#E2E8F0'
    // },
    drawer: {
      main: '#210e64',
      contrastText: '#FFFFFF',
    },

  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
          textTransform: 'none',
          // padding: "10px 16px",
        }),
      },
      defaultProps: {
        disableElevation: true,
        variant: 'contained',
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: ({ theme }) => ({
          '& .MuiOutlinedInput-root': {
            borderRadius: theme.shape.borderRadius,
            // height: 48,
          },
          // '& .MuiInputBase-input': {
          //   padding: '10px 12px',
          // },
          // '& .MuiInputLabel-root': {
          //   top: '-4px',

          // },
          // '& .MuiInputLabel-shrink': {
          //   top: 0,
          // },
          "&:hover fieldset": {
            borderColor: theme.palette.primary.main,
          },
        }),
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: 0,
          backgroundColor: theme.palette.drawer.main,
          color: theme.palette.drawer.contrastText,
          boxShadow: theme.shadows[0],
          boxSizing: 'border-box',
        }),
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: ({ theme }) => ({
          backgroundColor: theme.palette.grayishBlue.main,
          fontWeight: 600,
          fontSize: 14,
          padding: "10px 16px",
          color: theme.typography.body1.color,
          textTransform: "uppercase",
          letterSpacing: "0.3px",
          //boxShadow: "none",
        }),
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.grayishBlue.main,
        }),
      },
    },
    MuiTab: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.typography.body1.color,
        }),
      },
    },
  }
});

export default theme;