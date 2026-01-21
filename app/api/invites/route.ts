import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { z } from 'zod'
import { sendInviteEmail } from '@/lib/email'

const inviteSchema = z.object({
  email: z.string().email(),
  courseId: z.string(),
})

// Helper function to get base URL from request
function getBaseUrl(request: Request): string {
  // Priority 1: Use NEXTAUTH_URL if set and not localhost
  if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes('localhost')) {
    return process.env.NEXTAUTH_URL
  }
  
  // Priority 2: Try to get from request headers (for production behind proxy)
  const host = request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 
                   (request.url.startsWith('https') ? 'https' : 'http')
  
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    return `${protocol}://${host}`
  }
  
  // Priority 3: Get from request URL
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '未登录，请先登录' }, { status: 401 })
    }
    
    if (session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: '权限不足，只有教师可以创建邀请' }, { status: 403 })
    }

    const body = await request.json()
    const { email, courseId } = inviteSchema.parse(body)

    // Verify course ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!course) {
      return NextResponse.json({ error: '课程不存在' }, { status: 404 })
    }

    if (course.teacherId !== session.user.id) {
      return NextResponse.json({ error: '无权访问此课程' }, { status: 403 })
    }

    // Check if invite already exists for this email and course
    const existingInvite = await prisma.studentInvite.findFirst({
      where: {
        email,
        courseId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    })

    if (existingInvite) {
      const baseUrl = getBaseUrl(request)
      const inviteUrl = `${baseUrl}/login?email=${encodeURIComponent(email)}&token=${existingInvite.token}`
      
      // Optionally resend email for existing invite
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      })
      
      if (course) {
        sendInviteEmail({
          to: email,
          inviteUrl,
          courseTitle: course.title,
          courseDescription: course.description,
          expiresAt: existingInvite.expiresAt,
        }).catch((error) => {
          console.error('Failed to resend invite email:', error)
        })
      }
      
      return NextResponse.json(
        { 
          ...existingInvite, 
          inviteUrl,
          message: '此邮箱已存在未使用的邀请，已重新发送邮件',
        },
        { status: 200 }
      )
    }

    // Generate unique token
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

    const invite = await prisma.studentInvite.create({
      data: {
        email,
        courseId,
        token,
        expiresAt,
        createdByUserId: session.user.id,
      },
    })

    // Return invite with URL - redirect to login page with email and token
    const baseUrl = getBaseUrl(request)
    const inviteUrl = `${baseUrl}/login?email=${encodeURIComponent(email)}&token=${token}`

    console.log('Invite created:', { id: invite.id, email, courseId, inviteUrl })

    // Send email invitation (don't wait for it to complete)
    sendInviteEmail({
      to: email,
      inviteUrl,
      courseTitle: course.title,
      courseDescription: course.description,
      expiresAt: invite.expiresAt,
    }).catch((error) => {
      console.error('Failed to send invite email:', error)
      // Don't fail the request if email fails
    })

    return NextResponse.json(
      { ...invite, inviteUrl, emailSent: true },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating invite:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '输入格式错误', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId is required' },
        { status: 400 }
      )
    }

    // Verify course ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!course || course.teacherId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const invites = await prisma.studentInvite.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
    })

    // Generate inviteUrl for each invite
    const baseUrl = getBaseUrl(request)
    const invitesWithUrl = invites.map((invite) => ({
      ...invite,
      inviteUrl: `${baseUrl}/login?email=${encodeURIComponent(invite.email)}&token=${invite.token}`,
    }))

    return NextResponse.json(invitesWithUrl)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

