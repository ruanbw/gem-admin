import type { PageResult } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace StatusApi {
  /** 状态类型 */
  export type StatusType = 'ACQUISITION' | 'INVENTORY';

  /** 创建状态接口参数 */
  export interface CreateStatusParams {
    configId: number;
    statusType: StatusType;
    statusValue: string;
  }

  /** 更新状态接口参数 */
  export interface UpdateStatusParams {
    id: number;
    configId: number;
    statusType: StatusType;
    statusValue: string;
  }

  /** 分页查询状态接口参数 */
  export interface PageStatusParams {
    current: number;
    size: number;
    configId?: number;
    statusType?: StatusType;
    statusValue?: string;
  }

  /**
   * 分页查询状态信息
   */
  export interface PaginatedStatus {
    /**
     * id，状态id
     */
    id: number;
    /**
     * 配置id
     */
    configId: number;
    /**
     * 配置名称（存储容量-颜色）
     */
    configName?: string;
    /**
     * 品牌名称
     */
    brandName?: string;
    /**
     * 型号名称
     */
    modelName?: string;
    /**
     * 存储容量
     */
    storage?: string;
    /**
     * 颜色
     */
    color?: string;
    /**
     * 状态类型
     */
    statusType: StatusType;
    /**
     * 状态值
     */
    statusValue: string;
    /**
     * 创建时间
     */
    createdAt: string;
  }
}

/**
 * 获取状态列表
 */
export async function getStatusListApi(params: StatusApi.PageStatusParams) {
  return requestClient.get<PageResult<StatusApi.PaginatedStatus>>('/status', {
    params,
  });
}

/**
 * 创建状态
 */
export async function createStatusApi(status: StatusApi.CreateStatusParams) {
  return requestClient.post('/status', status);
}

/**
 * 更新状态
 */
export async function updateStatusApi(status: StatusApi.UpdateStatusParams) {
  return requestClient.put('/status', status);
}

/**
 * 删除状态
 */
export async function deleteStatusApi(statusId: number) {
  return requestClient.delete(`/status/${statusId}`);
}

/**
 * 获取状态信息
 */
export async function getStatusApi(statusId: number) {
  return requestClient.get<StatusApi.PaginatedStatus>(`/status/${statusId}`);
}

