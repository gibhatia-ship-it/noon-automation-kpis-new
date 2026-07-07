import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'noon Minutes — Autonomous Command Centre',
  description: 'Live dashboard for autonomous delivery solutions',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
