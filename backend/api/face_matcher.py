import numpy as np


def cosine_similarity(a, b):
    a = np.array(a)
    b = np.array(b)

    return np.dot(a, b) / (
        np.linalg.norm(a)
        * np.linalg.norm(b)
    )


def match_faces(
    stored_embedding,
    current_embedding,
    threshold=0.65
):
    score = cosine_similarity(
        stored_embedding,
        current_embedding
    )

    return score >= threshold, float(score)