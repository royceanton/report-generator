import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable react-hooks/exhaustive-deps */

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Report Generator",
  description: "Generate IHK-Mannheim reports from Harvest time tracking data",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
