import type { PageResult } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SpecApi {
  /** 分页查询规格接口参数 */
  export interface PageSpecParams {
    current: number;
    size: number;
    name?: string;
  }

  /**
   * 分页查询规格信息（列表）
   */
  export interface PaginatedSpec {
    /**
     * id，规格id
     */
    id: number;
    /**
     * 规格名称
     */
    name: string;
    /**
     * 创建时间
     */
    createdAt: string;
  }

  /**
   * 规格详情
   */
  export interface Spec {
    /**
     * id，规格id
     */
    id: number;
    /**
     * 规格名称
     */
    name: string;
    /**
     * 创建时间
     */
    createdAt: string;
  }

  /** 创建规格接口参数 */
  export interface CreateSpecParams {
    name: string;
  }

  /** 更新规格接口参数 */
  export interface UpdateSpecParams {
    id: number;
    name?: string;
  }
}

/**
 * 后端返回的规格分页响应格式
 */
interface SpecPageResponse extends PageResult<SpecApi.PaginatedSpec> {}

/**
 * 获取规格列表
 */
export async function getSpecListApi(params: SpecApi.PageSpecParams) {
  const response = await requestClient.get<SpecPageResponse>('/spec', {
    params,
  });
  return response;
}

/**
 * 获取规格详情
 */
export async function getSpecApi(specId: number) {
  return requestClient.get<SpecApi.Spec>(`/spec/${specId}`);
}

/**
 * 创建规格
 */
export async function createSpecApi(spec: SpecApi.CreateSpecParams) {
  return requestClient.post('/spec', spec);
}

/**
 * 更新规格
 */
export async function updateSpecApi(spec: SpecApi.UpdateSpecParams) {
  return requestClient.put('/spec', spec);
}

/**
 * 删除规格
 */
export async function deleteSpecApi(specId: number) {
  return requestClient.delete(`/spec/${specId}`);
}

