# 邮件发送功能配置指南

## 功能说明

现在邀请功能已经支持自动发送邮件到学生邮箱！当教师创建邀请时，系统会自动发送一封包含邀请链接的邮件给学生。

## 环境变量配置

在 `.env.local` 文件（本地开发）或 Render 的环境变量设置中添加以下配置：

### 必需的环境变量

```bash
# SMTP 邮件服务器配置
SMTP_HOST=smtp.example.com          # SMTP服务器地址
SMTP_PORT=587                       # SMTP端口（587用于TLS，465用于SSL）
SMTP_USER=your-email@example.com    # 发送邮件的邮箱账号
SMTP_PASSWORD=your-email-password    # 邮箱密码或应用专用密码
SMTP_FROM=noreply@example.com       # 发件人邮箱（可选，默认使用SMTP_USER）
```

### 常用邮件服务商配置示例

#### Gmail
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # 需要使用应用专用密码，不是Gmail密码
SMTP_FROM=noreply@yourdomain.com
```

**注意**：Gmail需要使用"应用专用密码"，不是普通密码。设置方法：
1. 登录Google账号
2. 进入"安全性" → "两步验证"
3. 生成"应用专用密码"

#### Outlook/Hotmail
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@yourdomain.com
```

#### 163邮箱
```bash
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_USER=your-email@163.com
SMTP_PASSWORD=your-auth-code  # 163邮箱需要使用授权码，不是密码
SMTP_FROM=noreply@yourdomain.com
```

**注意**：163邮箱需要使用"授权码"，不是登录密码。设置方法：
1. 登录163邮箱
2. 进入"设置" → "POP3/SMTP/IMAP"
3. 开启SMTP服务并生成授权码

#### QQ邮箱
```bash
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your-email@qq.com
SMTP_PASSWORD=your-auth-code  # QQ邮箱需要使用授权码
SMTP_FROM=noreply@yourdomain.com
```

**注意**：QQ邮箱需要使用"授权码"，设置方法类似163邮箱。

#### SendGrid（推荐用于生产环境）
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
```

#### Mailgun（推荐用于生产环境）
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@yourdomain.com
SMTP_PASSWORD=your-mailgun-password
SMTP_FROM=noreply@yourdomain.com
```

## 功能特性

### 1. 自动发送邮件
- 创建邀请时自动发送邮件
- 如果已存在未使用的邀请，会重新发送邮件

### 2. 重新发送邮件
- 在邀请列表中点击"Resend Email"按钮可以重新发送邮件

### 3. 邮件内容
邮件包含：
- 课程名称和描述
- 邀请链接（可点击按钮）
- 过期时间提醒
- 美观的HTML格式

### 4. 容错处理
- 如果邮件发送失败，不会影响邀请创建
- 邀请链接仍然可以手动复制发送
- 系统会在控制台记录错误信息

## 测试邮件功能

### 本地测试
1. 配置好环境变量
2. 启动开发服务器：`npm run dev`
3. 创建测试邀请
4. 检查学生邮箱是否收到邮件

### 生产环境测试
1. 在 Render 中配置环境变量
2. 重新部署应用
3. 创建测试邀请
4. 检查邮件是否正常发送

## 故障排查

### 邮件发送失败
1. **检查环境变量**：确保所有SMTP配置都正确
2. **检查端口**：587用于TLS，465用于SSL
3. **检查密码**：Gmail/163/QQ需要使用应用专用密码或授权码
4. **检查防火墙**：确保服务器可以访问SMTP端口
5. **查看日志**：检查服务器控制台的错误信息

### 邮件未收到
1. 检查垃圾邮件文件夹
2. 确认邮箱地址正确
3. 检查邮件服务商的发送限制
4. 查看服务器日志确认是否发送成功

## 注意事项

1. **免费邮箱限制**：Gmail、163等免费邮箱通常有每日发送限制
2. **生产环境**：建议使用专业的邮件服务（SendGrid、Mailgun等）
3. **安全性**：不要在代码中硬编码密码，使用环境变量
4. **测试**：在生产环境部署前，先测试邮件功能是否正常

## 未配置邮件服务的情况

如果未配置邮件服务，系统会：
- 仍然创建邀请
- 在控制台输出邀请链接
- 教师可以手动复制链接发送给学生
- 不会因为邮件发送失败而报错

