export interface FaceBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function cropFace(
  image: any,
  bounds: FaceBounds
) {
  console.log("📸 Original Image:", image);

  console.log("✂️ Crop Bounds:", bounds);

  const croppedFace = {
    image,
    bounds,
  };

  return croppedFace;
}