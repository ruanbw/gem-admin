/**
 * 获取文件URL
 * @param key 文件key
 * @returns 完整的文件URL
 */
export function getFileUrl(key: string) {
  return `${import.meta.env.VITE_GLOB_FILE_URL}${key}`;
}
