import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocuRAG — Intelligent Document Retrieval-Augmented Generation",
  description: "High-precision PDF question answering with page-level source citations powered by PyMuPDF, Sentence Transformers, ChromaDB, and Google Gemini API.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#080c14] text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
