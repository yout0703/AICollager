# Cloudflare R2 配置指南

本文档指导您如何为 AICollager 项目配置 Cloudflare R2 对象存储。

## 1. 创建 Cloudflare R2 存储桶

### 1.1 登录 Cloudflare Dashboard
访问 [Cloudflare Dashboard](https://dash.cloudflare.com/) 并登录您的账户。

### 1.2 进入 R2 Object Storage
1. 在左侧导航栏中找到 "R2 Object Storage"
2. 如果是首次使用，需要启用 R2 服务

### 1.3 创建存储桶
1. 点击 "Create bucket" 按钮
2. 输入存储桶名称（建议：`aicollager-images`）
3. 选择位置（建议选择距离用户最近的区域）
4. 点击 "Create bucket" 完成创建

## 2. 配置 API 令牌

### 2.1 创建 API 令牌
1. 在 Cloudflare Dashboard 中，点击右上角的用户头像
2. 选择 "My Profile"
3. 进入 "API Tokens" 标签页
4. 点击 "Create Token"

### 2.2 设置令牌权限
1. 选择 "Custom token" 模板
2. 配置以下权限：
   - **Permissions**:
     - `Cloudflare R2:Edit` (用于上传、删除文件)
     - `Cloudflare R2:Read` (用于读取文件)
   - **Account Resources**:
     - Include: `All accounts` 或选择特定账户
   - **Zone Resources**: 留空即可

### 2.3 保存令牌信息
创建完成后，复制以下信息：
- **API Token** (这就是 `R2_SECRET_ACCESS_KEY`)
- **Account ID** (在 R2 页面右侧可以找到)

### 2.4 生成访问密钥
1. 回到 R2 Object Storage 页面
2. 点击右侧的 "Manage R2 API tokens"
3. 点击 "Create API token"
4. 选择权限：`Object Read & Write`
5. 设置 TTL（可选，建议设置较长时间或永不过期）
6. 创建后保存：
   - **Access Key ID** (这就是 `R2_ACCESS_KEY_ID`)
   - **Secret Access Key** (这就是 `R2_SECRET_ACCESS_KEY`)

## 3. 配置公开访问（可选）

### 3.1 R2.dev 子域名
Cloudflare 为每个 R2 存储桶提供免费的 R2.dev 子域名：
- 格式：`https://pub-{account-id}.r2.dev`
- 需要在存储桶设置中启用

### 3.2 自定义域名（推荐）
1. 在 R2 存储桶设置中，找到 "Public access" 部分
2. 点击 "Connect domain"
3. 输入您的自定义域名（如：`cdn.yourdomain.com`）
4. 按照提示设置 DNS 记录
5. 启用后，文件将通过自定义域名访问

## 4. 环境变量配置

在您的 `.env.local` 文件中添加以下配置：

```env
# Cloudflare R2 配置
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key-id"
R2_SECRET_ACCESS_KEY="your-secret-access-key"
R2_BUCKET_NAME="aicollager-images"

# 公开访问URL（二选一）
# 选项1：使用自定义域名（推荐）
R2_PUBLIC_URL="https://cdn.yourdomain.com"

# 选项2：使用 R2.dev 域名
***REMOVED***_PUBLIC_URL="https://pub-your-account-id.r2.dev"

# 选项3：留空使用默认配置
***REMOVED***_PUBLIC_URL=""
```

## 5. 验证配置

R2 测试 API 已从公开路由中移除。请通过本地上传流程验证配置是否正确，或在服务端临时脚本中调用 `validateR2Config()` 检查必需环境变量。

### 5.2 测试文件上传
您可以在项目中上传一张测试图片来验证完整的上传流程。

## 6. 成本说明

### 6.1 R2 定价（截至2024年）
- **存储**: $0.015/GB/月
- **Class A 操作** (上传): $4.50/百万次请求
- **Class B 操作** (下载): $0.36/百万次请求
- **免费额度**:
  - 10 GB 存储/月
  - 1,000,000 Class A 操作/月
  - 10,000,000 Class B 操作/月

### 6.2 与 AWS S3 对比
相比 AWS S3，Cloudflare R2 的主要优势：
- **无出站费用**: 从 R2 下载数据完全免费
- **更低的存储成本**: 约为 S3 的一半
- **全球边缘网络**: 更快的访问速度

## 7. 安全建议

### 7.1 访问控制
- 创建专用的 API 令牌，只授予必要的权限
- 定期轮换 API 密钥
- 不要在客户端代码中暴露密钥

### 7.2 存储桶安全
- 禁用不必要的公开访问
- 启用访问日志记录
- 设置适当的 CORS 策略

### 7.3 环境变量安全
- 确保 `.env.local` 文件不被提交到版本控制
- 在生产环境中使用安全的密钥管理服务

## 8. 故障排除

### 8.1 常见错误
1. **403 Forbidden**: 检查 API 令牌权限
2. **NoSuchBucket**: 确认存储桶名称正确
3. **InvalidAccessKeyId**: 检查访问密钥配置
4. **网络错误**: 检查防火墙和网络连接

### 8.2 调试步骤
1. 使用测试 API 验证配置
2. 检查 Cloudflare Dashboard 中的 R2 日志
3. 确认环境变量设置正确
4. 验证存储桶权限设置

## 9. 从 AWS S3 迁移

如果您之前使用 AWS S3，迁移到 R2 非常简单：

### 9.1 更新环境变量
```env
# 移除旧的 AWS 配置
# AWS_AK=""
# AWS_SK=""
# AWS_REGION=""
# AWS_BUCKET=""

# 添加新的 R2 配置
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key-id"
R2_SECRET_ACCESS_KEY="your-secret-access-key"
R2_BUCKET_NAME="your-bucket-name"
R2_PUBLIC_URL="https://your-domain.com"
```

### 9.2 数据迁移（可选）
如果需要迁移现有数据，可以使用：
- [rclone](https://rclone.org/) 工具
- Cloudflare 的 [Super Slurper](https://developers.cloudflare.com/r2/examples/rclone/) 服务
- 自定义迁移脚本

### 9.3 更新 DNS
如果使用自定义域名，更新 DNS 记录指向新的 R2 端点。

## 10. 监控和优化

### 10.1 使用分析
- 在 Cloudflare Dashboard 中查看 R2 使用统计
- 监控存储容量和请求次数
- 设置费用告警

### 10.2 性能优化
- 使用适当的缓存策略
- 优化图片格式和尺寸
- 启用 Cloudflare 的图片优化功能

---

完成以上配置后，您的 AICollager 项目就可以使用 Cloudflare R2 作为图片存储服务了！
