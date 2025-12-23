import { requestClient } from '#/api/request';

export namespace AppletApi {
  /** 回收流程项 */
  export interface RecyclingProcess {
    title: string;
    desc: string;
  }

  /** 通知项 */
  export interface Notification {
    content: string;
    url: string;
  }

  /** 常见问题项 */
  export interface FrequentlyAskedQuestion {
    question: string;
    answer: string;
  }

  /** 小程序配置响应 */
  export interface AppletConfigResponse {
    recyclingProcesss: RecyclingProcess[];
    notifications: Notification[];
    frequentlyAskedQuestions: FrequentlyAskedQuestion[];
  }

  /** 更新小程序配置请求参数 */
  export interface UpdateAppletConfigParams {
    recyclingProcesss: RecyclingProcess[];
    notifications: Notification[];
    frequentlyAskedQuestions: FrequentlyAskedQuestion[];
  }
}

/**
 * 获取小程序配置
 */
export async function getAppletConfigApi() {
  return requestClient.get<AppletApi.AppletConfigResponse>('/applet/config');
}

/**
 * 更新小程序配置
 */
export async function updateAppletConfigApi(
  params: AppletApi.UpdateAppletConfigParams,
) {
  return requestClient.put('/applet/config', params);
}

