import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendInviteEmail } from '@/lib/email'
import { z } from 'zod'

const resendSchema = z.object({
  inviteId: z.string(),
})

// Helper function to get base URL from request
function getBaseUrl(request: Request): string {
  // Try to get from environment variable first (for production)
  if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes('localhost')) {
    return process.env.NEXTAUTH_URL
  }
  
  // Otherwise, get from request URL
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { inviteId } = resendSchema.parse(body)

    // Find invite
    const invite = await prisma.studentInvite.findUnique({
      where: { id: inviteId },
      include: {
        course: true,
      },
    })

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    // Verify course ownership
    if (invite.course.teacherId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if invite is already used
    if (invite.usedAt) {
      return NextResponse.json(
        { error: 'This invitation has already been used' },
        { status: 400 }
      )
    }

    // Generate invite URL - redirect to login page with email and token
    const baseUrl = getBaseUrl(request)
    const inviteUrl = `${baseUrl}/login?email=${encodeURIComponent(invite.email)}&token=${invite.token}`

    // Send email
    const emailResult = await sendInviteEmail({
      to: invite.email,
      inviteUrl,
      courseTitle: invite.course.title,
      courseDescription: invite.course.description,
      expiresAt: invite.expiresAt,
    })

    if (!emailResult.success) {
      return NextResponse.json(
        { 
          error: 'Failed to send email', 
          details: emailResult.error,
          inviteUrl, // Still return the URL so teacher can manually send it
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Email sent successfully',
      inviteUrl,
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

