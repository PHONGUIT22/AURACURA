import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AuraCura — Autonomous Bio-Harmonic eCommerce VTO & Skin-Safe Styling',
  description:
    'Protecting the user skin barrier while maximizing event elegance through Bio-Harmonic Virtual Try-On and multi-vector dermatology safety guardrails.',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased text-[#F3F4F6] min-h-[100dvh] bg-[#070709] selection:bg-[#10B981]/25 selection:text-[#10B981]">
        {children}
      </body>
    </html>
  );
}