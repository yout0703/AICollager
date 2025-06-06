/**
 * Schema到Prompt自动转换工具
 * 
 * 基于业界最佳实践，从Zod Schema自动生成AI Prompt描述
 * 避免手动维护两套结构定义的问题
 * 
 * 参考：
 * - https://www.atlassian.com/blog/artificial-intelligence/ultimate-guide-writing-ai-prompts
 * - https://www.codecademy.com/article/ai-prompting-best-practices
 */

import { z } from 'zod';

/**
 * 从Zod Schema生成JSON Schema描述
 */
export function generateJsonSchemaFromZod(schema: z.ZodSchema): any {
  // 递归处理Schema
  function processSchema(zodSchema: any): any {
    const def = zodSchema._def;
    
    switch (def.typeName) {
      case 'ZodString':
        const stringSchema: any = { type: 'string' };
        
        // 处理字符串验证规则
        if (def.checks) {
          for (const check of def.checks) {
            switch (check.kind) {
              case 'min':
                stringSchema.minLength = check.value;
                break;
              case 'max':
                stringSchema.maxLength = check.value;
                break;
              case 'regex':
                stringSchema.pattern = check.regex.source;
                break;
            }
          }
        }
        
        // 添加枚举值
        if (def.values) {
          stringSchema.enum = def.values;
        }
        
        return stringSchema;
        
      case 'ZodNumber':
        const numberSchema: any = { type: 'number' };
        
        // 处理数字验证规则
        if (def.checks) {
          for (const check of def.checks) {
            switch (check.kind) {
              case 'min':
                if (check.inclusive) {
                  numberSchema.minimum = check.value;
                } else {
                  numberSchema.exclusiveMinimum = check.value;
                }
                break;
              case 'max':
                if (check.inclusive) {
                  numberSchema.maximum = check.value;
                } else {
                  numberSchema.exclusiveMaximum = check.value;
                }
                break;
              case 'int':
                numberSchema.type = 'integer';
                break;
            }
          }
        }
        
        return numberSchema;
        
      case 'ZodArray':
        const arraySchema: any = {
          type: 'array',
          items: processSchema(def.type)
        };
        
        if (def.minLength !== null) {
          arraySchema.minItems = def.minLength.value;
        }
        if (def.maxLength !== null) {
          arraySchema.maxItems = def.maxLength.value;
        }
        
        return arraySchema;
        
      case 'ZodObject':
        const objectSchema: any = {
          type: 'object',
          properties: {},
          required: []
        };
        
        // 处理对象属性
        for (const [key, value] of Object.entries(def.shape())) {
          objectSchema.properties[key] = processSchema(value);
          
          // 检查是否为必需属性
          if (!(value as any).isOptional()) {
            objectSchema.required.push(key);
          }
        }
        
        return objectSchema;
        
      case 'ZodEnum':
        return {
          type: 'string',
          enum: def.values
        };
        
      case 'ZodLiteral':
        return {
          type: typeof def.value,
          const: def.value
        };
        
      case 'ZodOptional':
        return processSchema(def.innerType);
        
      case 'ZodDefault':
        const defaultSchema = processSchema(def.innerType);
        defaultSchema.default = def.defaultValue();
        return defaultSchema;
        
      default:
        return { type: 'any' };
    }
  }
  
  return processSchema(schema);
}

/**
 * 从Zod Schema生成Prompt输出格式描述
 */
export function generateOutputFormatPrompt(schema: z.ZodSchema, options: {
  title?: string;
  includeExamples?: boolean;
  includeValidation?: boolean;
} = {}): string {
  const { title = '输出格式', includeExamples = true, includeValidation = true } = options;
  
  const jsonSchema = generateJsonSchemaFromZod(schema);
  
  let prompt = `\n## ${title}\n\n`;
  prompt += '**严格按照以下JSON格式输出：**\n\n';
  prompt += '```json\n';
  prompt += generateJsonExample(jsonSchema);
  prompt += '\n```\n\n';
  
  // 添加字段说明
  prompt += '**字段说明：**\n';
  prompt += generateFieldDescriptions(jsonSchema, '', 0);
  
  if (includeValidation) {
    prompt += '\n**验证要求：**\n';
    prompt += generateValidationRules(jsonSchema);
  }
  
  if (includeExamples) {
    prompt += '\n**注意事项：**\n';
    prompt += '- 必须返回有效的JSON格式，不要包含任何其他文本\n';
    prompt += '- 所有必需字段都必须包含\n';
    prompt += '- 数值类型必须在指定范围内\n';
    prompt += '- 字符串长度必须符合要求\n';
  }
  
  return prompt;
}

/**
 * 生成JSON示例
 */
function generateJsonExample(schema: any, depth = 0): string {
  const indent = '  '.repeat(depth);
  
  switch (schema.type) {
    case 'object':
      let result = '{\n';
      const properties = Object.entries(schema.properties || {});
      
      properties.forEach(([key, value], index) => {
        const isLast = index === properties.length - 1;
        result += `${indent}  "${key}": ${generateJsonExample(value as any, depth + 1)}${isLast ? '' : ','}\n`;
      });
      
      result += `${indent}}`;
      return result;
      
    case 'array':
      return `[\n${indent}  ${generateJsonExample(schema.items, depth + 1)}\n${indent}]`;
      
    case 'string':
      if (schema.enum) {
        return `"${schema.enum[0]}"`;
      }
      if (schema.pattern === '^#[0-9A-Fa-f]{6}$') {
        return '"#FF5733"';
      }
      if (schema.pattern === '^\\d+:\\d+$') {
        return '"16:9"';
      }
      return '"示例文本"';
      
    case 'number':
    case 'integer':
      if (schema.minimum !== undefined) {
        return String(schema.minimum);
      }
      if (schema.maximum !== undefined) {
        return String(Math.max(0, schema.maximum - 1));
      }
              return schema.type === 'integer' ? '1' : '0.8';
      
    case 'boolean':
      return 'true';
      
    default:
      if (schema.const !== undefined) {
        return typeof schema.const === 'string' ? `"${schema.const}"` : schema.const;
      }
      return '"未知类型"';
  }
}

/**
 * 生成字段描述
 */
function generateFieldDescriptions(schema: any, prefix = '', depth = 0): string {
  const indent = '  '.repeat(depth);
  let descriptions = '';
  
  if (schema.type === 'object' && schema.properties) {
    for (const [key, prop] of Object.entries(schema.properties)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const isRequired = schema.required?.includes(key) ? ' **(必需)**' : ' (可选)';
      
      descriptions += `${indent}- \`${key}\`${isRequired}：`;
      
      const propSchema = prop as any;
      
      // 添加类型信息
      if (propSchema.type) {
        descriptions += `${propSchema.type}`;
        
        // 添加约束信息
        const constraints = [];
        if (propSchema.minLength !== undefined) constraints.push(`最小长度${propSchema.minLength}`);
        if (propSchema.maxLength !== undefined) constraints.push(`最大长度${propSchema.maxLength}`);
        if (propSchema.minimum !== undefined) constraints.push(`最小值${propSchema.minimum}`);
        if (propSchema.maximum !== undefined) constraints.push(`最大值${propSchema.maximum}`);
        if (propSchema.pattern) constraints.push(`格式要求`);
        if (propSchema.enum) constraints.push(`可选值: ${propSchema.enum.join(', ')}`);
        
        if (constraints.length > 0) {
          descriptions += ` (${constraints.join(', ')})`;
        }
      }
      
      descriptions += '\n';
      
      // 递归处理嵌套对象
      if (propSchema.type === 'object') {
        descriptions += generateFieldDescriptions(propSchema, fullKey, depth + 1);
      } else if (propSchema.type === 'array' && propSchema.items?.type === 'object') {
        descriptions += generateFieldDescriptions(propSchema.items, `${fullKey}[]`, depth + 1);
      }
    }
  }
  
  return descriptions;
}

/**
 * 生成验证规则
 */
function generateValidationRules(schema: any): string {
  const rules = [];
  
  if (schema.type === 'object' && schema.required?.length > 0) {
    rules.push(`- 必需字段：${schema.required.join(', ')}`);
  }
  
  function collectRules(s: any, path = ''): void {
    if (s.type === 'string') {
      if (s.minLength !== undefined) {
        rules.push(`- ${path || '字符串'}最小长度：${s.minLength}`);
      }
      if (s.maxLength !== undefined) {
        rules.push(`- ${path || '字符串'}最大长度：${s.maxLength}`);
      }
      if (s.pattern) {
        rules.push(`- ${path || '字符串'}必须匹配格式要求`);
      }
    } else if (s.type === 'number' || s.type === 'integer') {
      if (s.minimum !== undefined) {
        rules.push(`- ${path || '数值'}最小值：${s.minimum}`);
      }
      if (s.maximum !== undefined) {
        rules.push(`- ${path || '数值'}最大值：${s.maximum}`);
      }
    } else if (s.type === 'array') {
      if (s.minItems !== undefined) {
        rules.push(`- ${path || '数组'}最少元素：${s.minItems}`);
      }
      if (s.maxItems !== undefined) {
        rules.push(`- ${path || '数组'}最多元素：${s.maxItems}`);
      }
    } else if (s.type === 'object' && s.properties) {
      for (const [key, prop] of Object.entries(s.properties)) {
        collectRules(prop as any, path ? `${path}.${key}` : key);
      }
    }
  }
  
  collectRules(schema);
  
  return rules.length > 0 ? rules.join('\n') : '- 无特殊验证要求';
}

/**
 * 从Schema描述信息生成字段说明
 */
export function extractFieldDescriptions(schema: z.ZodSchema): Record<string, string> {
  const descriptions: Record<string, string> = {};
  
  function extractFromDef(def: any, path = ''): void {
    if (def.description) {
      descriptions[path] = def.description;
    }
    
    if (def.typeName === 'ZodObject' && def.shape) {
      const shape = def.shape();
      for (const [key, value] of Object.entries(shape)) {
        const fullPath = path ? `${path}.${key}` : key;
        extractFromDef((value as any)._def, fullPath);
      }
    } else if (def.typeName === 'ZodArray') {
      extractFromDef(def.type._def, `${path}[]`);
    } else if (def.typeName === 'ZodOptional') {
      extractFromDef(def.innerType._def, path);
    }
  }
  
  extractFromDef(schema._def);
  return descriptions;
}

/**
 * 版本信息
 */
export const SCHEMA_TO_PROMPT_VERSION = {
  version: '1.0.0',
  lastUpdated: '2025-01-15',
  description: 'Schema到Prompt自动转换工具',
  features: [
    'Zod Schema到JSON Schema转换',
    '自动生成Prompt输出格式',
    '字段描述提取',
    '验证规则生成'
  ]
} as const; 