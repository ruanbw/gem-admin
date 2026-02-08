import type { PageResult } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SpecValueApi {
  /** 分页查询规格值接口参数 */
  export interface PageSpecValueParams {
    current: number;
    size: number;
    specId?: number;
  }

  /**
   * 分页查询规格值信息（列表）
   */
  export interface PaginatedSpecValue {
    /**
     * id，规格值id
     */
    id: number;
    /**
     * 规格id
     */
    specId: number;
    /**
     * 规格名
     */
    specName: string;
    /**
     * 规格值
     */
    value: string;
    /**
     * 创建时间
     */
    createdAt: string;
  }

  /**
   * 规格值详情
   */
  export interface SpecValue {
    /**
     * id，规格值id
     */
    id: number;
    /**
     * 规格id
     */
    specId: number;
    /**
     * 规格值
     */
    value: string;
    /**
     * 创建时间
     */
    createdAt: string;
    /**
     * 预览图（如果后端支持）
     */
    previewImage?: string;
  }

  /** 创建规格值接口参数 */
  export interface CreateSpecValueParams {
    specId?: number;
    value: string;
    previewImage?: string;
  }

  /** 更新规格值接口参数 */
  export interface UpdateSpecValueParams {
    id: number;
    specId: number;
    value: string;
    previewImage?: string;
  }
}

/**
 * 后端返回的规格值分页响应格式
 */
interface SpecValuePageResponse extends PageResult<SpecValueApi.PaginatedSpecValue> {}

/**
 * 获取规格值列表
 */
export async function getSpecValueListApi(params: SpecValueApi.PageSpecValueParams) {
  const response = await requestClient.get<SpecValuePageResponse>('/spec-value', {
    params,
  });
  return response;
}

/**
 * 获取规格值详情
 */
export async function getSpecValueApi(specValueId: number) {
  return requestClient.get<SpecValueApi.SpecValue>(`/spec-value/${specValueId}`);
}

/**
 * 创建规格值
 */
export async function createSpecValueApi(specValue: SpecValueApi.CreateSpecValueParams) {
  return requestClient.post('/spec-value', specValue);
}

/**
 * 更新规格值
 */
export async function updateSpecValueApi(specValue: SpecValueApi.UpdateSpecValueParams) {
  return requestClient.put('/spec-value', specValue);
}

/**
 * 删除规格值
 */
export async function deleteSpecValueApi(specValueId: number) {
  return requestClient.delete(`/spec-value/${specValueId}`);
}
