import { requestClient } from '#/api/request';

export namespace BannerApi {
  /**
   * 轮播项
   */
  export interface BannerItem {
    /**
     * 图片URL
     */
    imageUrl: string;
    /**
     * 点击链接跳转地址
     */
    linkUrl: string;
  }

  /**
   * 轮播图响应
   */
  export interface BannerResponse {
    /**
     * id
     */
    id: string;
    /**
     * 轮播项列表
     */
    items: BannerItem[];
    /**
     * 创建时间
     */
    createAt: string;
    /**
     * 更新时间
     */
    updateAt: string;
  }

  /**
   * 保存轮播图请求
   */
  export interface SaveBannerRequest {
    /**
     * 轮播图项列表
     */
    items: BannerItem[];
  }
}

/**
 * 获取轮播图
 */
export async function getBannerApi() {
  return requestClient.get<BannerApi.BannerResponse>('/banner');
}

/**
 * 保存轮播图
 */
export async function saveBannerApi(request: BannerApi.SaveBannerRequest) {
  return requestClient.post('/banner', request);
}
