# 邀请链接域名修复指南

## 问题说明

如果邀请链接显示为 `localhost`，这是因为系统无法正确获取生产环境的域名。

## 解决方案

### 方案一：在 Render 中设置 NEXTAUTH_URL（推荐）

1. 登录 Render Dashboard
2. 选择您的服务
3. 进入 "Environment" 标签
4. 添加或更新环境变量：
   ```
   NEXTAUTH_URL=https://videos-uploading-site-kfha.onrender.com
   ```
   或者如果您有自定义域名：
   ```
   NEXTAUTH_URL=https://yourdomain.com
   ```
5. 保存并重新部署

### 方案二：使用测试脚本生成邀请链接

我已经创建了一个测试脚本，可以手动指定域名生成邀请链接：

```bash
# 安装依赖（如果需要）
npm install

# 运行脚本
node scripts/create-test-invite.js <学生邮箱> <课程ID> <域名>

# 示例：
node scripts/create-test-invite.js student@example.com <course-id> https://videos-uploading-site-kfha.onrender.com
```

### 方案三：检查请求头

系统现在会自动从请求头中获取域名。如果您的应用部署在 Render 上，Render 会自动设置正确的请求头。

## 验证方法

1. 在 Render 中创建邀请
2. 检查生成的邀请链接
3. 如果还是 localhost，检查：
   - Render 环境变量中是否设置了 `NEXTAUTH_URL`
   - `NEXTAUTH_URL` 的值是否正确（应该是完整的 URL，如 `https://xxx.onrender.com`）

## 代码改进

我已经改进了 `getBaseUrl` 函数，现在它会按以下优先级获取域名：

1. **NEXTAUTH_URL 环境变量**（如果设置了且不是 localhost）
2. **请求头中的 Host**（适用于生产环境）
3. **请求 URL**（最后备选）

这样可以确保在生产环境中使用正确的域名。

