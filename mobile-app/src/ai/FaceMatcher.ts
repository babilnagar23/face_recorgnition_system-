
export function cosineSimilarity(
  a: number[],
  b: number[]
) {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  return dot / (
    Math.sqrt(magA) *
    Math.sqrt(magB)
  );
}

export function matchFaces(
  registered: number[],
  current: number[]
) {
  const score = cosineSimilarity(
    registered,
    current
  );

  console.log("🎯 Similarity:", score);

  const matched = score > 0.7;

  console.log(
    matched
      ? "✅ AUTHENTICATED"
      : "❌ ACCESS DENIED"
  );

  return matched;
}