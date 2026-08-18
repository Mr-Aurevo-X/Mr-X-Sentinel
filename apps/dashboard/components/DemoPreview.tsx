"use client";

import { createContext, useContext, type ReactNode } from "react";

const DemoPreviewContext = createContext(false);

export function DemoPreviewProvider({ children }: { children: ReactNode }) {
  return <DemoPreviewContext.Provider value={true}>{children}</DemoPreviewContext.Provider>;
}

export function useDemoPreview(): boolean {
  return useContext(DemoPreviewContext);
}
