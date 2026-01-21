import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { Role } from "@prisma/client"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        inviteToken: { label: 'Invite Token', type: 'text' }, // For invite-based login
      },
      async authorize(credentials) {
        // If inviteToken is provided, handle invite-based login (no password required)
        if (credentials?.inviteToken && credentials?.email) {
          const invite = await prisma.studentInvite.findUnique({
            where: { token: credentials.inviteToken },
          })

          if (!invite) {
            return null
          }

          // Verify email matches
          if (invite.email !== credentials.email) {
            return null
          }

          // Check if invite is valid
          if (invite.usedAt || new Date() > invite.expiresAt) {
            return null
          }

          // Get user (must exist, as auto-login API creates it first)
          const user = await prisma.user.findUnique({
            where: { email: invite.email },
          })

          if (!user) {
            return null
          }

          // Mark invite as used (if not already used)
          if (!invite.usedAt) {
            await prisma.studentInvite.update({
              where: { id: invite.id },
              data: { usedAt: new Date() },
            })
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        }

        // Normal password-based login
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
     if (session.user) {
  session.user.id = token.id as string
  session.user.role = token.role as Role // ✅ cast to the Role enum instead of string
}
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET ?? undefined,
}

