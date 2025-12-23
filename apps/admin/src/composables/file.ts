import { useAppConfig } from '@vben/hooks';

const { fileURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

/**
 * 获取文件URL
 * @param key 文件key
 * @returns 完整的文件URL
 */
export function getFileUrl(key: string) {
  return `${fileURL}${key}`;
}
