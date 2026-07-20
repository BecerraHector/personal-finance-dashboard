import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET ?? "dev-secret";

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, SECRET);
    if (typeof payload === "object" && typeof payload.sub === "string") {
      return payload.sub;
    }
    return null;
  } catch {
    return null;
  }
}
