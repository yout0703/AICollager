import { DatabaseAdapter } from "@/lib/database-adapter";
import { v4 as uuidv4 } from 'uuid';
import { IconCategory } from '@/types/icons';

// 创建新的图标分类
export async function createIconCategory(params: {
  category_id: string;
  category_name: string;
  parent_category_id?: string;
  description?: string;
  ai_description?: string;
  ai_keywords?: string[];
  display_order?: number;
  icon_color?: string;
}): Promise<IconCategory> {
  const db = new DatabaseAdapter(true);
  const uuid = uuidv4();
  const now = new Date().toISOString();

  const insertData = {
    uuid,
    category_id: params.category_id,
    category_name: params.category_name,
    parent_category_id: params.parent_category_id,
    description: params.description,
    ai_description: params.ai_description,
    ai_keywords: params.ai_keywords || [],
    display_order: params.display_order || 0,
    icon_color: params.icon_color || '#6B7280',
    created_at: now,
    updated_at: now
  };

  const result = await db.insert('ac_icon_categories', insertData);
  
  if (result.error) {
    throw new Error('Failed to create icon category: ' + result.error.message);
  }

  const insertedData = result.data?.[0] || result.rows?.[0];
  if (!insertedData) {
    throw new Error('Failed to create icon category');
  }

  return formatIconCategory(insertedData);
}

// 根据ID查找Icon分类
export async function findIconCategoryById(categoryId: string): Promise<IconCategory | undefined> {
  const db = new DatabaseAdapter(true);
  
  const result = await db.select('ac_icon_categories', {
    where: { category_id: categoryId, is_active: true },
    limit: 1
  });
  
  if (result.error) {
    throw new Error('Failed to find icon category by ID: ' + result.error.message);
  }

  const rows = result.data || result.rows || [];
  if (rows.length === 0) {
    return undefined;
  }

  return formatIconCategory(rows[0]);
}

// 根据UUID查找Icon分类
export async function findIconCategoryByUuid(uuid: string): Promise<IconCategory | undefined> {
  const db = new DatabaseAdapter(true);
  
  const result = await db.select('ac_icon_categories', {
    where: { uuid, is_active: true },
    limit: 1
  });
  
  if (result.error) {
    throw new Error('Failed to find icon category by UUID: ' + result.error.message);
  }

  const rows = result.data || result.rows || [];
  if (rows.length === 0) {
    return undefined;
  }

  return formatIconCategory(rows[0]);
}

// 获取所有启用的Icon分类
export async function getAllIconCategories(options: {
  include_inactive?: boolean;
  include_count?: boolean;
} = {}): Promise<IconCategory[]> {
  const db = new DatabaseAdapter(true);
  
  let whereClause = '';
  if (!options.include_inactive) {
    whereClause = 'WHERE is_active = true';
  }
  
  let query = `SELECT * FROM ac_icon_categories ${whereClause} ORDER BY display_order ASC, category_name ASC`;
  
  const result = await db.rawQuery(query);
  
  if (result.error) {
    throw new Error('Failed to get all icon categories: ' + result.error.message);
  }

  const rows = result.data || result.rows || [];
  let categories = rows.map(formatIconCategory);
  
  // 如果需要包含Icon数量，查询每个分类的Icon数量
  if (options.include_count) {
    for (const category of categories) {
      const countQuery = 'SELECT COUNT(*) as count FROM ac_icons WHERE category_id = $1 AND is_active = true';
      const countResult = await db.rawQuery(countQuery, [category.category_id]);
      
      if (!countResult.error) {
        const countRows = countResult.data || countResult.rows || [];
        category.icon_count = parseInt(countRows[0]?.count || '0');
      }
    }
  }
  
  return categories;
}

// 获取顶级分类（没有父分类的）
export async function getTopLevelCategories(options: {
  include_count?: boolean;
} = {}): Promise<IconCategory[]> {
  const db = new DatabaseAdapter(true);
  
  const query = `
    SELECT * FROM ac_icon_categories 
    WHERE parent_category_id IS NULL AND is_active = true 
    ORDER BY display_order ASC, category_name ASC
  `;
  
  const result = await db.rawQuery(query);
  
  if (result.error) {
    throw new Error('Failed to get top level categories: ' + result.error.message);
  }

  const rows = result.data || result.rows || [];
  let categories = rows.map(formatIconCategory);
  
  // 如果需要包含Icon数量
  if (options.include_count) {
    for (const category of categories) {
      const countQuery = 'SELECT COUNT(*) as count FROM ac_icons WHERE category_id = $1 AND is_active = true';
      const countResult = await db.rawQuery(countQuery, [category.category_id]);
      
      if (!countResult.error) {
        const countRows = countResult.data || countResult.rows || [];
        category.icon_count = parseInt(countRows[0]?.count || '0');
      }
    }
  }
  
  return categories;
}

// 获取子分类
export async function getChildCategories(parentCategoryId: string): Promise<IconCategory[]> {
  const db = new DatabaseAdapter(true);
  
  const query = `
    SELECT * FROM ac_icon_categories 
    WHERE parent_category_id = $1 AND is_active = true 
    ORDER BY display_order ASC, category_name ASC
  `;
  
  const result = await db.rawQuery(query, [parentCategoryId]);
  
  if (result.error) {
    throw new Error('Failed to get child categories: ' + result.error.message);
  }

  const rows = result.data || result.rows || [];
  return rows.map(formatIconCategory);
}

// 获取分类树结构
export async function getCategoryTree(): Promise<(IconCategory & { children: IconCategory[] })[]> {
  const topLevel = await getTopLevelCategories({ include_count: true });
  
  const tree = await Promise.all(
    topLevel.map(async (category) => {
      const children = await getChildCategories(category.category_id);
      return {
        ...category,
        children
      };
    })
  );
  
  return tree;
}

// 搜索分类
export async function searchIconCategories(params: {
  query?: string;
  ai_keywords?: string[];
  limit?: number;
}): Promise<IconCategory[]> {
  const db = new DatabaseAdapter(true);
  
  let whereClause = 'WHERE is_active = true';
  const queryParams: any[] = [];
  let paramIndex = 1;
  
  if (params.query) {
    whereClause += ` AND (
      category_name ILIKE $${paramIndex} OR 
      description ILIKE $${paramIndex + 1} OR
      ai_description ILIKE $${paramIndex + 2}
    )`;
    queryParams.push(
      `%${params.query}%`,
      `%${params.query}%`,
      `%${params.query}%`
    );
    paramIndex += 3;
  }
  
  if (params.ai_keywords && params.ai_keywords.length > 0) {
    const keywordConditions = params.ai_keywords.map(() => {
      const condition = `$${paramIndex} = ANY(ai_keywords)`;
      paramIndex++;
      return condition;
    }).join(' OR ');
    
    whereClause += ` AND (${keywordConditions})`;
    queryParams.push(...params.ai_keywords);
  }
  
  let query = `SELECT * FROM ac_icon_categories ${whereClause} ORDER BY display_order ASC`;
  
  if (params.limit) {
    query += ` LIMIT $${paramIndex}`;
    queryParams.push(params.limit);
  }
  
  const result = await db.rawQuery(query, queryParams);
  
  if (result.error) {
    throw new Error('Failed to search icon categories: ' + result.error.message);
  }

  const rows = result.data || result.rows || [];
  return rows.map(formatIconCategory);
}

// 更新分类使用次数
export async function updateCategoryUsage(categoryId: string): Promise<boolean> {
  const db = new DatabaseAdapter(true);
  
  try {
    const query = 'UPDATE ac_icon_categories SET usage_count = usage_count + 1 WHERE category_id = $1';
    const result = await db.rawQuery(query, [categoryId]);
    
    if (result.error) {
      throw new Error('Failed to update category usage: ' + result.error.message);
    }
    
    return true;
  } catch (error) {
    console.error('Update category usage failed:', error);
    return false;
  }
}

// 更新分类中的Icon数量
export async function updateCategoryIconCount(categoryId: string): Promise<boolean> {
  const db = new DatabaseAdapter(true);
  
  try {
    const countQuery = 'SELECT COUNT(*) as count FROM ac_icons WHERE category_id = $1 AND is_active = true';
    const countResult = await db.rawQuery(countQuery, [categoryId]);
    
    if (countResult.error) {
      throw new Error('Failed to count icons: ' + countResult.error.message);
    }

    const countRows = countResult.data || countResult.rows || [];
    const iconCount = parseInt(countRows[0]?.count || '0');
    
    const updateQuery = 'UPDATE ac_icon_categories SET icon_count = $1 WHERE category_id = $2';
    const updateResult = await db.rawQuery(updateQuery, [iconCount, categoryId]);
    
    if (updateResult.error) {
      throw new Error('Failed to update category icon count: ' + updateResult.error.message);
    }
    
    return true;
  } catch (error) {
    console.error('Update category icon count failed:', error);
    return false;
  }
}

// 批量更新所有分类的Icon数量
export async function updateAllCategoryIconCounts(): Promise<{
  success: boolean;
  updated_categories: number;
  message?: string;
}> {
  const db = new DatabaseAdapter(true);
  
  try {
    // 使用原始查询批量更新
    const query = `
      UPDATE ac_icon_categories 
      SET icon_count = (
        SELECT COUNT(*) 
        FROM ac_icons 
        WHERE ac_icons.category_id = ac_icon_categories.category_id 
          AND ac_icons.is_active = true
      )
      WHERE is_active = true
      RETURNING category_id
    `;
    
    const result = await db.rawQuery(query);
    
    if (result.error) {
      throw new Error('Failed to update all category icon counts: ' + result.error.message);
    }

    const rows = result.data || result.rows || [];
    
    return {
      success: true,
      updated_categories: rows.length,
      message: `Successfully updated ${rows.length} categories`
    };
  } catch (error) {
    console.error('Update all category icon counts failed:', error);
    return {
      success: false,
      updated_categories: 0,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// 获取最受欢迎的分类
export async function getPopularCategories(limit: number = 10): Promise<IconCategory[]> {
  const db = new DatabaseAdapter(true);
  
  const query = `
    SELECT * FROM ac_icon_categories 
    WHERE is_active = true 
    ORDER BY usage_count DESC, icon_count DESC 
    LIMIT $1
  `;
  
  const result = await db.rawQuery(query, [limit]);
  
  if (result.error) {
    throw new Error('Failed to get popular categories: ' + result.error.message);
  }

  const rows = result.data || result.rows || [];
  return rows.map(formatIconCategory);
}

// 获取分类统计信息
export async function getCategoryStats(): Promise<{
  total_categories: number;
  active_categories: number;
  categories_with_icons: number;
  total_icon_count: number;
  avg_icons_per_category: number;
  most_popular_category: IconCategory | null;
}> {
  const db = new DatabaseAdapter(true);
  
  const queries = [
    'SELECT COUNT(*) as total FROM ac_icon_categories',
    'SELECT COUNT(*) as active FROM ac_icon_categories WHERE is_active = true',
    'SELECT COUNT(*) as with_icons FROM ac_icon_categories WHERE icon_count > 0 AND is_active = true',
    'SELECT SUM(icon_count) as total_icons, AVG(icon_count) as avg_icons FROM ac_icon_categories WHERE is_active = true',
    'SELECT * FROM ac_icon_categories WHERE is_active = true ORDER BY usage_count DESC LIMIT 1'
  ];
  
  try {
    const results = await Promise.all(queries.map(query => db.rawQuery(query)));
    
    // 检查是否有错误
    for (const result of results) {
      if (result.error) {
        throw new Error('Failed to get category stats: ' + result.error.message);
      }
    }
    
    const [totalResult, activeResult, withIconsResult, iconStatsResult, popularResult] = results;
    
    const totalRows = totalResult.data || totalResult.rows || [];
    const activeRows = activeResult.data || activeResult.rows || [];
    const withIconsRows = withIconsResult.data || withIconsResult.rows || [];
    const iconStatsRows = iconStatsResult.data || iconStatsResult.rows || [];
    const popularRows = popularResult.data || popularResult.rows || [];
    
    return {
      total_categories: parseInt(totalRows[0]?.total || '0'),
      active_categories: parseInt(activeRows[0]?.active || '0'),
      categories_with_icons: parseInt(withIconsRows[0]?.with_icons || '0'),
      total_icon_count: parseInt(iconStatsRows[0]?.total_icons || '0'),
      avg_icons_per_category: parseFloat(iconStatsRows[0]?.avg_icons || '0'),
      most_popular_category: popularRows.length > 0 ? formatIconCategory(popularRows[0]) : null
    };
  } catch (error) {
    console.error('Error getting category stats:', error);
    throw error;
  }
}

// 格式化Icon分类数据
function formatIconCategory(row: any): IconCategory {
  return {
    id: row.id,
    uuid: row.uuid,
    category_id: row.category_id,
    category_name: row.category_name,
    parent_category_id: row.parent_category_id,
    description: row.description,
    ai_description: row.ai_description,
    ai_keywords: row.ai_keywords || [],
    display_order: row.display_order || 0,
    icon_color: row.icon_color || '#666666',
    is_active: row.is_active,
    icon_count: row.icon_count || 0,
    usage_count: row.usage_count || 0,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
} 