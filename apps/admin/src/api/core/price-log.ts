import type { PageResult } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace PriceLogApi {
  /** 分页查询报价日志接口参数 */
  export interface PagePriceLogParams {
    current: number;
    size: number;
    priceId?: number;
  }

  /**
   * 分页查询报价日志信息
   */
  export interface PaginatedPriceLog {
    /**
     * id，日志id
     */
    id: number;
    /**
     * 报价id
     */
    priceId: number;
    /**
     * 配置名称（关联查询）
     */
    configName?: string;
    /**
     * 旧价格
     */
    oldPrice: number | null;
    /**
     * 新价格
     */
    newPrice: number | null;
    /**
     * 变更原因
     */
    changeReason: string | null;
    /**
     * 创建时间
     */
    createdAt: string;
  }
}

/**
 * 获取报价日志列表
 */
export async function getPriceLogListApi(params: PriceLogApi.PagePriceLogParams) {
  return requestClient.get<PageResult<PriceLogApi.PaginatedPriceLog>>('/price-log', {
    params,
  });
}

/**
 * 获取报价日志信息
 */
export async function getPriceLogApi(logId: number) {
  return requestClient.get<PriceLogApi.PaginatedPriceLog>(`/price-log/${logId}`);
}

