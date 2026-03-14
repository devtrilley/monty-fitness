import Cropper from "react-easy-crop";
import { useState, useCallback } from "react";

function createImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.setAttribute("crossOrigin", "anonymous");
    img.src = url;
  });
}

async function getCroppedBlob(imageSrc, croppedAreaPixels, mimeType = "image/jpeg") {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    croppedAreaPixels.width,
    croppedAreaPixels.height
  );
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, 0.92);
  });
}

export default function CropPhotoModal({ imageSrc, mimeType, onConfirm, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels, mimeType);
      onConfirm(blob);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col"
      style={{ background: "var(--color-bg)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <button
          onClick={onCancel}
          className="text-sm font-bold uppercase tracking-[0.15em]"
          style={{ color: "var(--color-muted)", fontFamily: "monospace" }}
        >
          Cancel
        </button>

        <p
          className="text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: "var(--color-text)", fontFamily: "monospace" }}
        >
          Crop Photo
        </p>

        <button
          onClick={handleConfirm}
          disabled={processing || !croppedAreaPixels}
          className="text-sm font-bold uppercase tracking-[0.15em]"
          style={{
            color: processing ? "var(--color-muted)" : "var(--color-accent)",
            fontFamily: "monospace",
          }}
        >
          {processing ? "..." : "Use Photo"}
        </button>
      </div>

      {/* Cropper area */}
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { background: "#000" },
            cropAreaStyle: {
              border: "2px solid var(--color-accent)",
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.72)",
            },
          }}
        />
      </div>

      {/* Zoom slider */}
      <div
        className="px-8 pt-4 pb-10 shrink-0"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: "var(--color-accent)" }}
        />
        <p
          className="text-center text-[10px] uppercase tracking-[0.2em] mt-2"
          style={{ color: "var(--color-muted)" }}
        >
          Pinch or slide to zoom
        </p>
      </div>
    </div>
  );
}