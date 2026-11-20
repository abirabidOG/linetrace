import type { Metadata } from 'next';
import { Inter, Inter_Tight } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LineTrace: Free Line Art to Vector Converter (SVG, No Sign-Up)',
  description:
    'Turn line art into clean vectors. Free, in your browser, no sign-up. SVG, PNG and ZIP export, files never leave your device.',
  metadataBase: new URL('https://tools.abidmahmud.cv'),
  alternates: {
    canonical: '/linetrace',
  },
  openGraph: {
    title: 'LineTrace: Free Line Art to Vector Converter (SVG, No Sign-Up)',
    description:
      'Turn line art into clean vectors. Free, in your browser, no sign-up. Files never leave your device.',
    url: 'https://tools.abidmahmud.cv/linetrace',
    siteName: 'Abid Mahmud Tools',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable}`}>
      <head>
        {/* Google Analytics 4 */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-ZF1FSM8N07"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-ZF1FSM8N07', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-white text-[#0B0B0D] selection:bg-[#5846F6]/10 selection:text-[#5846F6]">
        {/* Floating Translucent Header */}
        <header className="fixed top-3 md:top-4 left-3 right-3 md:left-0 md:right-0 md:mx-auto z-50 flex h-16 md:w-[min(1400px,calc(100%-2rem))] max-w-[1400px] items-center justify-between rounded-full border border-[#0B0B0D]/10 bg-white/90 backdrop-blur-sm px-4 sm:px-6 md:px-8 shadow-sm">
          <a
            href="https://tools.abidmahmud.cv"
            className="flex items-center gap-2 text-[#0B0B0D] font-bold text-lg hover:opacity-85 transition-opacity"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5846F6] text-white text-xs font-mono font-bold">
              LT
            </span>
            <span className="tracking-tight">LineTrace</span>
          </a>

          <nav className="flex items-center gap-1 sm:gap-2">
            <a
              href="https://tools.abidmahmud.cv"
              className="rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium text-[#4F4E55] hover:text-[#0B0B0D] hover:bg-[#0B0B0D]/5 transition-colors"
            >
              All Tools
            </a>
            <a
              href="https://tools.abidmahmud.cv/svg-optimizer"
              className="hidden sm:inline-flex rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium text-[#4F4E55] hover:text-[#0B0B0D] hover:bg-[#0B0B0D]/5 transition-colors"
            >
              SVG Optimizer
            </a>
            <a
              href="https://www.abidmahmud.cv"
              className="inline-flex items-center rounded-full bg-[#0B0B0D] text-white px-3.5 py-1.5 text-xs sm:text-sm font-medium hover:bg-[#5846F6] transition-colors"
            >
              Portfolio &rarr;
            </a>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-1">{children}</main>

        {/* Global Footer */}
        <footer className="border-t border-[#0B0B0D]/10 bg-white py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="space-y-1">
              <p className="font-semibold text-sm text-[#0B0B0D]">
                LineTrace &mdash; Free in-browser line art to vector converter
              </p>
              <p className="text-xs text-[#4F4E55]">
                Created by{' '}
                <a
                  href="https://www.abidmahmud.cv"
                  className="font-medium text-[#0B0B0D] underline underline-offset-2 hover:text-[#5846F6]"
                >
                  Abid Mahmud
                </a>
                , Brand Identity Designer. 100% private, client-side execution.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-[#4F4E55]">
              <a
                href="https://tools.abidmahmud.cv"
                className="hover:text-[#0B0B0D] transition-colors"
              >
                All Tools
              </a>
              <span>&bull;</span>
              <a
                href="https://tools.abidmahmud.cv/svg-optimizer"
                className="hover:text-[#0B0B0D] transition-colors"
              >
                SVG Optimizer
              </a>
              <span>&bull;</span>
              <a
                href="https://www.abidmahmud.cv"
                className="hover:text-[#0B0B0D] transition-colors"
              >
                Portfolio
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
