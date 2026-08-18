import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { Providers } from "./providers";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

function siteMetadataBase(): URL {
  try {
    return new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: siteMetadataBase(),
  title: {
    default: "Mr-X Sentinel",
    template: "%s · Mr-X Sentinel",
  },
  description: "Panel de gestion Sentinel — anti-nuke, automod, snapshots, économie.",
  authors: [{ name: "Mr-Aurevo-X" }],
  creator: "Mr-Aurevo-X",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={outfit.variable}>
        <Providers>{children}</Providers>
        <SiteFooter />
      </body>
    </html>
  );
}
