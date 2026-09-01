import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { BottomNav } from "@/components/navigation/BottomNav";
import { APP_DESCRIPTION, APP_NAME, APP_SHORT_NAME, APP_TAGLINE } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/appicon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/appicon.png",
    apple: "/appicon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_SHORT_NAME,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#eef1f4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full light" suppressHydrationWarning>
      <body className="app-shell min-h-full flex flex-col font-sans antialiased">
        <Providers>
          <div className="flex min-h-0 flex-1 flex-col pb-nav">{children}</div>
          <div className="nv-bottom-fade pointer-events-none fixed inset-x-0 bottom-0 z-40" aria-hidden />
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
