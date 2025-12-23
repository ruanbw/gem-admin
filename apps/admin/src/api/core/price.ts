import type { BasicOption, PageResult } from '@vben/types';

import { requestClient } from '#/api/request';
import type { ConfigurationApi } from './configuration';

export namespace PriceApi {
  /** 创建报价接口参数 */
  export interface CreatePriceParams {
    configId: number;
    price: number;
    changeAmount?: number;
    isActive?: number;
  }

  /** 更新报价接口参数 */
  export interface UpdatePriceParams {
    id: number;
    configId: number;
    price: number;
    changeAmount?: number;
    isActive?: number;
  }

  /** 分页查询报价接口参数 */
  export interface PagePriceParams {
    current: number;
    size: number;
    configId?: number;
    isActive?: number;
  }

  /**
   * 分页查询报价信息
   */
  export interface PaginatedPrice {
    /**
     * id，报价id
     */
    id: number;
    /**
     * 配置id
     */
    configId: number;
    /**
     * 配置名称（关联查询）
     */
    brandName: string;
    /**
     * 型号名称
     */
    modelName: string;
    /**
     * 存储容量
     */
    storage: string;
    /**
     * 颜色
     */
    color: string;
    /**
     * 当前报价
     */
    price: number;
    /**
     * 价格变动值
     */
    changeAmount: number;
    /**
     * 是否为最新有效价格
     */
    isActive: boolean;
    /**
     * 创建时间
     */
    createdAt: string;
    /**
     * 更新时间
     */
    updatedAt: string;
  }
}

/**
 * 获取报价列表
 */
export async function getPriceListApi(params: PriceApi.PagePriceParams) {
  return requestClient.get<PageResult<PriceApi.PaginatedPrice>>('/price', {
    params,
  });
}

/**
 * 创建报价
 */
export async function createPriceApi(price: PriceApi.CreatePriceParams) {
  return requestClient.post('/price', price);
}

/**
 * 更新报价
 */
export async function updatePriceApi(price: PriceApi.UpdatePriceParams) {
  return requestClient.put('/price', price);
}

/**
 * 删除报价
 */
export async function deletePriceApi(priceId: number) {
  return requestClient.delete(`/price/${priceId}`);
}

/**
 * 获取报价信息
 */
export async function getPriceApi(priceId: number) {
  return requestClient.get<PriceApi.PaginatedPrice>(`/price/${priceId}`);
}

/**
 * 获取配置选项（用于下拉选择，支持远程搜索）
 */
export async function getConfigurationOptionsApi(params?: { storage?: string; color?: string }): Promise<BasicOption[]> {
  const result = await requestClient.get<PageResult<ConfigurationApi.PaginatedConfiguration>>('/configuration', {
    params: {
      current: 1,
      size: 100,
      ...params,
    },
  });
  // 转换为选项格式，显示格式：存储容量-颜色（如果有）
  return result.records.map((item) => {
    const label = `${item.brandName} / ${item.modelName} / ${item.storage} / ${item.color}`;
    return {
      label,
      value: item.id.toString(),
    };
  });
}

/**
 * 获取报价选项（用于下拉选择）
 */
export async function getPriceOptionsApi(): Promise<BasicOption[]> {
  const result = await requestClient.get<PageResult<PriceApi.PaginatedPrice>>('/price', {
    params: {
      current: 1,
      size: 100,
    },
  });
  // 转换为选项格式，显示格式：配置名称 - 当前报价
  return result.records.map((item) => {
    const label = `${item.brandName} / ${item.modelName} / ${item.storage} / ${item.color} - ¥${item.price.toFixed(2)}`;
    return {
      label,
      value: item.id.toString(),
    };
  });
}

