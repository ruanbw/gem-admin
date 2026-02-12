/**
 * 通用分页响应类型
 */
export interface PageResult<T> {
  current: number;
  size: number;
  total: number;
  records: T[];
}
