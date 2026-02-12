import type { RouteRecordStringComponent, UserInfo } from '@vben/types';

import type { PageResult } from './types';

import { requestClient } from '#/api/request';

export const USER_STATUS = {
  normal: '正常',
  frozen: '冻结',
  deleted: '已删除',
};

export const USER_STATUS_OPTIONS = Object.entries(USER_STATUS).map(([value, label]) => ({
  value,
  label,
}));

export const USER_STATUS_TAG_TYPE = {
  normal: 'success',
  frozen: 'danger',
  deleted: 'info',
};

export namespace UserApi {
  /** 创建用户接口参数 */
  export interface CreateUserParams {
    username: string;
    password: string;
    realName: string;
    roleIds: number[];
    mobile: string;
    status: number;
    avatar: string;
    description: string;
  }

  /** 更新用户接口参数 */
  export interface UpdateUserParams {
    id: number;
    password: string;
    roleIds: number[];
    mobile: string;
    status: number;
    avatar: string;
    description: string;
  }

  /** 分页查询用户接口参数 */
  export interface PageUserParams {
    current: number;
    size: number;
  }

  /**
   * 分页查询用户信息
   */
  export interface PaginatedUser {
    /**
     * 头像链接
     */
    avatar: string;
    /**
     * 描述
     */
    description: string;
    /**
     * id，用户id
     */
    id: number;
    /**
     * 手机号
     */
    mobile: string;
    /**
     * 昵称
     */
    realName: string;
    /**
     * 状态 0正常 1冻结 2删除
     */
    status: keyof typeof USER_STATUS;
    /**
     * 用户邮箱
     */
    email: string;
  }

  export interface AccessResult {
    codes: string[];
    routes: RouteRecordStringComponent[];
  }
}

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  return requestClient.get<UserInfo>('/user/info');
}

/** 获取当前登录用户的权限码与动态路由 */
export async function getAccessApi() {
  return requestClient.get<UserApi.AccessResult>('/user/access');
}

/**
 * 获取用户列表
 */
export async function getUserListApi(params: UserApi.PageUserParams) {
  return requestClient.get<PageResult<UserApi.PaginatedUser>>('/user', {
    params,
  });
}

/**
 * 创建用户
 */
export async function createUserApi(user: UserApi.CreateUserParams) {
  return requestClient.post('/user', user);
}

/**
 * 更新用户
 */
export async function updateUserApi(user: UserApi.UpdateUserParams) {
  return requestClient.put('/user', user);
}

/**
 * 删除用户
 */
export async function deleteUserApi(userId: number) {
  return requestClient.delete(`/user/${userId}`);
}

/**
 * 获取用户信息
 */
export async function getUserApi(userId: number) {
  return requestClient.get<UserInfo>(`/user/${userId}`);
}
