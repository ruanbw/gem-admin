import { requestClient } from '#/api/request';

export namespace PermissionApi {
  export interface Permission {
    id?: number;
    parentId?: number;
    name?: string;
    type?: 0 | 1 | 2 | 3;
    code?: string;
    path?: string;
    component?: string;
    title?: string;
    order?: number;
    redirect?: string;
    icon?: string;
    affixTab?: boolean;
    affixTabOrder?: number;
    keepAlive?: boolean;
    hideInMenu?: boolean;
    hideInTab?: boolean;
    hideInBreadcrumb?: boolean;
    hideChildrenInMenu?: boolean;
    menuVisibleWithForbidden?: boolean;
    activeIcon?: string;
    activePath?: string;
    badge?: string;
    badgeType?: string;
    badgeVariants?: string[];
    iframeSrc?: string;
    link?: string;
    query?: Record<string, any>;
    authority?: string[];
    fullPathKey?: boolean;
    ignoreAccess?: boolean;
    maxNumOfOpenTab?: number;
    openInNewWindow?: boolean;
    noBasicLayout?: boolean;
    children?: Permission[];
  }
}

/** 获取权限树 */
export async function getPermissionTreeApi() {
  return requestClient.get<PermissionApi.Permission[]>('/permission');
}

/** 查询单条权限 */
export async function getPermissionApi(id: number) {
  return requestClient.get<PermissionApi.Permission>(`/permission/${id}`);
}

/** 新增权限 */
export async function createPermissionApi(data: PermissionApi.Permission) {
  return requestClient.post('/permission', data);
}

/** 更新权限 */
export async function updatePermissionApi(data: PermissionApi.Permission) {
  return requestClient.put('/permission', data);
}

/** 删除权限 */
export async function deletePermissionApi(id: number) {
  return requestClient.delete(`/permission/${id}`);
}
