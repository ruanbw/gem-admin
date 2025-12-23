import type { BasicOption, PageResult } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace ConfigurationApi {
  /** 创建配置接口参数 */
  export interface CreateConfigurationParams {
    modelId: number;
    storage: string;
    color?: string;
    activationStatus?: 'NEW' | 'PRE_ACTIVATION';
  }

  /** 更新配置接口参数 */
  export interface UpdateConfigurationParams {
    id: number;
    modelId: number;
    storage: string;
    color?: string;
    activationStatus?: 'NEW' | 'PRE_ACTIVATION';
  }

  /** 分页查询配置接口参数 */
  export interface PageConfigurationParams {
    current: number;
    size: number;
    modelId?: number;
    storage?: string;
    color?: string;
    activationStatus?: 'NEW' | 'PRE_ACTIVATION';
  }

  /**
   * 分页查询配置信息
   */
  export interface PaginatedConfiguration {
    /**
     * id，配置id
     */
    id: number;
    /**
     * 型号id
     */
    modelId: number;
    /**
     * 型号名称
     */
    modelName: string;
    /**
     * 品牌名称
     */
    brandName: string;
    /**
     * 存储容量
     */
    storage: string;
    /**
     * 颜色
     */
    color?: string;
    /**
     * 激活状态
     */
    activationStatus: 'NEW' | 'PRE_ACTIVATION';
    /**
     * 创建时间
     */
    createdAt: string;
  }
}

/**
 * 获取配置列表
 */
export async function getConfigurationListApi(params: ConfigurationApi.PageConfigurationParams) {
  return requestClient.get<PageResult<ConfigurationApi.PaginatedConfiguration>>('/configuration', {
    params,
  });
}

/**
 * 创建配置
 */
export async function createConfigurationApi(configuration: ConfigurationApi.CreateConfigurationParams) {
  return requestClient.post('/configuration', configuration);
}

/**
 * 更新配置
 */
export async function updateConfigurationApi(configuration: ConfigurationApi.UpdateConfigurationParams) {
  return requestClient.put('/configuration', configuration);
}

/**
 * 删除配置
 */
export async function deleteConfigurationApi(configurationId: number) {
  return requestClient.delete(`/configuration/${configurationId}`);
}

/**
 * 获取配置信息
 */
export async function getConfigurationApi(configurationId: number) {
  return requestClient.get<ConfigurationApi.PaginatedConfiguration>(`/configuration/${configurationId}`);
}

