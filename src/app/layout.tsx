import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Inter } from "next/font/google";

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
  title: "Vividly",
  description: "Vividly is a modern, web-based image editing platform, offering a fast and intuitive interface for transforming images with ease.",
  icons: {
    icon: "/vividly/vividly.png",
    shortcut: "/vividly/vividly.png",
    apple: "/vividly/vividly.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className}`}>
        <ThemeProvider attribute={"class"} defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
