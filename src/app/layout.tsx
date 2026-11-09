import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'COSMOS — An Interactive 3D Portfolio Universe',
  description: 'An ultra-realistic, cinematic interactive 3D universe presenting a software developer portfolio as an explorable cosmos.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-cosmos-950 text-slate-100 antialiased overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}
