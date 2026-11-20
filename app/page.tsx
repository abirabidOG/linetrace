import { ArrowLeft, Sparkles } from 'lucide-react';
import LineTraceTool from '../src/tools/linetrace/LineTraceTool';
import SeoSection from '../src/tools/linetrace/SeoSection';
import FaqSection from '../src/tools/linetrace/FaqSection';
import { BrandIdentityCtaCard } from '../src/components/BrandIdentityCtaCard';
import { FAQS } from '../src/tools/linetrace/faqs';

export const metadata = {
  title: 'LineTrace: Free Line Art to Vector Converter (SVG, No Sign-Up)',
  description:
    'Turn line art into clean vectors. Free, in your browser, no sign-up. SVG, PNG and ZIP export, files never leave your device.',
  alternates: {
    canonical: 'https://tools.abidmahmud.cv/linetrace',
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

export default function Home() {
  const jsonLdFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  const jsonLdApp = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'LineTrace: Free Line Art to Vector Converter',
    url: 'https://tools.abidmahmud.cv/linetrace',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'All (Browser-based)',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      'Turn line art into clean vectors. Free, in your browser, no sign-up. Pure client-side ImageTracer engine, real-time bitmap preprocessing, honest 4-stage pipeline, and genuine Pixel IoU verification.',
    browserRequirements:
      'Requires modern browser with HTML5 Canvas support (Chrome, Safari, Firefox, Edge).',
    author: {
      '@type': 'Person',
      name: 'Abid Mahmud',
      url: 'https://www.abidmahmud.cv',
      jobTitle: 'Brand Identity Designer',
    },
  };

  return (
    <div className="min-h-screen bg-white text-[#0B0B0D] pt-24 pb-20 selection:bg-[#5846F6]/10 selection:text-[#5846F6]">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdApp) }}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <a
            href="https://tools.abidmahmud.cv"
            className="inline-flex items-center gap-2 rounded-full border border-[#0B0B0D]/10 bg-[#F4F2EC] px-4 py-2 font-mono text-xs font-semibold text-[#0B0B0D] transition-colors hover:border-[#0B0B0D]/30 hover:bg-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>All Free Tools</span>
          </a>

          <span className="inline-flex items-center gap-2 font-mono text-xs font-medium text-[#4F4E55]">
            <span className="h-2 w-2 rounded-full bg-[#5846F6] animate-pulse" />
            v1.0 Client-Side Ready
          </span>
        </div>

        {/* Hero Header */}
        <div className="pt-4 pb-8 sm:pb-12 text-center max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5846F6]/10 border border-[#5846F6]/20 text-xs font-mono font-medium text-[#5846F6]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>100% Client-Side • Pure In-Browser Vector Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#0B0B0D] leading-[1.05]">
            LineTrace
          </h1>

          <p className="text-base sm:text-lg text-[#4F4E55] max-w-2xl mx-auto font-normal leading-relaxed">
            Turn line art into clean vectors. Free, in your browser, no sign-up.
          </p>
        </div>

        {/* Core LineTrace Tool */}
        <LineTraceTool />

        {/* Educational SEO & Explanation Section */}
        <div className="mt-20">
          <SeoSection />
        </div>

        {/* FAQ Accordion Section */}
        <div className="mt-16">
          <FaqSection />
        </div>

        {/* Attached Brand Identity CTA Card */}
        <div className="mt-16">
          <BrandIdentityCtaCard />
        </div>
      </div>
    </div>
  );
}
