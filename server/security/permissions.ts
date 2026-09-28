export type UserRole = 'executive' | 'data_analyst' | 'business_user' | 'restricted_viewer';

export interface DataSourceDefinition {
  id: string;
  name: string;
  description: string;
  category: 'database' | 'documents' | 'api';
  minRoleRequired: UserRole;
  isRestrictedByDefault?: boolean;
}

export const DATA_SOURCE_REGISTRY: Record<string, DataSourceDefinition> = {
  sales_db: {
    id: 'sales_db',
    name: 'Sales Transactions Database (PostgreSQL)',
    description: 'Historical transactional sales records, revenue, quantities, and margins',
    category: 'database',
    minRoleRequired: 'business_user'
  },
  products_db: {
    id: 'products_db',
    name: 'Product Catalog Database (PostgreSQL)',
    description: 'Product definitions, categories, baseline prices, and current inventory levels',
    category: 'database',
    minRoleRequired: 'business_user'
  },
  customers_db: {
    id: 'customers_db',
    name: 'Customer & Region Registry (PostgreSQL)',
    description: 'Corporate customer accounts, cities, geographic territories, and registration info',
    category: 'database',
    minRoleRequired: 'business_user'
  },
  corporate_docs: {
    id: 'corporate_docs',
    name: 'Corporate Policy & Strategy Documents (RAG)',
    description: 'Internal documentation: regional inventory policies, sales strategies, and SLAs',
    category: 'documents',
    minRoleRequired: 'business_user'
  },
  inventory_policy_docs: {
    id: 'inventory_policy_docs',
    name: 'Regional Inventory Allocation Policies (RAG)',
    description: 'Warehouse maintenance logs, safety stock levels, and regional restriction circulars',
    category: 'documents',
    minRoleRequired: 'business_user'
  },
  marketing_api: {
    id: 'marketing_api',
    name: 'Regional Marketing Campaign API',
    description: 'Ad spend metrics, regional conversion benchmarks, and trade show schedules',
    category: 'api',
    minRoleRequired: 'data_analyst'
  },
  hr_salary_db: {
    id: 'hr_salary_db',
    name: 'Employee Compensation & Payroll Database',
    description: 'Confidential employee salaries, bonuses, and executive compensation records',
    category: 'database',
    minRoleRequired: 'executive',
    isRestrictedByDefault: true
  }
};

const ROLE_HIERARCHY: Record<UserRole, number> = {
  restricted_viewer: 1,
  business_user: 2,
  data_analyst: 3,
  executive: 4
};

export interface PermissionCheckResult {
  sourceId: string;
  sourceName: string;
  allowed: boolean;
  reason?: string;
  currentRole: UserRole;
  requiredRole: UserRole;
}

export function checkSourcePermission(
  sourceId: string,
  userRole: UserRole = 'data_analyst'
): PermissionCheckResult {
  const source = DATA_SOURCE_REGISTRY[sourceId];
  if (!source) {
    return {
      sourceId,
      sourceName: sourceId,
      allowed: false,
      reason: `Unknown data source '${sourceId}' is not registered in the security catalogue.`,
      currentRole: userRole,
      requiredRole: 'executive'
    };
  }

  // Explicit check for sensitive HR salary database
  if (sourceId === 'hr_salary_db' && userRole !== 'executive') {
    return {
      sourceId,
      sourceName: source.name,
      allowed: false,
      reason: `Access Denied: The requested source '${source.name}' contains confidential compensation data and is restricted to the Executive role. Your current role is '${userRole}'.`,
      currentRole: userRole,
      requiredRole: 'executive'
    };
  }

  const userLevel = ROLE_HIERARCHY[userRole] || 1;
  const requiredLevel = ROLE_HIERARCHY[source.minRoleRequired] || 2;

  if (userLevel >= requiredLevel) {
    return {
      sourceId,
      sourceName: source.name,
      allowed: true,
      currentRole: userRole,
      requiredRole: source.minRoleRequired
    };
  } else {
    return {
      sourceId,
      sourceName: source.name,
      allowed: false,
      reason: `Access Denied: Role '${userRole}' lacks permission to access '${source.name}'. Requires '${source.minRoleRequired}' or higher.`,
      currentRole: userRole,
      requiredRole: source.minRoleRequired
    };
  }
}

export function checkMultipleSources(
  sourceIds: string[],
  userRole: UserRole = 'data_analyst'
): { allAllowed: boolean; results: PermissionCheckResult[]; deniedSources: PermissionCheckResult[] } {
  const results = sourceIds.map(id => checkSourcePermission(id, userRole));
  const deniedSources = results.filter(r => !r.allowed);
  return {
    allAllowed: deniedSources.length === 0,
    results,
    deniedSources
  };
}
