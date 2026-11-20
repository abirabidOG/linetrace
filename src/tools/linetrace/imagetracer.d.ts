export interface ImageTracerOptions {
  corsenabled?: boolean;
  ltres?: number;
  qtres?: number;
  pathomit?: number;
  rightangleenhance?: boolean;
  colorsampling?: number;
  numberofcolors?: number;
  mincolorratio?: number;
  colorquantization?: number;
  colorindices?: number[];
  blurradius?: number;
  blurdelta?: number;
  strokewidth?: number;
  linefilter?: boolean;
  scale?: number;
  roundcoords?: number;
  viewbox?: boolean;
  desc?: boolean;
  lcpr?: number;
  qcpr?: number;
  qcprthreshold?: number;
}

export interface ImageTracerInterface {
  imagedataToSVG(imageData: ImageData, options?: ImageTracerOptions): string;
  imageToSVG(url: string, callback?: (svgstr: string) => void, options?: ImageTracerOptions): void;
  appendSVGString(svgstr: string, parentid: string): void;
}

declare const ImageTracer: ImageTracerInterface;
export default ImageTracer;
export { ImageTracer };
