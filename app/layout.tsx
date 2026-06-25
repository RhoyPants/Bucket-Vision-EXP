import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

import ThemeRegistry from "./ThemeRegistry";
import theme from "./lib/theme";
import { Providers } from "./provider";

// import ReduxProvider from "./providers/ReduxProvider";
// import MsalProviders from "./providers/msalProvider";
// import DateProvider from "./providers/DateProvider";

// Load company font: FT Sterling
const ftSterling = localFont({
  src: [
    {
      path: "../public/fonts/FTSterling/FTSterling-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/FTSterling/FTSterling-LightItalic.otf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/fonts/FTSterling/FTSterling-Book.otf",
      weight: "350",
      style: "normal",
    },
    {
      path: "../public/fonts/FTSterling/FTSterling-BookItalic.otf",
      weight: "350",
      style: "italic",
    },
    {
      path: "../public/fonts/FTSterling/FTSterling-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/FTSterling/FTSterling-RegularItalic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/FTSterling/FTSterling-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/FTSterling/FTSterling-MediumItalic.otf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../public/fonts/FTSterling/FTSterling-Semi-Bold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/FTSterling/FTSterling-Semi-BoldItalic.otf",
      weight: "600",
      style: "italic",
    },
    {
      path: "../public/fonts/FTSterling/FTSterling-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/FTSterling/FTSterling-BoldItalic.otf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-ftsterling",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Project VISION",
  description:
    "Visibility, Insight, Status, Information, Objectives, and Next action.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={ftSterling.variable}>
      <body
        style={{
          background:
            "radial-gradient(circle at 10% 20%, #dbeafe 0%, transparent 35%), radial-gradient(circle at 90% 80%, #e0f2fe 0%, transparent 40%), linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
          backgroundAttachment: "fixed",
        }}
      >
        <ThemeRegistry>
          <Providers>
            {children}
          </Providers>
        </ThemeRegistry>
      </body>
    </html>
  );
}
