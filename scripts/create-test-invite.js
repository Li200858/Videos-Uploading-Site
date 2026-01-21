/**
 * 创建测试邀请链接脚本
 * 使用方法: node scripts/create-test-invite.js <email> <courseId>
 * 
 * 这个脚本可以帮助您创建一个测试邀请链接，使用指定的域名
 */

const { PrismaClient } = require('@prisma/client')
const { randomBytes } = require('crypto')
const prisma = new PrismaClient()

async function createTestInvite(email, courseId, baseUrl) {
  try {
    // 检查课程是否存在
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!course) {
      console.error('❌ 课程不存在:', courseId)
      process.exit(1)
    }

    // 检查是否已有未使用的邀请
    const existingInvite = await prisma.studentInvite.findFirst({
      where: {
        email,
        courseId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    })

    if (existingInvite) {
      const inviteUrl = `${baseUrl}/login?email=${encodeURIComponent(email)}&token=${existingInvite.token}`
      console.log('\n✅ 已存在未使用的邀请:')
      console.log('📧 邮箱:', email)
      console.log('📚 课程:', course.title)
      console.log('🔗 邀请链接:', inviteUrl)
      console.log('⏰ 过期时间:', existingInvite.expiresAt.toLocaleString())
      return
    }

    // 创建新邀请
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7天后过期

    // 需要提供一个教师ID，这里使用课程创建者ID
    const invite = await prisma.studentInvite.create({
      data: {
        email,
        courseId,
        token,
        expiresAt,
        createdByUserId: course.teacherId,
      },
    })

    const inviteUrl = `${baseUrl}/login?email=${encodeURIComponent(email)}&token=${token}`

    console.log('\n✅ 邀请创建成功!')
    console.log('📧 邮箱:', email)
    console.log('📚 课程:', course.title)
    console.log('🔗 邀请链接:', inviteUrl)
    console.log('⏰ 过期时间:', expiresAt.toLocaleString())
    console.log('\n💡 提示: 确保在 Render 环境变量中设置了正确的 NEXTAUTH_URL')

  } catch (error) {
    console.error('❌ 错误:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 从命令行参数获取
const args = process.argv.slice(2)
if (args.length < 2) {
  console.log('使用方法: node scripts/create-test-invite.js <email> <courseId> [baseUrl]')
  console.log('\n示例:')
  console.log('  node scripts/create-test-invite.js student@example.com <course-id>')
  console.log('  node scripts/create-test-invite.js student@example.com <course-id> https://your-app.onrender.com')
  process.exit(1)
}

const email = args[0]
const courseId = args[1]
const baseUrl = args[2] || process.env.NEXTAUTH_URL || 'http://localhost:3000'

createTestInvite(email, courseId, baseUrl)

