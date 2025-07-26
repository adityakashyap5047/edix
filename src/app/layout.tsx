import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import FloatingShapes from "@/components/floating-shapes";

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
          <main className="bg-slate-900 min-h-screen text-white overflow-x-hidden">
            <FloatingShapes />
            <Toaster richColors/>
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
