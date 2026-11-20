export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQS: FaqItem[] = [
  {
    question: 'What is vector tracing?',
    answer:
      'Vector tracing converts pixel-based raster graphics (such as PNG or JPG sketches, logos, and signatures) into resolution-independent mathematical paths (SVG). Vectors can scale to any size, from a tiny favicon to a massive outdoor billboard, without pixelation or loss of clarity.',
  },
  {
    question: 'Will my files be uploaded to a server?',
    answer:
      'No. LineTrace runs 100% in your web browser using client-side JavaScript and the HTML5 Canvas API. Your images never leave your computer or phone, and no image data is ever transmitted across the internet.',
  },
  {
    question: 'What makes a good source image?',
    answer:
      'Clear contrast between dark line art and a light background produces the cleanest vector results. High-contrast ink drawings, scanned sketches on white paper, clean monochrome icons, and bold signatures yield crisp outlines with minimal node noise.',
  },
  {
    question: 'Why is my trace missing thin lines?',
    answer:
      'If thin lines or delicate strokes disappear, switch to the Signature preset or choose Precise quality mode. You can also lower the Path Optimization slider toward Exact match to retain fine details, or adjust the Threshold slider so lighter pencil strokes get picked up.',
  },
  {
    question: 'Can I use the vectors commercially?',
    answer:
      'Yes. Vectors traced from your own artwork or designs are 100% yours to use commercially or personally. LineTrace adds no watermarks, charges no licensing fees, and requires no attribution.',
  },
];
