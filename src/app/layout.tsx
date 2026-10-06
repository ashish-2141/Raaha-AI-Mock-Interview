import type { Metadata } from "next";
import type { ReactNode } from "react";
export const metadata: Metadata = { title:"Raaha AI Mock Interview", description:"AI-powered mock interviews with adaptive questioning, evidence-based evaluation, and a secure coding round." };
export default function RootLayout({children}:{children:ReactNode}) { return <html lang="en"><body>{children}</body></html>; }