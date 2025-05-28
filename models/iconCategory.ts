import { getDb } from "@/models/db";
import { v4 as uuidv4 } from 'uuid';
import { IconCategory } from '@/types/icons';

// 创建新Icon分类
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
  const db = getDb();
  const uuid = uuidv4();
  const now = new Date().toISOString();

  const res = await db.query(
    `INSERT INTO ac_icon_categories 
      (uuid, category_id, category_name, parent_category_id, description, ai_description, 
       ai_keywords, display_order, icon_color, created_at, updated_at) 
      VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
    [
      uuid,
      params.category_id,
      params.category_name,
      params.parent_category_id,
      params.description,
      params.ai_description,
      params.ai_keywords || [],
      params.display_order || 0,
      params.icon_color || '#666666',
      now,
      now
    ]
  );

  if (res.rowCount === 0) {
    throw new Error('Failed to create icon category');
  }

  return formatIconCategory(res.rows[0]);
}

// 根据ID查找Icon分类
export async function findIconCategoryById(categoryId: string): Promise<IconCategory | undefined> {
  const db = getDb();
  
  const res = await db.query(
    'SELECT * FROM ac_icon_categories WHERE category_id = $1 AND is_active = true LIMIT 1',
    [categoryId]
  );
  
  if (res.rowCount === 0) {
    return undefined;
  }

  return formatIconCategory(res.rows[0]);
}

// 根据UUID查找Icon分类
export async function findIconCategoryByUuid(uuid: string): Promise<IconCategory | undefined> {
  const db = getDb();
  
  const res = await db.query(
    'SELECT * FROM ac_icon_categories WHERE uuid = $1 AND is_active = true LIMIT 1',
    [uuid]
  );
  
  if (res.rowCount === 0) {
    return undefined;
  }

  return formatIconCategory(res.rows[0]);
}

// 获取所有启用的Icon分类
export async function getAllIconCategories(options: {
  include_inactive?: boolean;
  include_count?: boolean;
} = {}): Promise<IconCategory[]> {
  const db = getDb();
  
  let whereClause = '';
  if (!options.include_inactive) {
    whereClause = 'WHERE is_active = true';
  }
  
  let query = `SELECT * FROM ac_icon_categories ${whereClause} ORDER BY display_order ASC, category_name ASC`;
  
  const res = await db.query(query);
  
  let categories = res.rows.map(formatIconCategory);
  
  // 如果需要包含Icon数量，查询每个分类的Icon数量
  if (options.include_count) {
    for (const category of categories) {
      const countRes = await db.query(
        'SELECT COUNT(*) as count FROM ac_icons WHERE category_id = $1 AND is_active = true',
        [category.category_id]
      );
      category.icon_count = parseInt(countRes.rows[0]?.count || '0');
    }
  }
  
  return categories;
}

// 获取顶级分类（没有父分类的）
export async function getTopLevelCategories(options: {
  include_count?: boolean;
} = {}): Promise<IconCategory[]> {
  const db = getDb();
  
  const query = `
    SELECT * FROM ac_icon_categories 
    WHERE parent_category_id IS NULL AND is_active = true 
    ORDER BY display_order ASC, category_name ASC
  `;
  
  const res = await db.query(query);
  let categories = res.rows.map(formatIconCategory);
  
  // 如果需要包含Icon数量
  if (options.include_count) {
    for (const category of categories) {
      const countRes = await db.query(
        'SELECT COUNT(*) as count FROM ac_icons WHERE category_id = $1 AND is_active = true',
        [category.category_id]
      );
      category.icon_count = parseInt(countRes.rows[0]?.count || '0');
    }
  }
  
  return categories;
}

// 获取子分类
export async function getChildCategories(parentCategoryId: string): Promise<IconCategory[]> {
  const db = getDb();
  
  const res = await db.query(
    `SELECT * FROM ac_icon_categories 
     WHERE parent_category_id = $1 AND is_active = true 
     ORDER BY display_order ASC, category_name ASC`,
    [parentCategoryId]
  );
  
  return res.rows.map(formatIconCategory);
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
  const db = getDb();
  
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
  
  const res = await db.query(query, queryParams);
  
  return res.rows.map(formatIconCategory);
}

// 更新分类使用次数
export async function updateCategoryUsage(categoryId: string): Promise<boolean> {
  const db = getDb();
  
  try {
    await db.query(
      'UPDATE ac_icon_categories SET usage_count = usage_count + 1 WHERE category_id = $1',
      [categoryId]
    );
    
    return true;
  } catch (error) {
    console.error('Update category usage failed:', error);
    return false;
  }
}

// 更新分类中的Icon数量
export async function updateCategoryIconCount(categoryId: string): Promise<boolean> {
  const db = getDb();
  
  try {
    const countRes = await db.query(
      'SELECT COUNT(*) as count FROM ac_icons WHERE category_id = $1 AND is_active = true',
      [categoryId]
    );
    
    const iconCount = parseInt(countRes.rows[0]?.count || '0');
    
    await db.query(
      'UPDATE ac_icon_categories SET icon_count = $1 WHERE category_id = $2',
      [iconCount, categoryId]
    );
    
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
  const db = getDb();
  
  try {
    // 更新所有分类的Icon数量
    const updateRes = await db.query(`
      UPDATE ac_icon_categories 
      SET icon_count = subquery.icon_count 
      FROM (
        SELECT 
          category_id,
          COUNT(*) as icon_count 
        FROM ac_icons 
        WHERE is_active = true 
        GROUP BY category_id
      ) AS subquery 
      WHERE ac_icon_categories.category_id = subquery.category_id
    `);
    
    // 将没有Icon的分类设为0
    await db.query(`
      UPDATE ac_icon_categories 
      SET icon_count = 0 
      WHERE category_id NOT IN (
        SELECT DISTINCT category_id 
        FROM ac_icons 
        WHERE is_active = true
      )
    `);
    
    return {
      success: true,
      updated_categories: updateRes.rowCount || 0,
      message: '成功更新所有分类的Icon数量'
    };
    
  } catch (error) {
    console.error('Update all category icon counts failed:', error);
    return {
      success: false,
      updated_categories: 0,
      message: '更新分类Icon数量失败'
    };
  }
}

// 获取最受欢迎的分类
export async function getPopularCategories(limit: number = 10): Promise<IconCategory[]> {
  const db = getDb();
  
  const res = await db.query(
    `SELECT * FROM ac_icon_categories 
     WHERE is_active = true 
     ORDER BY usage_count DESC, icon_count DESC 
     LIMIT $1`,
    [limit]
  );
  
  return res.rows.map(formatIconCategory);
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
  const db = getDb();
  
  const [totalRes, activeRes, withIconsRes, iconCountRes, popularRes] = await Promise.all([
    db.query('SELECT COUNT(*) as total FROM ac_icon_categories'),
    db.query('SELECT COUNT(*) as active FROM ac_icon_categories WHERE is_active = true'),
    db.query('SELECT COUNT(*) as with_icons FROM ac_icon_categories WHERE icon_count > 0 AND is_active = true'),
    db.query('SELECT SUM(icon_count) as total, AVG(icon_count) as avg FROM ac_icon_categories WHERE is_active = true'),
    db.query('SELECT * FROM ac_icon_categories WHERE is_active = true ORDER BY usage_count DESC LIMIT 1')
  ]);
  
  const totalCategories = parseInt(totalRes.rows[0]?.total || '0');
  const activeCategories = parseInt(activeRes.rows[0]?.active || '0');
  const categoriesWithIcons = parseInt(withIconsRes.rows[0]?.with_icons || '0');
  const totalIconCount = parseInt(iconCountRes.rows[0]?.total || '0');
  const avgIconsPerCategory = parseFloat(iconCountRes.rows[0]?.avg || '0');
  const mostPopularCategory = popularRes.rows[0] ? formatIconCategory(popularRes.rows[0]) : null;
  
  return {
    total_categories: totalCategories,
    active_categories: activeCategories,
    categories_with_icons: categoriesWithIcons,
    total_icon_count: totalIconCount,
    avg_icons_per_category: Math.round(avgIconsPerCategory * 100) / 100,
    most_popular_category: mostPopularCategory
  };
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