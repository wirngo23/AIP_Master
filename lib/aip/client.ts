export async function api<T = Record<string, unknown>>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, { credentials: "same-origin", ...options });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok)
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "This action could not be completed. Please try again.",
    );
  return data as T;
}
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function normalizePhoto(file: File): Promise<Blob> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Choose a JPG, PNG, or WebP image.");
  if (file.size > 12_000_000)
    throw new Error("Choose an image smaller than 12 MB.");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("This image could not be read."));
      i.src = url;
    });
    if (img.width < 300 || img.height < 300)
      throw new Error("Use a portrait at least 300 × 300 pixels.");
    if (img.width * img.height > 40_000_000)
      throw new Error("Choose a photo under 40 megapixels.");
    const scale = Math.min(1, 1400 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#10191b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve, reject) =>
      canvas.toBlob(
        (b) =>
          b
            ? resolve(b)
            : reject(new Error("The photo could not be processed.")),
        "image/jpeg",
        0.92,
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
