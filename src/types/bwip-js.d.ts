declare module "bwip-js" {
  type BarcodeOptions = {
    bcid: string;
    text: string;
    scale?: number;
    height?: number;
    includetext?: boolean;
    backgroundcolor?: string;
    barcolor?: string;
    paddingwidth?: number;
    paddingheight?: number;
  };

  const bwipjs: {
    toSVG(options: BarcodeOptions): string;
  };

  export default bwipjs;
}
