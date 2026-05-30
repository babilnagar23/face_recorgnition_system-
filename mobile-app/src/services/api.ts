
import axios from "axios";

export const API = axios.create({
  baseURL: "http://10.209.216.176:8000/api",
});


export async function registerFace(
  employeeId: string,
  imageUri: string
) {
  try {
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

    const response = await API.post(
      "/face/register/",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("✅ Registration successful");
    return response.data;

  } catch (error: any) {
    console.error(
      "Registration failed:",
      error.response?.data?.error || error.message
    );

    throw error;
  }
}

export async function loginFace(
  employeeId: string,
  imageUri: string
) {
  try {
    const formData = new FormData();

    formData.append("employee_id", employeeId);

    formData.append("image", {
      uri: imageUri,
      name: "face.jpg",
      type: "image/jpeg",
    } as any);

    const response = await API.post(
      "/face/login/",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("✅ Authentication check complete");
    return response.data;
  } catch (error: any) {
    console.error(
      "Authentication failed:",
      error.response?.data?.error || error.message
    );

    throw error;
  }
}
