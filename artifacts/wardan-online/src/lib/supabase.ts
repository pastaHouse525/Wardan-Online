import imageCompression from "browser-image-compression";

export interface UploadProgress {
  phase: "compressing" | "uploading";
  percent: number;
}

export async function uploadListingImage(
  file: File,
  onProgress?: (p: UploadProgress) => void
): Promise<string> {
  onProgress?.({ phase: "compressing", percent: 0 });

  const compressed = await imageCompression(file, {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1400,
    useWebWorker: true,
    onProgress: (pct) => onProgress?.({ phase: "compressing", percent: pct }),
    fileType: "image/webp",
  });

  onProgress?.({ phase: "uploading", percent: 0 });

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", compressed, compressed.name.replace(/\.\w+$/, ".webp"));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress?.({ phase: "uploading", percent: Math.round((e.loaded / e.total) * 100) });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText) as { url: string };
        resolve(data.url);
      } else {
        const err = JSON.parse(xhr.responseText) as { error?: string };
        reject(new Error(err.error ?? "Image upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });
}
