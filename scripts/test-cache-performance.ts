#!/usr/bin/env tsx

import { getUserInfo } from '@/lib/services/userService';
import { getUserInfoCached, userCacheManager } from '@/lib/services/userCache';

/**
 * 测试内存缓存性能
 */
async function testCachePerformance() {
  console.log('🧪 开始内存缓存性能测试...\n');
  
  // 模拟一个真实的 Clerk User ID
  const testClerkUserId = 'user_2wSSSQMlfOvCYRhgMpUomJCJwOo';
  
  // 清空缓存以确保测试的准确性
  userCacheManager.clear();
  
  console.log('📊 测试传统查询方法...');
  const traditionalStart = performance.now();
  
  try {
    const userTraditional = await getUserInfo(testClerkUserId, 'clerk_id');
    const traditionalEnd = performance.now();
    const traditionalTime = traditionalEnd - traditionalStart;
    
    console.log(`⏱️  传统方法耗时: ${traditionalTime.toFixed(2)}ms`);
    console.log(`👤 查询结果: ${userTraditional ? `${userTraditional.email} (${userTraditional.uuid})` : '未找到用户'}\n`);
    
    if (userTraditional) {
      // 测试缓存方法（首次）
      console.log('🚀 测试缓存方法（首次，应该与传统方法相近）...');
      const cachedFirstStart = performance.now();
      
      const userCachedFirst = await getUserInfoCached(testClerkUserId);
      const cachedFirstEnd = performance.now();
      const cachedFirstTime = cachedFirstEnd - cachedFirstStart;
      
      console.log(`⏱️  缓存方法首次耗时: ${cachedFirstTime.toFixed(2)}ms`);
      console.log(`👤 查询结果: ${userCachedFirst ? `${userCachedFirst.email} (${userCachedFirst.uuid})` : '未找到用户'}`);
      
      const firstImprovement = ((traditionalTime - cachedFirstTime) / traditionalTime) * 100;
      console.log(`📈 首次性能变化: ${firstImprovement.toFixed(1)}% (${traditionalTime.toFixed(2)}ms → ${cachedFirstTime.toFixed(2)}ms)\n`);
      
      // 测试缓存方法（第二次，应该很快）
      console.log('⚡ 测试缓存方法（第二次，应该非常快）...');
      const cachedSecondStart = performance.now();
      
      const userCachedSecond = await getUserInfoCached(testClerkUserId);
      const cachedSecondEnd = performance.now();
      const cachedSecondTime = cachedSecondEnd - cachedSecondStart;
      
      console.log(`⏱️  缓存方法第二次耗时: ${cachedSecondTime.toFixed(2)}ms`);
      console.log(`👤 查询结果: ${userCachedSecond ? `${userCachedSecond.email} (${userCachedSecond.uuid})` : '未找到用户'}`);
      
      const secondImprovement = ((traditionalTime - cachedSecondTime) / traditionalTime) * 100;
      console.log(`🚀 第二次性能提升: ${secondImprovement.toFixed(1)}% (${traditionalTime.toFixed(2)}ms → ${cachedSecondTime.toFixed(2)}ms)\n`);
      
      // 批量测试（模拟高并发）
      console.log('📦 批量测试（10次查询）...');
      const batchSize = 10;
      
      // 传统方法批量测试
      const traditionalBatchStart = performance.now();
      const traditionalPromises = Array(batchSize).fill(0).map(() => 
        getUserInfo(testClerkUserId, 'clerk_id')
      );
      await Promise.all(traditionalPromises);
      const traditionalBatchEnd = performance.now();
      const traditionalBatchTime = traditionalBatchEnd - traditionalBatchStart;
      
      console.log(`⏱️  传统方法批量耗时: ${traditionalBatchTime.toFixed(2)}ms (平均: ${(traditionalBatchTime/batchSize).toFixed(2)}ms/次)`);
      
      // 缓存方法批量测试
      const cachedBatchStart = performance.now();
      const cachedPromises = Array(batchSize).fill(0).map(() => 
        getUserInfoCached(testClerkUserId)
      );
      await Promise.all(cachedPromises);
      const cachedBatchEnd = performance.now();
      const cachedBatchTime = cachedBatchEnd - cachedBatchStart;
      
      console.log(`⏱️  缓存方法批量耗时: ${cachedBatchTime.toFixed(2)}ms (平均: ${(cachedBatchTime/batchSize).toFixed(2)}ms/次)`);
      
      const batchImprovement = ((traditionalBatchTime - cachedBatchTime) / traditionalBatchTime) * 100;
      console.log(`📈 批量查询性能提升: ${batchImprovement.toFixed(1)}% (${traditionalBatchTime.toFixed(2)}ms → ${cachedBatchTime.toFixed(2)}ms)\n`);
      
      // 显示缓存统计
      const stats = userCacheManager.getStats();
      console.log('📊 缓存统计信息:');
      console.log(`   缓存大小: ${stats.size}/${stats.maxSize}`);
      console.log(`   缓存用户: ${stats.keys.length > 0 ? stats.keys.join(', ') : '无'}`);
      
    } else {
      console.log('⚠️  无法进行性能对比，因为找不到测试用户');
      console.log('💡 建议：请先登录一次以创建用户记录，或修改脚本中的测试用户ID');
    }
    
  } catch (error) {
    console.error('❌ 性能测试失败:', error);
  }
}

// 运行测试
if (require.main === module) {
  testCachePerformance()
    .then(() => {
      console.log('\n🎉 缓存性能测试完成!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 缓存性能测试失败:', error);
      process.exit(1);
    });
}

export { testCachePerformance }; 