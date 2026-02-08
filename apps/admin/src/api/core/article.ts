import type { PageResult } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace ArticleApi {
  /** 文章状态类型 */
  export type ArticleStatus = 'DRAFT' | 'PUBLISHED';

  /** 分页查询文章接口参数 */
  export interface PageArticleParams {
    current: number;
    size: number;
    author?: string;
    title?: string;
    status?: ArticleStatus;
  }

  /**
   * 分页查询文章信息（列表）
   */
  export interface PaginatedArticle {
    /**
     * id，文章id
     */
    id: string;
    /**
     * 标题
     */
    title: string;
    /**
     * 作者
     */
    author: string;
    /**
     * 预览图
     */
    previewImage: string;
    /**
     * 内容摘要（200字符）
     */
    contentSummary: string;
    /**
     * 状态 DRAFT草稿、PUBLISHED发布
     */
    status: ArticleStatus;
    /**
     * 创建时间
     */
    createAt: string;
  }

  /**
   * 文章详情
   */
  export interface Article {
    /**
     * id，文章id
     */
    id: string;
    /**
     * 标题
     */
    title: string;
    /**
     * 作者
     */
    author: string;
    /**
     * 预览图
     */
    previewImage: string;
    /**
     * 内容（富文本HTML）
     */
    content: string;
    /**
     * 状态 DRAFT草稿、PUBLISHED发布
     */
    status: ArticleStatus;
    /**
     * 创建时间
     */
    createAt: string;
  }

  /** 创建文章接口参数 */
  export interface CreateArticleParams {
    title: string;
    author: string;
    previewImage: string;
    content: string;
    status: ArticleStatus;
    createAt: string;
  }

  /** 更新文章接口参数 */
  export interface UpdateArticleParams {
    id?: string;
    title: string;
    author: string;
    previewImage: string;
    content: string;
    status: ArticleStatus;
    createAt: string;
  }
}

/**
 * 后端返回的文章分页响应格式
 */
interface ArticlePageResponse {
  content: ArticleApi.PaginatedArticle[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

/**
 * 获取文章列表
 */
export async function getArticleListApi(params: ArticleApi.PageArticleParams) {
  const response = await requestClient.get<ArticlePageResponse>('/article', {
    params,
  });
  // 转换为PageResult格式
  return {
    records: response.content || [],
    total: response.totalElements || 0,
    current: response.number || 0,
    size: response.size || 10,
    pages: response.totalPages || 0,
  } as PageResult<ArticleApi.PaginatedArticle>;
}

/**
 * 获取文章详情
 */
export async function getArticleApi(articleId: string) {
  return requestClient.get<ArticleApi.Article>(`/article/${articleId}`);
}

/**
 * 创建文章
 */
export async function createArticleApi(article: ArticleApi.CreateArticleParams) {
  return requestClient.post('/article', article);
}

/**
 * 更新文章
 */
export async function updateArticleApi(article: ArticleApi.UpdateArticleParams) {
  return requestClient.put('/article', article);
}

/**
 * 删除文章
 */
export async function deleteArticleApi(articleId: string) {
  return requestClient.delete(`/article/${articleId}`);
}

