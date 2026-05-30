from insightface.app import FaceAnalysis
import cv2

app = FaceAnalysis(name="buffalo_l")
app.prepare(ctx_id=-1)

def get_embedding(image_path):
    img = cv2.imread(image_path)

    if img is None:
        print("❌ Image not found:", image_path)
        return None

    faces = app.get(img)

    print("Faces detected:", len(faces))

    if len(faces) == 0:
        return None

    embedding = faces[0].embedding.tolist()

    print("Embedding length:", len(embedding))

    return embedding