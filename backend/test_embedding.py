from api.face_service import get_embedding

embedding = get_embedding("test_face.jpg")

if embedding:
    print("Length:", len(embedding))
else:
    print("No face detected")