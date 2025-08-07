import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import FloatingShapes from "@/components/floating-shapes";
import Header from "@/components/Header";
import { ClerkProvider } from "@clerk/nextjs";
import { shadesOfPurple } from "@clerk/themes";
import Footer from "@/components/Footer";

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
  title: "Edix",
  description: "Edix is a modern, web-based image editing platform, offering a fast and intuitive interface for transforming images with ease.",
  icons: {
    icon: "/edix/edix.png",
    shortcut: "/edix/edix.png",
    apple: "/edix/edix.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{
      baseTheme: shadesOfPurple,
    }}>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} flex flex-col min-h-screen`}>
          <ThemeProvider attribute={"class"} defaultTheme="dark" enableSystem disableTransitionOnChange>
            <Header />
            <main className="bg-slate-900 flex-1 text-white overflow-x-hidden">
              <FloatingShapes />
              <Toaster richColors/>
              {children}
            </main>
            <Footer />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>

  );
}
