# 环境变量配置说明

## 必需的环境变量

在部署到 Render 之前，您需要设置以下环境变量：

### 1. DATABASE_URL

MongoDB Atlas 连接字符串，格式：

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<database_name>?retryWrites=true&w=majority
```

**获取步骤：**
1. 登录 MongoDB Atlas
2. 点击 "Connect" → "Connect your application"
3. 复制连接字符串
4. 替换 `<username>`, `<password>`, `<database_name>` 为实际值

### 2. NEXTAUTH_URL

应用的完整 URL。

**本地开发：**
```
http://localhost:3000
```

**生产环境（Render）：**
```
https://videos-uploading-site-kfha.onrender.com
```

⚠️ **注意**：首次部署时可以先使用 `http://localhost:3000`，部署成功后再更新为实际的 Render URL。

### 3. NEXTAUTH_SECRET

用于加密 NextAuth.js session 的密钥。必须是一个随机字符串。

**生成方法：**

使用 OpenSSL：
```bash
openssl rand -base64 32
```

使用 Node.js：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. NODE_ENV

环境类型：
- 开发环境：`development`
- 生产环境：`production`

## 在 Render 中设置环境变量

1. 登录 Render Dashboard
2. 选择您的服务
3. 进入 "Environment" 标签
4. 点击 "Add Environment Variable"
5. 添加上述所有变量

### 4. 邮件服务配置（可选，用于自动发送邀请邮件）

如果希望系统自动发送邀请邮件给学生，需要配置以下变量：

```bash
SMTP_HOST=smtp.example.com          # SMTP服务器地址
SMTP_PORT=587                       # SMTP端口（587用于TLS，465用于SSL）
SMTP_USER=your-email@example.com    # 发送邮件的邮箱账号
SMTP_PASSWORD=your-password          # 邮箱密码或授权码
SMTP_FROM=noreply@example.com       # 发件人邮箱（可选）
```

**常用邮件服务商配置：**

**163邮箱：**
```bash
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_USER=your-email@163.com
SMTP_PASSWORD=your-163-auth-code  # 需要使用授权码，不是登录密码
```

**QQ邮箱：**
```bash
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your-email@qq.com
SMTP_PASSWORD=your-qq-auth-code  # 需要使用授权码
```

**Gmail：**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # 需要使用应用专用密码
```

**Outlook：**
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

⚠️ **注意**：
- 163/QQ邮箱需要使用"授权码"，不是登录密码
- Gmail需要使用"应用专用密码"
- 如果未配置邮件服务，邀请功能仍然可用，但需要手动复制链接发送

详细配置说明请参考 `EMAIL_SETUP.md`

## 本地开发环境变量文件

在项目根目录创建 `.env.local` 文件（不要提交到 Git）：

```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-key-here"
NODE_ENV="development"

# 邮件服务配置（可选）
SMTP_HOST="smtp.163.com"
SMTP_PORT="465"
SMTP_USER="your-email@163.com"
SMTP_PASSWORD="your-auth-code"
SMTP_FROM="noreply@yourdomain.com"
```

或者复制 `.env.example` 文件并重命名为 `.env.local`，然后填写实际的值。

