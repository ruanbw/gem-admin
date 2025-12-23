/**
 * 权限表单依赖与规范化工具
 * - 定义权限类型常量（菜单/按钮/接口/外链）
 * - 定义字段显示/校验依赖常量，统一在表单 schema 中复用
 * - 提供提交前的 payload 规范化方法（父级ID、布尔字段、query 解析）
 */

/** 菜单类型 */
export const TYPE_MENU = 0;
/** 按钮类型 */
export const TYPE_BUTTON = 1;
/** 接口类型 */
export const TYPE_API = 2;
/** 外链类型（含 iframe） */
export const TYPE_LINK = 3;

/**
 * 需要在提交时转为 tinyint(0/1) 的布尔型 meta 字段列表
 */
export const BOOLEAN_META_FIELDS = [
  'affixTab',
  'keepAlive',
  'hideInMenu',
  'hideInTab',
  'hideInBreadcrumb',
  'hideChildrenInMenu',
  'fullPathKey',
  'ignoreAccess',
  'menuVisibleWithForbidden',
  'openInNewWindow',
  'noBasicLayout',
];

/**
 * 提交前的权限 payload 规范化
 * - 将 `id`（更新场景）与 `parentId` 转为数字（未选父级默认为 0）
 * - 布尔型字段转为 0/1（兼容后端 tinyint）
 * - 将字符串形式的 `query` 解析为 JSON 对象
 * @param values 原始表单值
 * @param isUpdate 是否编辑场景（编辑会规范化 id）
 * @returns 规范化后的提交对象
 */
export function normalizePermissionPayload(
  values: Record<string, any>,
  isUpdate: boolean = false,
) {
  const payload: Record<string, any> = { ...values };
  if (isUpdate && payload.id !== undefined) {
    payload.id = Number(payload.id);
  }
  payload.parentId = payload.parentId ? Number(payload.parentId) : 0;
  for (const key of BOOLEAN_META_FIELDS) {
    if (key in payload) {
      payload[key] = Number(!!payload[key]);
    }
  }
  if (typeof payload.query === 'string') {
    try {
      payload.query = JSON.parse(payload.query || '{}');
    } catch {
      payload.query = {};
    }
  }
  return payload;
}
