export let registeredEmbedding: number[] | null = null;

export async function saveEmbedding(
  embedding: number[]
) {
  registeredEmbedding = embedding;

  console.log("💾 Face Saved");
}

export async function getEmbedding() {
  return registeredEmbedding;
}