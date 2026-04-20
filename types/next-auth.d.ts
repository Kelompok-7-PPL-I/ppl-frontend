import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      peran: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    peran: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    peran: string;
  }
}
