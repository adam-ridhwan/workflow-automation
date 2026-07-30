import { ConvexClientProvider } from '@/components/ConvexClientProvider';
import { ConvexAuthNextjsServerProvider } from '@convex-dev/auth/nextjs/server';
import { Geist, Geist_Mono } from 'next/font/google';

import type { Metadata } from 'next';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AI Workflow Builder',
  description: 'AI workflow builder',
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html
        lang='en'
        className={`${geistSans.variable} ${geistMono.variable} h-full
          antialiased`}
      >
        <body className='flex min-h-full flex-col'>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
