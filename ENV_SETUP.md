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
https://your-app-name.onrender.com
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

## 本地开发环境变量文件

在项目根目录创建 `.env` 文件（不要提交到 Git）：

```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-key-here"
NODE_ENV="development"
```

