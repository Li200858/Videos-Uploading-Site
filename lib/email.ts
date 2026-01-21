import nodemailer from 'nodemailer'

interface SendInviteEmailParams {
  to: string
  inviteUrl: string
  courseTitle: string
  courseDescription?: string | null
  expiresAt: Date
}

export async function sendInviteEmail({
  to,
  inviteUrl,
  courseTitle,
  courseDescription,
  expiresAt,
}: SendInviteEmailParams) {
  // 检查是否配置了邮件服务
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT
  const smtpUser = process.env.SMTP_USER
  const smtpPassword = process.env.SMTP_PASSWORD
  const smtpFrom = process.env.SMTP_FROM || smtpUser

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
    console.warn('Email service not configured. Skipping email send.')
    console.log('Invite URL:', inviteUrl)
    return { success: false, error: 'Email service not configured' }
  }

  try {
    // 创建邮件传输器
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: smtpPort === '465', // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    })

    // 邮件内容
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>课程邀请</h1>
            </div>
            <div class="content">
              <p>您好！</p>
              <p>您已被邀请加入课程：<strong>${courseTitle}</strong></p>
              ${courseDescription ? `<p>${courseDescription}</p>` : ''}
              <p>请点击下面的链接创建您的学生账号并加入课程：</p>
              <div style="text-align: center;">
                <a href="${inviteUrl}" class="button">接受邀请</a>
              </div>
              <p style="margin-top: 20px;">或者复制以下链接到浏览器中打开：</p>
              <p style="word-break: break-all; color: #4f46e5;">${inviteUrl}</p>
              <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
                此邀请链接将在 ${new Date(expiresAt).toLocaleDateString('zh-CN')} 过期。
              </p>
            </div>
            <div class="footer">
              <p>此邮件由系统自动发送，请勿回复。</p>
            </div>
          </div>
        </body>
      </html>
    `

    const textContent = `
课程邀请

您好！

您已被邀请加入课程：${courseTitle}
${courseDescription ? `\n${courseDescription}\n` : ''}

请访问以下链接创建您的学生账号并加入课程：
${inviteUrl}

此邀请链接将在 ${new Date(expiresAt).toLocaleDateString('zh-CN')} 过期。

此邮件由系统自动发送，请勿回复。
    `

    // 发送邮件
    const info = await transporter.sendMail({
      from: `"教育平台" <${smtpFrom}>`,
      to,
      subject: `课程邀请：${courseTitle}`,
      text: textContent,
      html: htmlContent,
    })

    console.log('Email sent successfully:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    console.error('Error sending email:', error)
    return { success: false, error: error.message }
  }
}

