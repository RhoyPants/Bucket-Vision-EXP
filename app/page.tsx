"use client";

import { Box, Typography } from "@mui/material";

const PRODUCTION_URL = "https://vision.globalvisionsinc.com.ph/";

export default function VisionTransitionPage() {
  return (
    <Box
      sx={{
        width: "100vw",
        height: "100dvh",
        overflow: "hidden",
        boxSizing: "border-box",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        p: {
          xs: 2,
          sm: 2.5,
          md: 3,
        },

        backgroundColor: "#e0dae6",
        backgroundImage:
          "linear-gradient(135deg, rgba(255,255,255,0.35), rgba(224,218,230,0.35)), url('/images/BG LIGHT.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Box
        sx={{
          width: {
            xs: "100%",
            sm: "94%",
            md: "88%",
            lg: "82%",
          },
          maxWidth: "1200px",

          // No fixed/min height
          boxSizing: "border-box",

          px: {
            xs: 2.5,
            sm: 4,
            md: 6,
            lg: 7,
          },
          py: {
            xs: 2.5,
            sm: 3,
            md: 4,
          },

          borderRadius: {
            xs: 3,
            md: 4,
          },

          backgroundColor: "rgba(255,255,255,0.95)",
          border: "1px solid rgba(255,255,255,0.8)",
          boxShadow: "0 20px 60px rgba(33,14,100,0.15)",
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: "center" }}>
          <Typography
            component="h1"
            sx={{
              color: "#210e64",
              fontSize: {
                xs: "1.7rem",
                sm: "2rem",
                md: "2.35rem",
              },
              lineHeight: 1.15,
              fontWeight: 900,
            }}
          >
            VISION Transition
          </Typography>

          <Typography
            sx={{
              mt: 0.75,
              color: "#5438d6",
              fontSize: {
                xs: "0.9rem",
                sm: "1rem",
                md: "1.1rem",
              },
              fontWeight: 800,
            }}
          >
            Important Notice — New Production Environment
          </Typography>
        </Box>

        {/* Main announcement */}
        <Box
          sx={{
            mt: {
              xs: 2,
              md: 3,
            },
          }}
        >
          <Typography
            sx={{
              color: "#342d3d",
              fontSize: {
                xs: "0.9rem",
                sm: "0.95rem",
                md: "1rem",
              },
              lineHeight: 1.6,
              fontWeight: 600,
            }}
          >
            Please be advised that we have transitioned to a new URL for our
            VISION Environment.
          </Typography>

          <Typography
            sx={{
              mt: 1.5,
              color: "#342d3d",
              fontSize: {
                xs: "0.9rem",
                sm: "0.95rem",
                md: "1rem",
              },
              lineHeight: 1.6,
              fontWeight: 500,
            }}
          >
            To ensure uninterrupted access and prevent login errors, please
            remove any existing bookmarks or shortcuts pointing to the old
            VISION environment and use the new official Production environment
            moving forward.
          </Typography>
        </Box>

        {/* New Production URL */}
        <Box
          sx={{
            mt: {
              xs: 2,
              md: 2.5,
            },
            p: {
              xs: 1.75,
              md: 2.25,
            },

            borderRadius: 2.5,
            backgroundColor: "rgba(33,14,100,0.055)",
            border: "1px solid rgba(33,14,100,0.13)",
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              color: "#210e64",
              fontSize: {
                xs: "0.7rem",
                sm: "0.75rem",
                md: "0.8rem",
              },
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            New Official VISION Production
          </Typography>

          <Typography
            sx={{
              mt: 0.5,
              color: "#210e64",
              fontSize: {
                xs: "1.05rem",
                sm: "1.25rem",
                md: "1.5rem",
              },
              lineHeight: 1.3,
              fontWeight: 900,
              overflowWrap: "anywhere",
            }}
          >
            vision.globalvisionsinc.com.ph
          </Typography>
        </Box>

        {/* CTA */}
        <Box
          component="a"
          href={PRODUCTION_URL}
          sx={{
            mt: 2,

            width: "100%",
            minHeight: {
              xs: 48,
              md: 52,
            },

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            px: 2,
            boxSizing: "border-box",

            borderRadius: 2,

            background:
              "linear-gradient(90deg, #2b148f 0%, #5438d6 100%)",

            color: "#ffffff",
            fontSize: {
              xs: "0.9rem",
              md: "1rem",
            },
            fontWeight: 800,
            textAlign: "center",
            textDecoration: "none",

            boxShadow: "0 8px 22px rgba(43,20,143,0.22)",

            transition:
              "transform 150ms ease, box-shadow 150ms ease",

            "&:hover": {
              transform: "translateY(-1px)",
              boxShadow: "0 11px 26px rgba(43,20,143,0.28)",
            },
          }}
        >
          Open New VISION Production →
        </Box>

        {/* Reminder */}
        <Typography
          sx={{
            mt: 2,
            color: "#4d4658",
            fontSize: {
              xs: "0.78rem",
              sm: "0.82rem",
              md: "0.88rem",
            },
            lineHeight: 1.5,
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          Please update your browser bookmark and use the new Production link
          for all day-to-day transactions and system activities.
        </Typography>

        <Typography
          sx={{
            mt: 0.75,
            color: "#77717f",
            fontSize: {
              xs: "0.72rem",
              md: "0.8rem",
            },
            lineHeight: 1.5,
            textAlign: "center",
          }}
        >
          If you experience any issues accessing the new environment, please
          contact MIT for assistance.
        </Typography>

        {/* Footer */}
        <Box
          sx={{
            mt: 1.75,
            pt: 1.5,
            borderTop: "1px solid rgba(33,14,100,0.1)",
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              color: "#210e64",
              fontSize: "0.78rem",
              fontWeight: 900,
            }}
          >
            System Admin
          </Typography>

          <Typography
            sx={{
              mt: 0.1,
              color: "#77717f",
              fontSize: "0.7rem",
              fontWeight: 700,
            }}
          >
            MIT
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
