import type { BasicUserInfo } from '@vben-core/typings';

/** 用户信息 */
interface UserInfo extends BasicUserInfo {
  /**
   * 用户id
   */
  id: number;
  /**
   * 用户名称
   */
  realName: string;
  /**
   * 用户手机号
   */
  mobile: string;
  /**
   * 用户描述
   */
  description: string;
  /**
   * 用户角色
   */
  roleIds: number[];
  /**
   * 首页地址
   */
  homePath: string;
  /**
   * 用户状态
   */
  status: string;
  /**
   * accessToken
   */
  token: string;
}

export type { UserInfo };
