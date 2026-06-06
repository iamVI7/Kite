import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function useQRCode(text) {
  const [dataUrl, setDataUrl] = useState(null);

  useEffect(() => {
    if (!text) return;
    QRCode.toDataURL(text, {
      width: 240,
      margin: 2,
      color: { dark: "#1a1a24", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).then(setDataUrl);
  }, [text]);

  return dataUrl;
}
