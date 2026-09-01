import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AgriLink AI — Direct Agricultural Marketplace',
  description: 'AI-Powered Direct Agricultural Marketplace with Intelligent Logistics & Demand Forecasting',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
