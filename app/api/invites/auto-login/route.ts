import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const autoLoginSchema = z.object({
  token: z.string(),
  name: z.string().min(1).optional(), // Optional, only needed if account doesn't exist
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, name } = autoLoginSchema.parse(body)

    // Find invite
    const invite = await prisma.studentInvite.findUnique({
      where: { token },
      include: { course: true },
    })

    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      )
    }

    if (invite.usedAt) {
      return NextResponse.json(
        { error: 'This invitation has already been used' },
        { status: 400 }
      )
    }

    if (new Date() > invite.expiresAt) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      )
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: invite.email },
    })

    // If user doesn't exist, create account
    if (!user) {
      // Use provided name, or generate from email (part before @)
      const userName = name || invite.email.split('@')[0] || 'Student'

      // Generate a random password (user won't need it, but required for database)
      const randomPassword = randomBytes(32).toString('hex')
      const hashedPassword = await bcrypt.hash(randomPassword, 10)

      user = await prisma.user.create({
        data: {
          name: userName,
          email: invite.email,
          password: hashedPassword,
          role: 'STUDENT',
        },
      })
    }

    // Don't mark invite as used here - let NextAuth do it after successful login
    // This ensures the invite is only marked as used after successful authentication

    // Return success - frontend will use inviteToken to login via NextAuth
    return NextResponse.json({
      success: true,
      email: user.email,
      name: user.name,
      courseTitle: invite.course.title,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

