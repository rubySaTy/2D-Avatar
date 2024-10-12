import axios from "axios";

export function validateUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9._-]+$/;
  return usernameRegex.test(username) && username.length > 0;
}

export function validatePassword(password: string): boolean {
  return password.length > 0;
}

export function validateRole(role: string): role is "admin" | "therapist" {
  const validRoles = ["admin", "therapist"] as const;
  return validRoles.includes(role as "admin" | "therapist");
}

export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 5000, // 5 seconds timeout
      maxContentLength: 10 * 1024 * 1024, // 10MB max size
    });

    const contentType = response.headers["content-type"];
    return contentType.startsWith("image/");
  } catch (error) {
    console.error("Error validating image URL:", error);
    return false;
  }
}
