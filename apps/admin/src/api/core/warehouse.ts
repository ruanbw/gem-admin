import type { PageResult } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace WarehouseApi {
  /** 分页查询仓库接口参数 */
  export interface PageWarehouseParams {
    current: number;
    size: number;
    warehouseName?: string;
  }

  /**
   * 仓库类型枚举
   */
  export type WarehouseType = 'self_operated' | 'three_parties';

  /**
   * 仓库信息
   */
  export interface Warehouse {
    /**
     * 仓库ID
     */
    id?: number;
    /**
     * 仓库名
     */
    warehouseName: string;
    /**
     * 仓库类型
     */
    type?: WarehouseType;
    /**
     * 地址
     */
    address?: string;
    /**
     * 联系人
     */
    contactPerson?: string;
    /**
     * 联系电话
     */
    contactPhone?: string;
    /**
     * 创建时间
     */
    createAt?: string;
    /**
     * 回收品类
     */
    recyclingCategories: string;
  }

  /** 创建仓库接口参数 */
  export interface CreateWarehouseParams {
    warehouseName: string;
    type?: WarehouseType;
    address?: string;
    contactPerson?: string;
    contactPhone?: string;
    categoryIds?: number[];
  }

  /** 更新仓库接口参数 */
  export interface UpdateWarehouseParams {
    id: number;
    warehouseName?: string;
    type?: WarehouseType;
    address?: string;
    contactPerson?: string;
    contactPhone?: string;
    categoryIds?: number[];
  }
}

/**
 * 获取仓库列表
 */
export async function getWarehouseListApi(
  params: WarehouseApi.PageWarehouseParams,
) {
  return requestClient.get<PageResult<WarehouseApi.Warehouse>>('/warehouse', {
    params,
  });
}

/**
 * 获取仓库信息
 */
export async function getWarehouseApi(id: number) {
  return requestClient.get<WarehouseApi.Warehouse>(`/warehouse/${id}`);
}

/**
 * 创建仓库
 */
export async function createWarehouseApi(
  warehouse: WarehouseApi.CreateWarehouseParams,
) {
  return requestClient.post('/warehouse', warehouse);
}

/**
 * 更新仓库
 */
export async function updateWarehouseApi(
  warehouse: WarehouseApi.UpdateWarehouseParams,
) {
  return requestClient.put('/warehouse', warehouse);
}

/**
 * 删除仓库
 */
export async function deleteWarehouseApi(id: number) {
  return requestClient.delete(`/warehouse/${id}`);
}


