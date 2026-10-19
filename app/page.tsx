"use client";

import { Box, Typography } from "@mui/material";

const PRODUCTION_URL = "https://vision.globalvisionsinc.com.ph/";

export default function VisionTransitionPage() {
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",

        // Responsive outer spacing
        p: "clamp(16px, 3vw, 48px)",

        backgroundColor: "#e0dae6",
        backgroundImage:
          "linear-gradient(135deg, rgba(255,255,255,0.35), rgba(224,218,230,0.35)), url('/images/BG LIGHT.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Box
        sx={{
          // Uses most of the screen without becoming enormous
          width: "min(78vw, 1100px)",
          maxHeight: "calc(100dvh - 40px)",
          overflowY: "auto",

          p: "clamp(24px, 4vw, 56px)",
          boxSizing: "border-box",

          borderRadius: "clamp(20px, 3vw, 36px)",
          backgroundColor: "rgba(255,255,255,0.94)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,0.75)",
          boxShadow: "0 24px 70px rgba(33,14,100,0.16)",

          // Tablet / mobile
          "@media (max-width: 900px)": {
            width: "92vw",
          },

          "@media (max-width: 600px)": {
            width: "100%",
            maxHeight: "none",
            borderRadius: "20px",
          },
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: "center" }}>
          <Typography
            component="h1"
            sx={{
              color: "#210e64",
              fontSize: "clamp(28px, 3.2vw, 48px)",
              lineHeight: 1.1,
              fontWeight: 900,
            }}
          >
            VISION Transition
          </Typography>

          <Typography
            sx={{
              mt: 1,
              color: "#5438d6",
              fontSize: "clamp(16px, 1.6vw, 22px)",
              fontWeight: 800,
            }}
          >
            Important Notice — New Production Environment
          </Typography>

          <Box
            sx={{
              width: 64,
              height: 4,
              mx: "auto",
              mt: 2,
              borderRadius: 10,
              backgroundColor: "#f6d365",
            }}
          />
        </Box>

        {/* Announcement */}
        <Box
          sx={{
            mt: "clamp(24px, 3vw, 40px)",
          }}
        >
          <Typography
            sx={{
              color: "#342d3d",
              fontSize: "clamp(15px, 1.3vw, 18px)",
              lineHeight: 1.65,
              fontWeight: 600,
            }}
          >
            Please be advised that we have transitioned to a new URL for our
            VISION Environment.
          </Typography>

          <Typography
            sx={{
              mt: 2,
              color: "#342d3d",
              fontSize: "clamp(15px, 1.3vw, 18px)",
              lineHeight: 1.65,
              fontWeight: 600,
            }}
          >
            To ensure uninterrupted access and prevent login errors, all users
            are requested to update their web browsers immediately. Please
            remove any existing bookmarks or shortcuts pointing to the old
            VISION environment and use the new official Production environment
            moving forward.
          </Typography>
        </Box>

        {/* New URL */}
        <Box
          sx={{
            mt: "clamp(22px, 3vw, 34px)",
            p: "clamp(18px, 2.5vw, 28px)",
            borderRadius: 3,
            backgroundColor: "rgba(33,14,100,0.055)",
            border: "1px solid rgba(33,14,100,0.14)",
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              color: "#210e64",
              fontSize: "clamp(12px, 1.2vw, 15px)",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            New Official VISION Production
          </Typography>

          <Typography
            sx={{
              mt: 1,
              color: "#210e64",
              fontSize: "clamp(18px, 2.2vw, 28px)",
              lineHeight: 1.2,
              fontWeight: 900,
              overflowWrap: "anywhere",
            }}
          >
            vision.globalvisionsinc.com.ph
          </Typography>
        </Box>

        {/* Button */}
        <Box
          component="a"
          href={PRODUCTION_URL}
          sx={{
            mt: 2.5,
            width: "100%",
            minHeight: "clamp(50px, 6vh, 62px)",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            px: 2,
            boxSizing: "border-box",
            borderRadius: 2.5,

            background:
              "linear-gradient(90deg, #2b148f 0%, #5438d6 100%)",

            color: "#ffffff",
            fontSize: "clamp(15px, 1.4vw, 18px)",
            fontWeight: 800,
            textDecoration: "none",
            textAlign: "center",

            boxShadow: "0 10px 25px rgba(43,20,143,0.22)",
            transition: "transform 150ms ease, box-shadow 150ms ease",

            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 14px 30px rgba(43,20,143,0.30)",
            },
          }}
        >
          Open New VISION Production →
        </Box>

        {/* Footer Notice */}
        <Box
          sx={{
            mt: "clamp(20px, 2.5vw, 30px)",
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              color: "#4d4658",
              fontSize: "clamp(13px, 1.15vw, 16px)",
              lineHeight: 1.6,
              fontWeight: 600,
            }}
          >
            Please ensure you use this new link for all your day-to-day
            transactions and system activities moving forward.
          </Typography>

          <Typography
            sx={{
              mt: 1.25,
              color: "#696270",
              fontSize: "clamp(12px, 1vw, 14px)",
              lineHeight: 1.6,
            }}
          >
            Should you experience any issues accessing the new link, please
            reach out to MIT immediately.
          </Typography>

          <Box
            sx={{
              mt: 2.5,
              pt: 2,
              borderTop: "1px solid rgba(33,14,100,0.1)",
            }}
          >
            <Typography
              sx={{
                color: "#210e64",
                fontSize: 14,
                fontWeight: 900,
              }}
            >
              System Admin
            </Typography>

            <Typography
              sx={{
                mt: 0.25,
                color: "#696270",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              MIT
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
