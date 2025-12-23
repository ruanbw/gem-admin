import type { BasicOption, PageResult } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace RoleApi {
  /** 分页查询角色接口参数 */
  export interface PageRoleParams {
    current: number;
    size: number;
  }

  /**
   * 分页查询角色信息
   */
  export interface Role {
    id?: number;
    roleName: string;
    roleCode: string;
    description: string;
    permissionIds?: number[];
  }
}

/**
 * 获取角色选项
 */
export async function getRoleOptionsApi() {
  return requestClient.get<BasicOption[]>('/role/options');
}

/**
 * 获取角色列表
 */
export async function getRoleListApi(params: RoleApi.PageRoleParams) {
  return requestClient.get<PageResult<RoleApi.Role>>('/role', { params });
}

/**
 * 创建角色
 */
export async function createRoleApi(role: RoleApi.Role) {
  return requestClient.post('/role', role);
}

/**
 * 更新用户
 */
export async function updateRoleApi(role: RoleApi.Role) {
  return requestClient.put('/role', role);
}

/**
 * 删除角色
 */
export async function deleteRoleApi(roleId: number) {
  return requestClient.delete(`/role/${roleId}`);
}

/**
 * 获取角色信息
 */
export async function getRoleApi(roleId: number) {
  return requestClient.get<RoleApi.Role>(`/role/${roleId}`);
}
