import type { ReactNode } from "react";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { DemoSidebar } from "@/components/DemoSidebar";
import { DemoPreviewProvider } from "@/components/DemoPreview";

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <DemoPreviewProvider>
      <Nav />
      <div className="panel-shell">
        <DemoSidebar />
        <div className="panel-main">
          <p className="flash flash-demo">Aperçu fictif — tu peux cliquer partout, rien n&apos;est écrit en base.</p>
          {children}
          <p className="cta">
            <Link href="/">Retour à l&apos;accueil</Link>
          </p>
        </div>
      </div>
    </DemoPreviewProvider>
  );
}
