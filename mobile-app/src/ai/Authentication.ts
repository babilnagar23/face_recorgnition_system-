import { getEmbedding } from "../storage/FaceDatabase";
import { matchFaces } from "./FaceMatcher";

export async function authenticateFace(
  croppedFace: any
) {
  const registered =
    await getEmbedding();

  if (!registered) {
    console.log("❌ No registered face");
    return false;
  }
   
  return true;

}