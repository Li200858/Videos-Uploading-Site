# 推送到 GitHub 的步骤

代码已经提交到本地，现在需要推送到 GitHub。

## 方法 1：使用 GitHub Desktop（最简单）

1. 打开 GitHub Desktop
2. 如果项目已经在 GitHub Desktop 中：
   - 点击 "Push origin" 按钮
3. 如果项目不在 GitHub Desktop 中：
   - 点击 `File` → `Add Local Repository`
   - 选择文件夹：`/Users/lichangxuan/Desktop/videos uploading site`
   - 点击 "Push origin" 按钮

## 方法 2：使用命令行 + Personal Access Token

1. 在 GitHub 上生成 Personal Access Token：
   - 访问：https://github.com/settings/tokens
   - 点击 "Generate new token (classic)"
   - 选择权限：勾选 `repo`
   - 点击 "Generate token"
   - **重要**：复制生成的 token（只显示一次）

2. 推送代码：
   ```bash
   cd "/Users/lichangxuan/Desktop/videos uploading site"
   git push -u origin main
   ```
   
   当提示输入用户名时：
   - Username: `Li200858`
   - Password: 粘贴刚才复制的 token（不是 GitHub 密码）

## 方法 3：使用 SSH（一次性配置）

1. 检查是否有 SSH 密钥：
   ```bash
   ls -al ~/.ssh
   ```

2. 如果没有，生成新的 SSH 密钥：
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```
   按回车使用默认路径，可以设置密码或直接回车

3. 复制公钥：
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
   复制输出的内容

4. 添加到 GitHub：
   - 访问：https://github.com/settings/keys
   - 点击 "New SSH key"
   - Title: 随便填（如 "My Mac"）
   - Key: 粘贴刚才复制的公钥
   - 点击 "Add SSH key"

5. 更改远程 URL 为 SSH：
   ```bash
   cd "/Users/lichangxuan/Desktop/videos uploading site"
   git remote set-url origin git@github.com:Li200858/Videos-Uploading-Site.git
   git push -u origin main
   ```

## 当前状态

✅ 代码已提交到本地
✅ 远程仓库已配置为：`https://github.com/Li200858/Videos-Uploading-Site.git`
⏳ 等待推送到 GitHub

## 已提交的文件

- `prisma/schema.prisma` - MongoDB 配置
- `DEPLOYMENT.md` - 部署指南
- `ENV_SETUP.md` - 环境变量配置说明
- `render.yaml` - Render 部署配置
- `GITHUB_PUSH_GUIDE.md` - GitHub 推送指南

