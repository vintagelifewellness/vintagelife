import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import CnfModel from "@/model/c&fusers";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {},

      async authorize(credentials) {
        const { email, password } = credentials;
        try {
          await dbConnect();

          // 1. Search in UserModel first
          let user = await UserModel.findOne({ email });
          let isCnfUser = false;

          // 2. Search in CnfModel if not found in UserModel
          if (!user) {
            user = await CnfModel.findOne({ email });

            if (user) {
              // Validation for Approval Status
              if (user.Cnftype !== "3") {
                // This message is caught by res.error in your frontend
                throw new Error("Your account is not approved yet.");
              }
              isCnfUser = true;
            }
          }

          // 3. If user still not found in either model
          if (!user) {
            throw new Error("No user found with this email.");
          }

          // 4. Password validation (Safe check to ensure password exists in DB)
          if (!user.password) {
            throw new Error("Authentication failed. Please contact admin.");
          }

          const passwordMatch = await bcrypt.compare(password, user.password);
          if (!passwordMatch) {
            throw new Error("Invalid password.");
          }

          // 5. Success: Construct user object for JWT
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name || user.cfName || "User",
            dscode: user.dscode,
            activesp: user.activesp,
            usertype: isCnfUser ? null : user.usertype,
            Cnftype: isCnfUser ? user.Cnftype : null,
            mobileNo: isCnfUser ? user.mobileNo : null,
          };

        } catch (error) {
          // Log the error for your server logs
          console.error("Auth Error:", error.message);

          // Throwing the error here is critical for NextAuth to pass it to the frontend
          throw new Error(error.message);
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 365 * 24 * 60 * 60, // 1 year
    updateAge: 0,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.dscode = user.dscode;
        if (user.usertype) token.usertype = user.usertype; // Add usertype if exists
        if (user.Cnftype) token.Cnftype = user.Cnftype;    // Add Cnftype if exists
        if (user.mobileNo) token.mobileNo = user.mobileNo;    // Add Cnftype if exists

        if (user.activesp) token.activesp = user.activesp;    // Add Cnftype if exists
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.dscode = token.dscode;
      if (token.usertype) session.user.usertype = token.usertype;
      if (token.activesp) session.user.activesp = token.activesp;
      if (token.Cnftype) session.user.Cnftype = token.Cnftype;
      if (token.mobileNo) session.user.mobileNo = token.mobileNo;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/signin",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
