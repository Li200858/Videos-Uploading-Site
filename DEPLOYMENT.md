# 部署指南 - Render + MongoDB + GitHub

本指南将帮助您将教育视频平台部署到 Render，使用 MongoDB 作为数据库，并通过 GitHub 进行版本控制。

## 📋 前置要求

1. GitHub 账号
2. Render 账号（免费版即可）
3. MongoDB Atlas 账号（免费版即可）

## 🗄️ 第一步：设置 MongoDB Atlas

1. 访问 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 注册/登录账号
3. 创建一个新的集群（选择免费版 M0）
4. 创建数据库用户：
   - 点击 "Database Access" → "Add New Database User"
   - 设置用户名和密码（记住这些信息）
5. 配置网络访问：
   - 点击 "Network Access" → "Add IP Address"
   - 选择 "Allow Access from Anywhere" (0.0.0.0/0) 用于开发
6. 获取连接字符串：
   - 点击 "Connect" → "Connect your application"
   - 复制连接字符串，格式如下：
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<database_name>?retryWrites=true&w=majority
     ```
   - 将 `<username>`, `<password>`, `<database_name>` 替换为实际值

## 📦 第二步：准备 GitHub 仓库

1. 在 GitHub 上创建一个新仓库（或使用现有仓库）
2. 在本地项目目录中，确保所有更改已提交：

```bash
cd "videos uploading site"
git add .
git commit -m "准备部署到 Render"
git push origin main
```

## 🚀 第三步：在 Render 上部署

### 3.1 创建 Web Service

1. 登录 [Render Dashboard](https://dashboard.render.com/)
2. 点击 "New +" → "Web Service"
3. 连接您的 GitHub 账号（如果尚未连接）
4. 选择您的仓库

### 3.2 配置服务设置

在配置页面填写以下信息：

- **Name**: `educational-video-platform`（或您喜欢的名称）
- **Region**: 选择离您最近的区域
- **Branch**: `main`（或您的主分支）
- **Root Directory**: 留空（如果项目在根目录）
- **Runtime**: `Node`
- **Build Command**: 
  ```bash
  npm install && npx prisma generate && npm run build
  ```
- **Start Command**: 
  ```bash
  npm start
  ```
- **Plan**: 选择 `Free`（免费版）

### 3.3 配置环境变量

在 "Environment Variables" 部分添加以下变量：

1. **DATABASE_URL**
   - 值：您的 MongoDB Atlas 连接字符串
   - 示例：`mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database_name?retryWrites=true&w=majority`

2. **NEXTAUTH_URL**
   - 值：您的 Render 应用 URL（部署后会自动生成）
   - 格式：`https://your-app-name.onrender.com`
   - ⚠️ 注意：首次部署时可以先填写 `http://localhost:3000`，部署成功后再更新为实际 URL

3. **NEXTAUTH_SECRET**
   - 值：生成一个随机字符串作为密钥
   - 您可以使用以下命令生成：
     ```bash
     openssl rand -base64 32
     ```
   - 或者在 Node.js 中：
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
     ```

4. **NODE_ENV**
   - 值：`production`

### 3.4 部署

1. 点击 "Create Web Service"
2. Render 将开始构建和部署您的应用
3. 等待部署完成（通常需要 5-10 分钟）

## 🔧 第四步：初始化数据库

部署成功后，需要初始化数据库：

1. 在 Render Dashboard 中，找到您的服务
2. 点击 "Shell" 标签
3. 运行以下命令：

```bash
npx prisma db push
```

这将根据 Prisma schema 创建数据库表结构。

## ✅ 第五步：验证部署

1. 访问您的应用 URL（格式：`https://your-app-name.onrender.com`）
2. 测试注册和登录功能
3. 确认所有功能正常工作

## 🔄 自动部署

Render 会自动监听 GitHub 仓库的推送，当您推送新代码时：
- Render 会自动检测更改
- 重新构建应用
- 部署新版本

## 📝 重要提示

### 文件上传限制

⚠️ **重要**：Render 的免费版使用临时文件系统，这意味着：
- 上传的文件在服务重启后会丢失
- 建议使用云存储服务（如 AWS S3、Cloudinary）来存储文件

### 环境变量更新

如果部署后需要更新环境变量：
1. 在 Render Dashboard 中找到您的服务
2. 进入 "Environment" 标签
3. 更新变量值
4. 服务会自动重启

### 数据库迁移

如果需要更新数据库结构：
1. 修改 `prisma/schema.prisma`
2. 提交并推送到 GitHub
3. 部署完成后，在 Render Shell 中运行：
   ```bash
   npx prisma db push
   ```

## 🐛 故障排除

### 部署失败

1. 检查构建日志中的错误信息
2. 确认所有环境变量已正确设置
3. 确认 MongoDB 连接字符串格式正确
4. 确认网络访问已配置（MongoDB Atlas）

### 数据库连接错误

1. 检查 MongoDB Atlas 中的网络访问设置
2. 确认数据库用户名和密码正确
3. 确认连接字符串中的数据库名称存在

### NextAuth 错误

1. 确认 `NEXTAUTH_URL` 设置为正确的应用 URL
2. 确认 `NEXTAUTH_SECRET` 已设置且足够复杂

## 📚 相关资源

- [Render 文档](https://render.com/docs)
- [MongoDB Atlas 文档](https://docs.atlas.mongodb.com/)
- [Prisma MongoDB 文档](https://www.prisma.io/docs/concepts/database-connectors/mongodb)
- [NextAuth.js 文档](https://next-auth.js.org/)

## 🎉 完成！

您的应用现在应该已经成功部署到 Render 了！

