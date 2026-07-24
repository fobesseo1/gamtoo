/** A placeholder portrait photo (sky + rounded body + head) used to preview
 * photo-category templates before a real user photo exists. */
export function createSamplePhotoBlob(): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#8ec9e8";
  ctx.fillRect(0, 0, 800, 1000);
  ctx.fillStyle = "#2a2a2a";
  ctx.beginPath();
  ctx.roundRect(300, 350, 200, 500, 40);
  ctx.fill();
  ctx.fillStyle = "#e0ac82";
  ctx.beginPath();
  ctx.arc(400, 260, 110, 0, Math.PI * 2);
  ctx.fill();
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
}
