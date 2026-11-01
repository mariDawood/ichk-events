import "server-only";
import bwipjs from "bwip-js";

export function barcodeSvg(text: string) {
  const svg = bwipjs.toSVG({
    bcid: "code128",
    text,
    scale: 3,
    height: 14,
    includetext: false,
    backgroundcolor: "ffffff",
    barcolor: "1c1915",
    paddingwidth: 8,
    paddingheight: 6,
  });

  if (!svg.startsWith("<svg") || svg.toLowerCase().includes("<script")) {
    throw new Error("Unexpected barcode markup");
  }

  return svg;
}
