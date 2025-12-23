import type { PageResult } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace ClientApi {
  /** 客户状态类型 */
  export type ClientStatus = string;

  /** 分页查询客户接口参数 */
  export interface PageClientParams {
    current: number;
    size: number;
    realName?: string;
  }

  /**
   * 分页查询客户信息
   */
  export interface PaginatedClient {
    /**
     * id，客户id
     */
    id: number;
    /**
     * 头像
     */
    avatar: string;
    /**
     * 真实姓名
     */
    realName: string;
    /**
     * 手机号
     */
    mobile: string;
    /**
     * 状态
     */
    status: ClientStatus;
    /**
     * 描述
     */
    description: string;
    /**
     * 创建时间
     */
    createAt: string;
  }
}

/**
 * 获取客户列表
 */
export async function getClientListApi(params: ClientApi.PageClientParams) {
  return requestClient.get<PageResult<ClientApi.PaginatedClient>>('/client', {
    params,
  });
}

