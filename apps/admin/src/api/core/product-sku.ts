import type { PageResult } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace ProductSkuApi {
  /** SKU状态类型：1启用 0禁用 */
  export type ProductSkuStatus = 0 | 1;

  /** 分页查询SKU接口参数 */
  export interface PageProductSkuParams {
    current: number;
    size: number;
    productId?: number;
    status?: ProductSkuStatus;
  }

  /**
   * 分页查询SKU信息（列表）
   */
  export interface PaginatedProductSku {
    /**
     * id，SKU id
     */
    id: number;
    /**
     * 商品id
     */
    productId: number;
    /**
     * SKU编码
     */
    skuCode: string;
    /**
     * 销售价
     */
    price: number;
    /**
     * 库存
     */
    stock: number;
    /**
     * 状态：1启用 0禁用
     */
    status: ProductSkuStatus;
    /**
     * 规格信息（解析后的JSON）
     */
    specJson?: Record<string, string>;
    /**
     * 封面图
     */
    coverImage?: string;
    /**
     * 创建时间
     */
    createdAt: string;
  }

  /**
   * SKU详情
   */
  export interface ProductSku {
    /**
     * id，SKU id
     */
    id: number;
    /**
     * 商品id
     */
    productId: number;
    /**
     * SKU编码
     */
    skuCode: string;
    /**
     * 模型url
     */
    modelUrl?: string;
    /**
     * 封面图
     */
    coverImage: string;
    /**
     * 销售价
     */
    price: number;
    /**
     * 库存
     */
    stock: number;
    /**
     * 锁定库存
     */
    lockedStock: number;
    /**
     * 状态：1启用 0禁用
     */
    status: ProductSkuStatus;
    /**
     * 规格信息（解析后的JSON）
     */
    specJson: Record<string, string>;
    /**
     * 创建时间
     */
    createdAt: string;
    /**
     * 更新时间
     */
    updatedAt: string;
  }

  /** 创建SKU接口参数 */
  export interface CreateProductSkuParams {
    productId: number;
    skuCode: string;
    modelUrl?: string;
    coverImage: string;
    price: number;
    stock: number;
    lockedStock?: number;
    specJson: Record<string, string>;
    status?: ProductSkuStatus;
  }

  /** 更新SKU接口参数 */
  export interface UpdateProductSkuParams {
    id: number;
    productId: number;
    skuCode?: string;
    modelUrl?: string;
    coverImage?: string;
    price?: number;
    stock?: number;
    lockedStock?: number;
    specJson?: Record<string, string>;
    status?: ProductSkuStatus;
  }
}

/**
 * 后端返回的SKU分页响应格式
 */
interface ProductSkuPageResponse extends PageResult<ProductSkuApi.PaginatedProductSku> {}

/**
 * 获取SKU列表
 */
export async function getProductSkuListApi(params: ProductSkuApi.PageProductSkuParams) {
  const response = await requestClient.get<ProductSkuPageResponse>('/product-sku', {
    params,
  });
  return response;
}

/**
 * 获取SKU详情
 */
export async function getProductSkuApi(skuId: number) {
  return requestClient.get<ProductSkuApi.ProductSku>(`/product-sku/${skuId}`);
}

/**
 * 创建SKU
 */
export async function createProductSkuApi(sku: ProductSkuApi.CreateProductSkuParams) {
  return requestClient.post('/product-sku', sku);
}

/**
 * 更新SKU
 */
export async function updateProductSkuApi(sku: ProductSkuApi.UpdateProductSkuParams) {
  return requestClient.put('/product-sku', sku);
}

/**
 * 删除SKU
 */
export async function deleteProductSkuApi(skuId: number) {
  return requestClient.delete(`/product-sku/${skuId}`);
}

