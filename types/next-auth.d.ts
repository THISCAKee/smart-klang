import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isRegistered: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    isRegistered?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    provider?: string;
    isRegistered?: boolean;
  }
}
