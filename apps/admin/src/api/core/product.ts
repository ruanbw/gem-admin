import type { PageResult } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace ProductApi {
  /** 商品状态类型：ONLINE上架 OFFLINE下架 */
  export type ProductStatus = 'ONLINE' | 'OFFLINE';

  /** 分页查询商品接口参数 */
  export interface PageProductParams {
    current: number;
    size: number;
    name?: string;
    status?: ProductStatus;
  }

  /**
   * 分页查询商品信息（列表）
   */
  export interface PaginatedProduct {
    /**
     * id，商品id
     */
    id: number;
    /**
     * 商品名称
     */
    name: string;
    /**
     * 封面图
     */
    coverImage: string;
    /**
     * 状态：ONLINE上架 OFFLINE下架
     */
    status: ProductStatus;
    /**
     * 创建时间
     */
    createdAt: string;
  }

  /**
   * 商品详情
   */
  export interface Product {
    /**
     * id，商品id
     */
    id: number;
    /**
     * 商品名称
     */
    name: string;
    /**
     * 封面图
     */
    coverImage: string;
    /**
     * 商品描述
     */
    description: string;
    /**
     * 状态：ONLINE上架 OFFLINE下架
     */
    status: ProductStatus;
    /**
     * 创建时间
     */
    createdAt: string;
    /**
     * 更新时间
     */
    updatedAt: string;
    /**
     * 预览图URL列表
     */
    previewImages: string[];
  }

  /** 创建商品接口参数 */
  export interface CreateProductParams {
    name: string;
    coverImage?: string;
    description?: string;
    status?: ProductStatus;
    previewImages?: string[];
  }

  /** 更新商品接口参数 */
  export interface UpdateProductParams {
    id: number;
    name?: string;
    coverImage?: string;
    description?: string;
    status?: ProductStatus;
    previewImages?: string[];
  }
}

/**
 * 后端返回的商品分页响应格式
 */
interface ProductPageResponse extends PageResult<ProductApi.PaginatedProduct> {}

/**
 * 获取商品列表
 */
export async function getProductListApi(params: ProductApi.PageProductParams) {
  const response = await requestClient.get<ProductPageResponse>('/product', {
    params,
  });
  // 后端已返回标准PageResult格式，直接返回
  return response;
}

/**
 * 获取商品详情
 */
export async function getProductApi(productId: number) {
  return requestClient.get<ProductApi.Product>(`/product/${productId}`);
}

/**
 * 创建商品
 */
export async function createProductApi(product: ProductApi.CreateProductParams) {
  return requestClient.post('/product', product);
}

/**
 * 更新商品
 */
export async function updateProductApi(product: ProductApi.UpdateProductParams) {
  return requestClient.put('/product', product);
}

/**
 * 删除商品
 */
export async function deleteProductApi(productId: number) {
  return requestClient.delete(`/product/${productId}`);
}

