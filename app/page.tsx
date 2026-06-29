"use client";

import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import LoginContainer from "./login/components/loginContainer";

const visionSlides = [
  {
    image: "/images/vision-slides/visibility.png",
    letter: "V",
    word: "Visibility",
    meaning: "Clear Visibility.",
  },  
  {
    image: "/images/vision-slides/insight.png",
    letter: "I",
    word: "Insight",
    meaning: "Actionable Insight.",
  },
  {
    image: "/images/vision-slides/status.png",
    letter: "S",
    word: "Status",
    meaning: "Real-time Status.",
  },
  {
    image: "/images/vision-slides/information.png",
    letter: "I",
    word: "Information",
    meaning: "Centralized Information.",
  },
  {
    image: "/images/vision-slides/objectives.png",
    letter: "O",
    word: "Objectives",
    meaning: "Tracked Objectives.",
  },
  {
    image: "/images/vision-slides/next-action.png",
    letter: "N",
    word: "Next Action",
    meaning: "Prioritized Next Actions.",
  },
];

const visionLetters = ["V", "I", "S", "I", "O", "N"];

function LoginPageContent() {
  const searchParams = useSearchParams();
  const ssoStatus = searchParams.get("sso");
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % visionSlides.length);
    }, 4500);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        minHeight: "100dvh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        backgroundColor: "#210e64",
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 1fr) 440px",
            lg: "minmax(0, 1fr) 470px",
            xl: "minmax(0, 1fr) 560px",
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            display: { xs: "none", md: "block" },
            height: "100%",
            overflow: "hidden",
            bgcolor: "#210e64",
          }}
        >
          {visionSlides.map((slide, index) => (
            <Box
              key={slide.image}
              sx={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url('${slide.image}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: activeSlide === index ? 1 : 0,
                transform: activeSlide === index ? "scale(1.02)" : "scale(1)",
                transition: "opacity 900ms ease, transform 5000ms ease",
              }}
            />
          ))}

          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(9, 3, 42, 0.08) 0%, rgba(9, 3, 42, 0.48) 58%, rgba(9, 3, 42, 0.9) 100%), linear-gradient(90deg, rgba(9, 3, 42, 0.72) 0%, rgba(9, 3, 42, 0.34) 46%, rgba(9, 3, 42, 0.62) 100%)",
            }}
          />

          <Stack
            spacing={2.25}
            sx={{
              position: "absolute",
              left: { md: 56, lg: 72 },
              right: { md: 48, lg: 72, xl: 96 },
              bottom: { md: 48, lg: 64, xl: 84 },
              color: "#ffffff",
              maxWidth: { md: 720, xl: 880 },
            }}
          >
            <Typography
              component="h1"
              sx={{
                display: "flex",
                alignItems: "baseline",
                flexWrap: "wrap",
                gap: { md: 0.65, lg: 0.85 },
                fontSize: { md: 62, lg: 82, xl: 104 },
                lineHeight: 0.9,
                fontWeight: 950,
                textShadow:
                  "0 0 22px rgba(246, 211, 101, 0.34), 0 22px 52px rgba(0,0,0,0.46)",
              }}
            >
              {visionLetters.map((letter, index) => (
                <Box
                  key={`${letter}-${index}`}
                  component="span"
                  sx={{
                    display: "inline-flex",
                    alignItems: "baseline",
                    color: "#ffffff",
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      color: activeSlide === index ? "#f6d365" : "#ffffff",
                      textShadow:
                        activeSlide === index
                          ? "0 0 18px rgba(246, 211, 101, 0.68), 0 18px 46px rgba(0,0,0,0.42)"
                          : "0 18px 46px rgba(0,0,0,0.42)",
                      transition: "color 320ms ease, text-shadow 320ms ease",
                    }}
                  >
                    {letter}
                  </Box>
                  {index < visionLetters.length - 1 && (
                    <Box
                      component="span"
                      sx={{
                        mx: { md: 0.35, lg: 0.45 },
                        color: "rgba(255,255,255,0.72)",
                        fontSize: "0.42em",
                      }}
                    >
                      .
                    </Box>
                  )}
                </Box>
              ))}
            </Typography>

            <Box>
              <Typography
                sx={{
                  color: "#f6d365",
                  fontSize: { md: 21, lg: 24, xl: 30 },
                  lineHeight: 1.2,
                  fontWeight: 900,
                  textShadow: "0 0 20px rgba(246, 211, 101, 0.3)",
                }}
              >
                {visionSlides[activeSlide].word}
              </Typography>
              <Typography
                sx={{
                  mt: 0.75,
                  maxWidth: { md: 620, xl: 760 },
                  color: "rgba(255,255,255,0.84)",
                  fontSize: { md: 15, xl: 18 },
                  lineHeight: 1.7,
                  fontWeight: 650,
                }}
              >
                {visionSlides[activeSlide].meaning}
              </Typography>
            </Box>


          </Stack>
        </Box>

        <Stack
          spacing={2}
          sx={{
            width: "100%",
            height: "100%",
            maxWidth: "none",
            mx: "auto",
            alignItems: "center",
            justifyContent: "center",
            p: { xs: 2, md: 4, xl: 6 },
            backgroundColor: "#e0dae6",
            backgroundImage:
              "linear-gradient(180deg, rgba(255,255,255,0.2), rgba(224,218,230,0.18)), url('/images/BG LIGHT.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {ssoStatus === "register" && (
            <Alert severity="warning">
              No registered account found. Please contact admin to register your
              account.
            </Alert>
          )}

          {ssoStatus === "pending" && (
            <Alert severity="info">
              Your account is inactive. Please contact your administrator.
            </Alert>
          )}

          {ssoStatus === "denied" && (
            <Alert severity="error">
              Your account has been denied access. Please contact your
              administrator.
            </Alert>
          )}

          {(ssoStatus === "failed" ||
            ssoStatus === "invalid_state" ||
            ssoStatus === "invalid_callback") && (
            <Alert severity="error">
              Microsoft SSO login failed. Please try again.
            </Alert>
          )}

          <Box sx={{ width: "100%", maxWidth: { xs: 410, lg: 430, xl: 470 } }}>
            <LoginContainer />
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            // backgroundColor: "#19075d",
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
