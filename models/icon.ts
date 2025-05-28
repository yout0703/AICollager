import { getDb } from "@/models/db";
import { v4 as uuidv4 } from 'uuid';
import { Icon } from '@/types/icons';

// 创建新Icon
export async function createIcon(params: {
  icon_id: string;
  icon_name: string;
  category_id: string;
  svg_content: string;
  style?: Icon['style'];
  size_variants?: string[];
  color_variants?: string[];
  tags?: string[];
  ai_keywords?: string[];
  semantic_meaning?: string;
  ai_description?: string;
  is_premium?: boolean;
  source?: string;
  version?: string;
  license?: string;
  metadata?: Record<string, any>;
}): Promise<Icon> {
  const db = getDb();
  const uuid = uuidv4();
  const now = new Date().toISOString();

  const res = await db.query(
    `INSERT INTO ac_icons 
      (uuid, icon_id, icon_name, category_id, svg_content, style, size_variants, color_variants, 
       tags, ai_keywords, semantic_meaning, ai_description, is_premium, source, version, license, metadata, created_at, updated_at) 
      VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
    [
      uuid,
      params.icon_id,
      params.icon_name,
      params.category_id,
      params.svg_content,
      params.style || 'outline',
      JSON.stringify(params.size_variants || ['16', '24', '32', '48', '64']),
      JSON.stringify(params.color_variants || ['currentColor']),
      params.tags || [],
      params.ai_keywords || [],
      params.semantic_meaning,
      params.ai_description,
      params.is_premium || false,
      params.source,
      params.version || '1.0.0',
      params.license || 'MIT',
      JSON.stringify(params.metadata || {}),
      now,
      now
    ]
  );

  if (res.rowCount === 0) {
    throw new Error('Failed to create icon');
  }

  return formatIcon(res.rows[0]);
}

// 根据ID查找Icon
export async function findIconById(iconId: string): Promise<Icon | undefined> {
  const db = getDb();
  
  const res = await db.query(
    'SELECT * FROM ac_icons WHERE icon_id = $1 AND is_active = true LIMIT 1',
    [iconId]
  );
  
  if (res.rowCount === 0) {
    return undefined;
  }

  return formatIcon(res.rows[0]);
}

// 根据UUID查找Icon
export async function findIconByUuid(uuid: string): Promise<Icon | undefined> {
  const db = getDb();
  
  const res = await db.query(
    'SELECT * FROM ac_icons WHERE uuid = $1 AND is_active = true LIMIT 1',
    [uuid]
  );
  
  if (res.rowCount === 0) {
    return undefined;
  }

  return formatIcon(res.rows[0]);
}

// 批量获取Icons
export async function findIconsByIds(iconIds: string[]): Promise<Icon[]> {
  const db = getDb();
  
  if (iconIds.length === 0) {
    return [];
  }
  
  const placeholders = iconIds.map((_, index) => `$${index + 1}`).join(',');
  
  const res = await db.query(
    `SELECT * FROM ac_icons 
     WHERE icon_id IN (${placeholders}) AND is_active = true 
     ORDER BY popularity_score DESC`,
    iconIds
  );
  
  return res.rows.map(formatIcon);
}

// 按分类获取Icons
export async function findIconsByCategory(
  categoryId: string,
  options: {
    style?: Icon['style'];
    is_premium?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ icons: Icon[]; total: number }> {
  const db = getDb();
  
  let whereClause = 'WHERE category_id = $1 AND is_active = true';
  const params: any[] = [categoryId];
  let paramIndex = 2;
  
  if (options.style) {
    whereClause += ` AND style = $${paramIndex}`;
    params.push(options.style);
    paramIndex++;
  }
  
  if (options.is_premium !== undefined) {
    whereClause += ` AND is_premium = $${paramIndex}`;
    params.push(options.is_premium);
    paramIndex++;
  }
  
  // 获取总数
  const countRes = await db.query(
    `SELECT COUNT(*) as total FROM ac_icons ${whereClause}`,
    params
  );
  const total = parseInt(countRes.rows[0].total);
  
  // 获取数据
  let query = `SELECT * FROM ac_icons ${whereClause} ORDER BY popularity_score DESC, icon_name ASC`;
  
  if (options.limit) {
    query += ` LIMIT $${paramIndex}`;
    params.push(options.limit);
    paramIndex++;
  }
  
  if (options.offset) {
    query += ` OFFSET $${paramIndex}`;
    params.push(options.offset);
  }
  
  const res = await db.query(query, params);
  
  return {
    icons: res.rows.map(formatIcon),
    total
  };
}

// 搜索Icons
export async function searchIcons(params: {
  query?: string;
  category_id?: string;
  style?: Icon['style'];
  tags?: string[];
  is_premium?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ icons: Icon[]; total: number; suggestions: string[] }> {
  const db = getDb();
  
  let whereClause = 'WHERE is_active = true';
  const queryParams: any[] = [];
  let paramIndex = 1;
  
  // 构建查询条件
  if (params.category_id) {
    whereClause += ` AND category_id = $${paramIndex}`;
    queryParams.push(params.category_id);
    paramIndex++;
  }
  
  if (params.style) {
    whereClause += ` AND style = $${paramIndex}`;
    queryParams.push(params.style);
    paramIndex++;
  }
  
  if (params.is_premium !== undefined) {
    whereClause += ` AND is_premium = $${paramIndex}`;
    queryParams.push(params.is_premium);
    paramIndex++;
  }
  
  // 文本搜索（在名称、标签、AI关键词中搜索）
  if (params.query) {
    whereClause += ` AND (
      icon_name ILIKE $${paramIndex} OR 
      $${paramIndex + 1} = ANY(tags) OR 
      $${paramIndex + 2} = ANY(ai_keywords) OR
      ai_description ILIKE $${paramIndex + 3}
    )`;
    queryParams.push(
      `%${params.query}%`,  // icon_name ILIKE
      params.query,         // tags 精确匹配
      params.query,         // ai_keywords 精确匹配
      `%${params.query}%`   // ai_description ILIKE
    );
    paramIndex += 4;
  }
  
  // 标签搜索
  if (params.tags && params.tags.length > 0) {
    const tagConditions = params.tags.map(() => {
      const condition = `$${paramIndex} = ANY(tags)`;
      paramIndex++;
      return condition;
    }).join(' OR ');
    
    whereClause += ` AND (${tagConditions})`;
    queryParams.push(...params.tags);
  }
  
  // 获取总数
  const countRes = await db.query(
    `SELECT COUNT(*) as total FROM ac_icons ${whereClause}`,
    queryParams
  );
  const total = parseInt(countRes.rows[0].total);
  
  // 获取数据（按受欢迎程度和相关性排序）
  let query = `
    SELECT * FROM ac_icons ${whereClause} 
    ORDER BY popularity_score DESC, usage_count DESC, icon_name ASC
  `;
  
  if (params.limit) {
    query += ` LIMIT $${paramIndex}`;
    queryParams.push(params.limit);
    paramIndex++;
  }
  
  if (params.offset) {
    query += ` OFFSET $${paramIndex}`;
    queryParams.push(params.offset);
  }
  
  const res = await db.query(query, queryParams);
  
  // 生成搜索建议（基于相似的标签和关键词）
  const suggestions = await generateSearchSuggestions(params.query);
  
  return {
    icons: res.rows.map(formatIcon),
    total,
    suggestions
  };
}

// 生成搜索建议
async function generateSearchSuggestions(query?: string): Promise<string[]> {
  if (!query || query.length < 2) {
    return [];
  }
  
  const db = getDb();
  
  // 查找相似的标签和关键词
  const res = await db.query(`
    SELECT DISTINCT unnest(tags || ai_keywords) as suggestion 
    FROM ac_icons 
    WHERE is_active = true 
    AND (
      unnest(tags || ai_keywords) ILIKE $1 OR 
      unnest(tags || ai_keywords) ILIKE $2
    )
    LIMIT 10
  `, [`%${query}%`, `${query}%`]);
  
  return res.rows.map(row => row.suggestion).filter(Boolean);
}

// 更新Icon使用统计
export async function updateIconUsage(iconId: string): Promise<boolean> {
  const db = getDb();
  
  try {
    await db.query(
      `UPDATE ac_icons 
       SET usage_count = usage_count + 1, 
           popularity_score = popularity_score + 1,
           last_used_at = NOW() 
       WHERE icon_id = $1`,
      [iconId]
    );
    
    return true;
  } catch (error) {
    console.error('Update icon usage failed:', error);
    return false;
  }
}

// 批量更新Icon使用统计
export async function updateMultipleIconUsage(iconIds: string[]): Promise<boolean> {
  if (iconIds.length === 0) {
    return true;
  }
  
  const db = getDb();
  
  try {
    const placeholders = iconIds.map((_, index) => `$${index + 1}`).join(',');
    
    await db.query(
      `UPDATE ac_icons 
       SET usage_count = usage_count + 1, 
           popularity_score = popularity_score + 1,
           last_used_at = NOW() 
       WHERE icon_id IN (${placeholders})`,
      iconIds
    );
    
    return true;
  } catch (error) {
    console.error('Update multiple icon usage failed:', error);
    return false;
  }
}

// 获取受欢迎的Icons
export async function getPopularIcons(params: {
  category_id?: string;
  limit?: number;
  days?: number; // 时间范围（天）
}): Promise<Icon[]> {
  const db = getDb();
  
  let whereClause = 'WHERE is_active = true';
  const queryParams: any[] = [];
  let paramIndex = 1;
  
  if (params.category_id) {
    whereClause += ` AND category_id = $${paramIndex}`;
    queryParams.push(params.category_id);
    paramIndex++;
  }
  
  if (params.days) {
    whereClause += ` AND (last_used_at IS NULL OR last_used_at >= NOW() - INTERVAL '${params.days} days')`;
  }
  
  const query = `
    SELECT * FROM ac_icons ${whereClause} 
    ORDER BY popularity_score DESC, usage_count DESC 
    LIMIT $${paramIndex}
  `;
  
  queryParams.push(params.limit || 20);
  
  const res = await db.query(query, queryParams);
  
  return res.rows.map(formatIcon);
}

// 获取Icon统计信息
export async function getIconStats(): Promise<{
  total_icons: number;
  active_icons: number;
  premium_icons: number;
  categories_with_icons: number;
  most_popular_icon: Icon | null;
  usage_stats: {
    total_usage: number;
    avg_usage_per_icon: number;
  };
}> {
  const db = getDb();
  
  const [totalRes, statsRes, popularRes, usageRes] = await Promise.all([
    db.query('SELECT COUNT(*) as total FROM ac_icons'),
    db.query(`
      SELECT 
        COUNT(CASE WHEN is_active = true THEN 1 END) as active,
        COUNT(CASE WHEN is_premium = true AND is_active = true THEN 1 END) as premium,
        COUNT(DISTINCT category_id) as categories
      FROM ac_icons
    `),
    db.query(`
      SELECT * FROM ac_icons 
      WHERE is_active = true 
      ORDER BY popularity_score DESC 
      LIMIT 1
    `),
    db.query(`
      SELECT 
        SUM(usage_count) as total_usage,
        AVG(usage_count) as avg_usage
      FROM ac_icons 
      WHERE is_active = true
    `)
  ]);
  
  const totalIcons = parseInt(totalRes.rows[0]?.total || '0');
  const activeIcons = parseInt(statsRes.rows[0]?.active || '0');
  const premiumIcons = parseInt(statsRes.rows[0]?.premium || '0');
  const categoriesWithIcons = parseInt(statsRes.rows[0]?.categories || '0');
  const mostPopularIcon = popularRes.rows[0] ? formatIcon(popularRes.rows[0]) : null;
  const totalUsage = parseInt(usageRes.rows[0]?.total_usage || '0');
  const avgUsage = parseFloat(usageRes.rows[0]?.avg_usage || '0');
  
  return {
    total_icons: totalIcons,
    active_icons: activeIcons,
    premium_icons: premiumIcons,
    categories_with_icons: categoriesWithIcons,
    most_popular_icon: mostPopularIcon,
    usage_stats: {
      total_usage: totalUsage,
      avg_usage_per_icon: Math.round(avgUsage * 100) / 100
    }
  };
}

// 格式化Icon数据
function formatIcon(row: any): Icon {
  return {
    id: row.id,
    uuid: row.uuid,
    icon_id: row.icon_id,
    icon_name: row.icon_name,
    category_id: row.category_id,
    svg_content: row.svg_content,
    style: row.style,
    size_variants: JSON.parse(row.size_variants || '[]'),
    color_variants: JSON.parse(row.color_variants || '[]'),
    tags: row.tags || [],
    ai_keywords: row.ai_keywords || [],
    semantic_meaning: row.semantic_meaning,
    ai_description: row.ai_description,
    popularity_score: row.popularity_score || 0,
    usage_count: row.usage_count || 0,
    last_used_at: row.last_used_at,
    is_active: row.is_active,
    is_premium: row.is_premium,
    source: row.source,
    version: row.version,
    license: row.license,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
} 