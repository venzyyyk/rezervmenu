import type { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & { role: "ADMIN" | "MANAGER" };
  }
  interface User {
    role: "ADMIN" | "MANAGER";
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: "ADMIN" | "MANAGER";
  }
}
