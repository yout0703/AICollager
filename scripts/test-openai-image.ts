#!/usr/bin/env tsx
// OpenAI gpt-image-2 连通烟测
// 用法: pnpm tsx scripts/test-openai-image.ts
// 需在 .env.local 配置 OPENAI_API_KEY（中转站 token 或官方 sk-...）。

import dotenv from 'dotenv';
// 必须在加载 openai-config 之前注入 .env.local：静态 import 会 hoisting 到
// dotenv.config() 之前，导致 OPENAI_CONFIG 顶层求值时读到 default 值。
// 故用 require（CJS 顺序执行）确保 env 先就绪。
dotenv.config({ path: '.env.local' });

const { OPENAI_CONFIG, isOpenAIConfigured } = require('@/lib/openai-config') as typeof import('@/lib/openai-config');
const { testImageConnection } = require('@/lib/services/openai/imageService') as typeof import('@/lib/services/openai/imageService');

async function main() {
  console.log('== OpenAI Image 配置 ==');
  console.log('imageModel        :', OPENAI_CONFIG.imageModel);
  console.log('baseURL           :', OPENAI_CONFIG.baseURL ?? '(官方默认 https://api.openai.com/v1)');
  console.log('orchestratorModel :', OPENAI_CONFIG.orchestratorModel);
  console.log('orchestratorEnabled:', OPENAI_CONFIG.orchestratorEnabled);
  console.log('configured        :', isOpenAIConfigured());

  if (!isOpenAIConfigured()) {
    console.log(
      '\n⚠️  OPENAI_API_KEY 未配置，跳过连通测试。\n   请在 .env.local 设置 OPENAI_API_KEY 后重跑: pnpm tsx scripts/test-openai-image.ts'
    );
    return;
  }

  console.log('\n== 连通测试（low quality, 1024x1024）==');
  const t0 = Date.now();
  const r = await testImageConnection();
  console.log('耗时  :', Date.now() - t0, 'ms');
  console.log('ok    :', r.ok);
  console.log('model :', r.model);
  if (r.bytes) console.log('bytes :', r.bytes);
  if (r.error) console.log('error :', r.error);
  process.exit(r.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
