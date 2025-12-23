import type { PageResult } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace OrderApi {
  /** 订单类型 */
  export type OrderType = 'BUY' | 'SELL';

  /**
   * 订单状态类型
   * 购买订单状态: PENDING_PAYMENT(待付款), PAID(待收货), REFUND_AND_AFTER_SALES(退款/售后)
   * 卖出订单状态: AWAITING_STORAGE(待入库), PENDING_SHIPMENT(待出货), PENDING_SETTLEMENT(待结算), SETTLED(已结算), RETURNED(退货)
   * 公共状态: COMPLETED(已完成)
   */
  export type OrderStatus =
    | 'PENDING_PAYMENT'
    | 'PAID'
    | 'REFUND_AND_AFTER_SALES'
    | 'AWAITING_STORAGE'
    | 'PENDING_SHIPMENT'
    | 'PENDING_SETTLEMENT'
    | 'SETTLED'
    | 'RETURNED'
    | 'COMPLETED';

  /** 分页查询订单接口参数 */
  export interface PageOrderParams {
    current: number;
    size: number;
    openId?: string;
    orderNo?: string;
    status?: OrderStatus;
    type?: OrderType;
  }

  /**
   * 分页查询订单信息
   * 需要与后端 `/order` 接口返回字段保持一致
   */
  export interface PaginatedOrder {
    /**
     * 主键ID
     */
    id: number;
    /**
     * 订单号
     */
    orderNo: string;
    /**
     * 所属用户 openId
     */
    openId: string;
    /**
     * 收货地址ID
     */
    addressId: number;
    /**
     * 物流单号
     */
    trackingNumber: string;
    /**
     * 配置ID
     */
    configId: number;
    /**
     * 总价
     */
    totalPrice: number;
    /**
     * 订单类型: BUY(购买), SELL(卖出)
     */
    type: OrderType;
    /**
     * 订单状态
     */
    status: OrderStatus;
    /**
     * 创建时间
     */
    createdAt: string;
    /**
     * 备注
     */
    remark?: string;
  }

  /**
   * 收货地址
   * 需要与后端 ClientAddress 实体字段保持一致
   */
  export interface ClientAddress {
    /**
     * 主键ID
     */
    id: number;
    /**
     * 所属微信 open_id
     */
    openId: string;
    /**
     * 收货人姓名
     */
    receiverName: string;
    /**
     * 收货人手机号
     */
    mobile: string;
    /**
     * 所在省
     */
    province: string;
    /**
     * 所在市
     */
    city: string;
    /**
     * 所在区/县
     */
    district: string;
    /**
     * 详细地址（街道、门牌号等）
     */
    detailAddress: string;
    /**
     * 地址状态 normal（正常）, deleted（删除）
     */
    status: 'normal' | 'deleted';
    /**
     * 是否为默认收货地址
     */
    isDefault: boolean;
    /**
     * 创建时间
     */
    createAt: string;
  }

  /**
   * 订单配置快照
   * 需要与后端 OrderSnapshot 实体字段保持一致
   */
  export interface OrderSnapshot {
    /**
     * 主键ID
     */
    id: number;
    /**
     * 品牌名称
     */
    brand: string;
    /**
     * 型号名称
     */
    model: string;
    /**
     * 配置
     */
    config: string;
    /**
     * 创建时间
     */
    createAt: string;
  }

  /**
   * 后台订单详情
   * 在分页基础上增加收货地址与快照信息
   */
  export interface OrderDetail extends PaginatedOrder {
    clientAddress?: ClientAddress | null;
    orderSnapshot?: OrderSnapshot | null;
  }
}

/**
 * 获取订单列表
 */
export async function getOrderListApi(params: OrderApi.PageOrderParams) {
  return requestClient.get<PageResult<OrderApi.PaginatedOrder>>('/order', {
    params,
  });
}

/**
 * 获取订单详情（后台）
 */
export async function getOrderDetailApi(id: number | string) {
  return requestClient.get<OrderApi.OrderDetail>(`/order/${id}`);
}

/**
 * 更新订单物流单号
 * 对应后端接口: POST /order/{id}/tracking-number?trackingNumber=xxx
 */
export async function updateOrderTrackingNumberApi(id: number | string, trackingNumber: string) {
  return requestClient.post(`/order/${id}/tracking-number`, undefined, {
    params: {
      trackingNumber,
    },
  });
}

