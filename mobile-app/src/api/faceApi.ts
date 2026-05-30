const BASE_URL =
  "http://10.209.216.176:8000/api";

export async function loginFace(
  employeeId: string,
  imageUri: string
) {
  const formData = new FormData();

  formData.append(
    "employee_id",
    employeeId
  );

  formData.append("image", {
    uri: imageUri,
    name: "face.jpg",
    type: "image/jpeg",
  } as any);

  const response =
    await fetch(
      `${BASE_URL}/face/login/`,
      {
        method: "POST",
        body: formData,
      }
    );

  return response.json();
}