import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";
import NaverProvider from "next-auth/providers/naver";
import { findUserByEmail, createUser } from "./pinecone";
import bcrypt from "bcryptjs";

const providers = [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID || "google-placeholder-id",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "google-placeholder-secret",
  }),
  KakaoProvider({
    clientId: process.env.KAKAO_CLIENT_ID || "kakao-placeholder-id",
    clientSecret: process.env.KAKAO_CLIENT_SECRET || "kakao-placeholder-secret",
  }),
  NaverProvider({
    clientId: process.env.NAVER_CLIENT_ID || "naver-placeholder-id",
    clientSecret: process.env.NAVER_CLIENT_SECRET || "naver-placeholder-secret",
  }),
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error("이메일과 비밀번호를 입력해주세요.");
      }

      const user = await findUserByEmail(credentials.email);

      if (!user || !user.hashedPassword) {
        throw new Error("가입되지 않은 이메일이거나 비밀번호가 다릅니다.");
      }

      const isValid = await bcrypt.compare(credentials.password, user.hashedPassword);
      if (!isValid) {
        throw new Error("비밀번호가 일치하지 않습니다.");
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      };
    },
  })
];

export const authOptions: AuthOptions = {
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "credentials" && user.email) {
        // Find or create user for Social Logins
        let dbUser = await findUserByEmail(user.email);

        if (!dbUser) {
          await createUser({
            email: user.email,
            name: user.name || "학습자",
            image: user.image || "",
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.email = user.email;
        if (account && account.provider !== "credentials" && user.email) {
          const dbUser = await findUserByEmail(user.email);
          token.id = dbUser ? dbUser.id : user.id;
        } else {
          token.id = user.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        if (token.email) {
          const dbUser = await findUserByEmail(token.email);
          if (dbUser) {
            session.user.name = dbUser.characterName || dbUser.name || session.user.name;
            session.user.image = dbUser.characterImage || dbUser.image || session.user.image;
          }
        }
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET || "woolini-dev-secret-2026",
};
