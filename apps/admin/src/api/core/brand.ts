import type { BasicOption, PageResult } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace BrandApi {
  /** 创建品牌接口参数 */
  export interface CreateBrandParams {
    brandName: string;
  }

  /** 更新品牌接口参数 */
  export interface UpdateBrandParams {
    id: number;
    brandName: string;
  }

  /** 分页查询品牌接口参数 */
  export interface PageBrandParams {
    current: number;
    size: number;
    brandName?: string;
  }

  /**
   * 分页查询品牌信息
   */
  export interface PaginatedBrand {
    /**
     * id，品牌id
     */
    id: number;
    /**
     * 品牌名称
     */
    brandName: string;
    /**
     * 创建时间
     */
    createdAt: string;
  }
}

/**
 * 获取品牌列表
 */
export async function getBrandListApi(params: BrandApi.PageBrandParams) {
  return requestClient.get<PageResult<BrandApi.PaginatedBrand>>('/brand', {
    params,
  });
}

/**
 * 创建品牌
 */
export async function createBrandApi(brand: BrandApi.CreateBrandParams) {
  return requestClient.post('/brand', brand);
}

/**
 * 更新品牌
 */
export async function updateBrandApi(brand: BrandApi.UpdateBrandParams) {
  return requestClient.put('/brand', brand);
}

/**
 * 删除品牌
 */
export async function deleteBrandApi(brandId: number) {
  return requestClient.delete(`/brand/${brandId}`);
}

/**
 * 获取品牌信息
 */
export async function getBrandApi(brandId: number) {
  return requestClient.get<BrandApi.PaginatedBrand>(`/brand/${brandId}`);
}

/**
 * 获取品牌选项（用于下拉选择，支持远程搜索）
 */
export async function getBrandOptionsApi(params?: { brandName?: string }): Promise<BasicOption[]> {
  const result = await requestClient.get<PageResult<BrandApi.PaginatedBrand>>('/brand', {
    params: {
      current: 1,
      size: 100,
      ...params,
    },
  });
  // 转换为选项格式
  return result.records.map((item) => ({
    label: item.brandName,
    value: item.id.toString(),
  }));
}

