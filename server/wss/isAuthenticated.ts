import verifyTokenAsync from "./verifyTokenAsync";

export default async function isAuthenticated(token: string): Promise<boolean> {
  if (!token) {
    return false;
  }
  try {
    const isValidToken = await verifyTokenAsync(token, process.env.JWT_SIGNATURE || "");
    if (!isValidToken) {
      return false;
    }
    return true;
  } catch (_e) {
    return false;
  }
}
