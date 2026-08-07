import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider"
import { cn } from "@/lib/utils";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans", // Optional
});

export const metadata: Metadata = {
  title: "Discord Clone",
  description: "A clone of the popular chat application Discord, built with Next.js and Tailwind CSS.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ClerkProvider>
    <html lang="en" suppressHydrationWarning className={`${openSans.variable} h-full antialiased`}>
      <body className={cn(
        openSans.className,
        "bg-white dark:bg-[#313338]"
      )}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
        {children}
        </ThemeProvider>
      </body>
    </html>
    </ClerkProvider>
  );
}