import type { PageResult } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace OrderApi {
  /**
   * 订单状态：待支付、已支付、已发货、完成、取消
   */
  export type OrderStatus =
    | 'PENDING_PAYMENT'
    | 'PAID'
    | 'SHIPPED'
    | 'COMPLETED'
    | 'CANCELLED';

  /** 分页查询订单接口参数 */
  export interface PageOrderParams {
    current: number;
    size: number;
    userId?: number;
    status?: OrderStatus;
  }

  /** 分页列表行 / OrderPageResponse */
  export interface OrderPageResponse {
    id: number;
    orderNo: string;
    userId: number;
    receiverName: string;
    receiverPhone: string;
    receiverAddress: string;
    totalAmount: number;
    status: OrderStatus;
    createdAt: string;
  }

  /** 订单明细项（详情/orderItems） */
  export interface OrderItemDto {
    skuId: number;
    quantity: number;
    productName?: string;
    skuCode?: string;
    price?: number;
    amount?: number;
  }

  /** 订单详情 OrderResponse = OrderPageResponse + orderItems? */
  export interface OrderResponse extends OrderPageResponse {
    orderItems?: OrderItemDto[];
  }

  /** 保存订单明细（仅 skuId、quantity） */
  export interface SaveOrderItemRequest {
    skuId: number;
    quantity: number;
  }

  /** 保存订单请求 SaveOrderRequest */
  export interface SaveOrderRequest {
    orderNo?: string;
    userId: number;
    receiverName: string;
    receiverPhone: string;
    receiverAddress: string;
    status?: OrderStatus;
    orderItems: SaveOrderItemRequest[];
  }

  /** 更新订单请求 UpdateOrderRequest */
  export interface UpdateOrderRequest {
    id: number;
    userId: number;
    orderNo?: string;
    totalAmount?: number;
    status?: OrderStatus;
  }
}

/**
 * 获取订单分页列表
 */
export async function getOrderListApi(params: OrderApi.PageOrderParams) {
  return requestClient.get<PageResult<OrderApi.OrderPageResponse>>('/order', {
    params,
  });
}

/**
 * 获取订单详情
 */
export async function getOrderDetailApi(id: number | string) {
  return requestClient.get<OrderApi.OrderResponse>(`/order/${id}`);
}

/**
 * 保存订单（新增）
 */
export async function saveOrderApi(body: OrderApi.SaveOrderRequest) {
  return requestClient.post('/order', body);
}

/**
 * 更新订单
 */
export async function updateOrderApi(body: OrderApi.UpdateOrderRequest) {
  return requestClient.put('/order', body);
}

/**
 * 删除订单
 */
export async function deleteOrderApi(id: number) {
  return requestClient.delete(`/order/${id}`);
}
