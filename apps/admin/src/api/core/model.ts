import type { BasicOption, PageResult } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace ModelApi {
  /** 创建型号接口参数 */
  export interface CreateModelParams {
    brandId: number;
    modelName: string;
  }

  /** 更新型号接口参数 */
  export interface UpdateModelParams {
    id: number;
    brandId: number;
    modelName: string;
  }

  /** 分页查询型号接口参数 */
  export interface PageModelParams {
    current: number;
    size: number;
    brandId?: number;
    modelName?: string;
  }

  /**
   * 分页查询型号信息
   */
  export interface PaginatedModel {
    /**
     * id，型号id
     */
    id: number;
    /**
     * 品牌id
     */
    brandId: number;
    /**
     * 品牌名称
     */
    brandName?: string;
    /**
     * 型号名称
     */
    modelName: string;
    /**
     * 创建时间
     */
    createdAt: string;
  }
}

/**
 * 获取型号列表
 */
export async function getModelListApi(params: ModelApi.PageModelParams) {
  return requestClient.get<PageResult<ModelApi.PaginatedModel>>('/model', {
    params,
  });
}

/**
 * 创建型号
 */
export async function createModelApi(model: ModelApi.CreateModelParams) {
  return requestClient.post('/model', model);
}

/**
 * 更新型号
 */
export async function updateModelApi(model: ModelApi.UpdateModelParams) {
  return requestClient.put('/model', model);
}

/**
 * 删除型号
 */
export async function deleteModelApi(modelId: number) {
  return requestClient.delete(`/model/${modelId}`);
}

/**
 * 获取型号信息
 */
export async function getModelApi(modelId: number) {
  return requestClient.get<ModelApi.PaginatedModel>(`/model/${modelId}`);
}

/**
 * 获取型号选项（用于下拉选择，支持远程搜索）
 */
export async function getModelOptionsApi(params?: { modelName?: string; brandId?: number }): Promise<BasicOption[]> {
  const result = await requestClient.get<PageResult<ModelApi.PaginatedModel>>('/model', {
    params: {
      current: 1,
      size: 100,
      ...params,
    },
  });
  // 转换为选项格式
  return result.records.map((item) => ({
    label: `${item.brandName} / ${item.modelName}`,
    value: item.id.toString(),
  }));
}

