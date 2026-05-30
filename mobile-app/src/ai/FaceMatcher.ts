
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
  // Matching threshold standardized with backend (0.65)
  const MATCH_THRESHOLD = 0.65;

  const score = cosineSimilarity(
    registered,
    current
  );

  const matched = score >= MATCH_THRESHOLD;

  if (matched) {
    console.log("✅ AUTHENTICATED - Score:", score.toFixed(3));
  } else {
    console.log("❌ ACCESS DENIED - Score:", score.toFixed(3));
  }

  return matched;
}