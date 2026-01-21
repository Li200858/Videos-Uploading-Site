import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Find invite
    const invite = await prisma.studentInvite.findUnique({
      where: { token },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    })

    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid invitation token', valid: false },
        { status: 404 }
      )
    }

    // Check if already used
    if (invite.usedAt) {
      return NextResponse.json(
        {
          error: 'This invitation has already been used',
          valid: false,
          used: true,
          email: invite.email,
          courseTitle: invite.course.title,
        },
        { status: 400 }
      )
    }

    // Check if expired
    if (new Date() > invite.expiresAt) {
      return NextResponse.json(
        {
          error: 'This invitation has expired',
          valid: false,
          expired: true,
          email: invite.email,
          courseTitle: invite.course.title,
          expiresAt: invite.expiresAt,
        },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email },
    })

    return NextResponse.json({
      valid: true,
      email: invite.email,
      courseTitle: invite.course.title,
      courseDescription: invite.course.description,
      expiresAt: invite.expiresAt,
      userExists: !!existingUser,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error', valid: false },
      { status: 500 }
    )
  }
}

