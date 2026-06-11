import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "FodmapZen — Low-FODMAP Meal Plans & Recipes for IBS",
  description:
    "Low-FODMAP meal plans, recipes & IBS food guide — offline & always with you. 200+ dietitian-verified recipes, weekly meal planner, auto shopping list, reintroduction tracker, and restaurant guide.",
  keywords: [
    "low FODMAP meal plan",
    "low FODMAP recipes",
    "FODMAP food list",
    "IBS diet app",
    "FODMAP app",
    "IBS meal planner",
    "low FODMAP diet",
    "7 day low FODMAP meal plan",
  ],
  openGraph: {
    title: "FodmapZen — Eat well with IBS. Finally.",
    description:
      "Low-FODMAP meal plans, recipes & IBS food guide — offline & always with you. The only FODMAP app with weekly meal planner, shopping list, reintroduction tracker and restaurant guide.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[var(--font-dm-sans)]">
        {children}
      </body>
    </html>
  );
}
