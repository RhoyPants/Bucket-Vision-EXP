"use client";

import { Box, Typography } from "@mui/material";

const PRODUCTION_URL = "https://vision.globalvisionsinc.com.ph/";

export default function VisionTransitionPage() {
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "auto",
        p: { xs: 2, sm: 3, md: 5 },
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
            sm: "92%",
            md: "82%",
            lg: "75%",
            xl: "70%",
          },
          maxWidth: "1400px",
          minHeight: { md: "70vh" },
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          p: {
            xs: 3,
            sm: 4,
            md: 6,
            lg: 8,
          },
          borderRadius: { xs: 3, md: 5 },
          backgroundColor: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,0.75)",
          boxShadow: "0 30px 80px rgba(33,14,100,0.18)",
        }}
      >
        <Typography
          component="h1"
          sx={{
            color: "#210e64",
            fontSize: {
              xs: 36,
              sm: 44,
              md: 56,
              lg: 64,
            },
            lineHeight: 1.05,
            fontWeight: 950,
            textAlign: "center",
          }}
        >
          VISION Transition
        </Typography>

        <Typography
          sx={{
            mt: 2,
            color: "#5438d6",
            fontSize: {
              xs: 18,
              md: 22,
              lg: 26,
            },
            fontWeight: 800,
            textAlign: "center",
          }}
        >
          Important Notice — New Production Environment
        </Typography>

        <Box
          sx={{
            width: "80px",
            height: "5px",
            mx: "auto",
            mt: 3,
            mb: { xs: 3, md: 5 },
            borderRadius: 10,
            backgroundColor: "#f6d365",
          }}
        />

        <Typography
          sx={{
            color: "#342d3d",
            fontSize: {
              xs: 17,
              sm: 18,
              md: 21,
              lg: 23,
            },
            lineHeight: 1.7,
            fontWeight: 600,
          }}
        >
          Please be advised that we have transitioned to a new URL for our
          VISION Environment.
        </Typography>

        <Typography
          sx={{
            mt: 2.5,
            color: "#342d3d",
            fontSize: {
              xs: 17,
              sm: 18,
              md: 21,
              lg: 23,
            },
            lineHeight: 1.7,
            fontWeight: 600,
          }}
        >
          To ensure uninterrupted access and prevent login errors, all users
          are requested to update their web browsers immediately. Please remove
          any existing bookmarks or shortcuts pointing to the old VISION
          environment and use the new official Production environment moving
          forward.
        </Typography>

        <Box
          sx={{
            mt: { xs: 3, md: 5 },
            p: { xs: 2.5, md: 4 },
            borderRadius: 3,
            backgroundColor: "rgba(33,14,100,0.06)",
            border: "2px solid rgba(33,14,100,0.12)",
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              color: "#210e64",
              fontSize: {
                xs: 14,
                md: 17,
              },
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            New Official VISION Production
          </Typography>

          <Typography
            sx={{
              mt: 1.5,
              color: "#210e64",
              fontSize: {
                xs: 20,
                sm: 24,
                md: 30,
                lg: 34,
              },
              lineHeight: 1.2,
              fontWeight: 900,
              wordBreak: "break-word",
            }}
          >
            vision.globalvisionsinc.com.ph
          </Typography>
        </Box>

        <Box
          component="a"
          href={PRODUCTION_URL}
          sx={{
            mt: { xs: 3, md: 4 },
            width: "100%",
            minHeight: { xs: 58, md: 72 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 2.5,
            background:
              "linear-gradient(90deg, #2b148f 0%, #5438d6 100%)",
            color: "#ffffff",
            fontSize: {
              xs: 17,
              md: 21,
            },
            fontWeight: 900,
            textDecoration: "none",
            boxShadow: "0 12px 30px rgba(43,20,143,0.25)",
            transition:
              "transform 150ms ease, box-shadow 150ms ease",

            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 16px 36px rgba(43,20,143,0.32)",
            },
          }}
        >
          Open New VISION Production →
        </Box>

        <Typography
          sx={{
            mt: { xs: 3, md: 4 },
            color: "#4d4658",
            fontSize: {
              xs: 15,
              md: 18,
            },
            lineHeight: 1.7,
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          Please ensure you use this new link for all your day-to-day
          transactions and system activities moving forward.
        </Typography>

        <Typography
          sx={{
            mt: 2,
            color: "#696270",
            fontSize: {
              xs: 14,
              md: 16,
            },
            lineHeight: 1.7,
            textAlign: "center",
          }}
        >
          Should you experience any issues accessing the new link, please
          reach out to MIT immediately.
        </Typography>

        <Box
          sx={{
            mt: { xs: 3, md: 4 },
            pt: 3,
            borderTop: "1px solid rgba(33,14,100,0.12)",
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              color: "#210e64",
              fontSize: 16,
              fontWeight: 900,
            }}
          >
            System Admin
          </Typography>

          <Typography
            sx={{
              mt: 0.25,
              color: "#696270",
              fontSize: 14,
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
