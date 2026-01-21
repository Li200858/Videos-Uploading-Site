import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const acceptLoginSchema = z.object({
  token: z.string(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { token } = acceptLoginSchema.parse(body)

    // Find invite
    const invite = await prisma.studentInvite.findUnique({
      where: { token },
    })

    if (!invite) {
      // Invite not found, but don't fail - might already be used
      return NextResponse.json({ message: 'Invite not found or already used' })
    }

    // Check if email matches logged in user
    if (invite.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Email mismatch' },
        { status: 400 }
      )
    }

    // Mark invite as used if not already used
    if (!invite.usedAt) {
      await prisma.studentInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      })
    }

    return NextResponse.json({ message: 'Invite marked as used' })
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

