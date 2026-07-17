import type { Metadata } from "next";
import { Inter, Noto_Sans_SC, Stack_Sans_Notch, Stack_Sans_Text } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

// STEEZ brand type system: Inter for Latin, Noto Sans SC for Chinese.
// next/font/google self-hosts at build time — GFW-safe.
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-noto",
  display: "swap",
});

// Same type system as the STEEZ marketing site (~/Projects/steez):
// Stack Sans Notch for headings/wordmark, Stack Sans Text for body.
const stackSansNotch = Stack_Sans_Notch({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  variable: "--font-stack-sans",
  display: "swap",
});

const stackSansText = Stack_Sans_Text({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  variable: "--font-stack-text",
  display: "swap",
});

export const metadata: Metadata = {
  title: "STEEZ · 思智 — Dashboard",
  description: "Manage your product catalog and see how buyers engage with it.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased",
        inter.variable,
        notoSansSC.variable,
        stackSansNotch.variable,
        stackSansText.variable,
      )}
    >
      <body className="min-h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
