import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./Providers";
import { SidebarProvider } from "./context/SidebarContext";
import { ThemeProvider } from "@/app/context/ThemeContext"
import { Analytics } from "@vercel/analytics/next"
import ClientAutoLogout from "./ClientAutoLogout";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Vintage Life Pvt.Ltd",
  description: "Vintage Life Pvt.Ltd",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ThemeProvider>

            <SidebarProvider>
              {/* <ClientAutoLogout /> */}
              {children}
            </SidebarProvider>
          </ThemeProvider>
        </AuthProvider>
        <Analytics/>
      </body>
    </html>
  );
}
