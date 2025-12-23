<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { PermissionApi } from '#/api/core/permission';

import { nextTick } from 'vue';

import { AccessControl } from '@vben/access';
import { Page, useVbenDrawer } from '@vben/common-ui';

import { ElButton, ElMessageBox } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createPermissionApi,
  deletePermissionApi,
  getPermissionApi,
  getPermissionTreeApi,
  updatePermissionApi,
} from '#/api';

import {
  normalizePermissionPayload,
  TYPE_API,
  TYPE_BUTTON,
  TYPE_LINK,
  TYPE_MENU,
} from './deps';

interface RowType extends PermissionApi.Permission {}

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入名称',
        clearable: true,
      },
      defaultValue: '',
      fieldName: 'name',
      label: '名称',
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: '菜单', value: 0 },
          { label: '按钮', value: 1 },
          { label: '接口', value: 2 },
          { label: '外链', value: 3 },
        ],
        placeholder: '请选择类型',
        clearable: true,
      },
      defaultValue: undefined,
      fieldName: 'type',
      label: '类型',
    },
  ],
  showCollapseButton: true,
  submitButtonOptions: {
    content: '查询',
  },
  submitOnChange: false,
  submitOnEnter: false,
};

const gridOptions: VxeGridProps<RowType> = {
  columns: [
    { field: 'name', title: '名称', treeNode: true, width: 200 },
    {
      field: 'icon',
      title: '图标',
      width: 80,
      cellRender: { name: 'CellIcon' },
    },
    {
      field: 'type',
      title: '类型',
      width: 120,
      cellRender: { name: 'CellTypeTag' },
    },
    { field: 'title', title: '标题', width: 200 },
    { field: 'path', title: '路由路径', width: 200 },
    { field: 'component', title: '组件', width: 200 },
    { field: 'code', title: '权限编码', width: 200 },
    { field: 'order', title: '排序', width: 200 },
    {
      field: 'action',
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'action' },
    },
  ],
  keepSource: true,
  proxyConfig: {
    ajax: {
      query: async (_params, formValues) => {
        const list = await getPermissionTreeApi();
        const filterByName = (node: RowType) =>
          !formValues?.name || node.name?.includes(formValues.name);
        const filterByType = (node: RowType) =>
          formValues?.type === undefined || node.type === formValues.type;

        const filterTree = (nodes: RowType[]): RowType[] => {
          return (nodes || [])
            .map((n) => ({
              ...n,
              children: n.children ? filterTree(n.children) : [],
            }))
            .filter((n) => filterByName(n) && filterByType(n));
        };

        const items = filterTree(list as RowType[]);
        return { items, total: items.length } as any;
      },
    },
  },
  treeConfig: {
    childrenField: 'children',
  },
  rowConfig: {
    keyField: 'id',
  },
};

const [Grid, GridApi] = useVbenVxeGrid({ formOptions, gridOptions });

const baseSchema: VbenFormSchema[] = [
  {
    component: 'TreeSelect',
    componentProps: {
      data: [],
      multiple: false,
      showCheckbox: true,
      checkStrictly: true,
      placeholder: '请选择上级菜单',
    },
    fieldName: 'parentId',
    label: '上级菜单',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '请输入' },
    fieldName: 'name',
    label: '路由名称',
    rules: 'required',
  },
  {
    component: 'Select',
    componentProps: {
      options: [
        { label: '菜单', value: 0 },
        { label: '按钮', value: 1 },
        { label: '接口', value: 2 },
        { label: '外链', value: 3 },
      ],
      placeholder: '请选择权限类型',
    },
    fieldName: 'type',
    label: '类型',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '请输入' },
    fieldName: 'title',
    label: '菜单标题',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '请输入' },
    fieldName: 'path',
    label: '访问路径',
    dependencies: {
      show: (values) => [TYPE_LINK, TYPE_MENU].includes(values.type),
      triggerFields: ['type'],
    },
  },
  {
    component: 'Input',
    componentProps: { placeholder: '请输入组件路径' },
    fieldName: 'component',
    label: '组件路径',
    dependencies: {
      show: (values) => [TYPE_MENU].includes(values.type),
      triggerFields: ['type'],
    },
  },
  {
    component: 'Input',
    componentProps: { placeholder: '请输入' },
    fieldName: 'activeIcon',
    label: '激活图标',
    dependencies: {
      show: (values) => [TYPE_LINK, TYPE_MENU].includes(values.type),
      triggerFields: ['type'],
    },
  },
  {
    component: 'Input',
    componentProps: { placeholder: '请输入' },
    fieldName: 'code',
    label: '权限编码',
    dependencies: {
      show: (values) => [TYPE_API, TYPE_BUTTON].includes(values.type),
      triggerFields: ['type'],
    },
  },
  {
    component: 'InputNumber',
    componentProps: { placeholder: '请输入' },
    fieldName: 'order',
    label: '排序',
    dependencies: {
      show: (values) => [TYPE_LINK, TYPE_MENU].includes(values.type),
      triggerFields: ['type'],
    },
  },
  {
    component: 'Input',
    componentProps: { placeholder: '请输入' },
    fieldName: 'icon',
    label: '图标',
    dependencies: {
      show: (values) => [TYPE_LINK, TYPE_MENU].includes(values.type),
      triggerFields: ['type'],
    },
  },

  {
    component: 'Switch',
    componentProps: {},
    fieldName: 'keepAlive',
    label: '开启缓存',
    dependencies: {
      show: (values) => [TYPE_MENU].includes(values.type),
      triggerFields: ['type'],
    },
  },
  {
    component: 'Switch',
    componentProps: {},
    fieldName: 'hideInMenu',
    label: '菜单中隐藏',
    dependencies: {
      show: (values) => [TYPE_MENU].includes(values.type),
      triggerFields: ['type'],
    },
  },
  {
    component: 'Switch',
    componentProps: {},
    fieldName: 'hideInTab',
    label: '标签页中隐藏',
    dependencies: {
      show: (values) => [TYPE_MENU].includes(values.type),
      triggerFields: ['type'],
    },
  },
  {
    component: 'Switch',
    componentProps: {},
    fieldName: 'hideInBreadcrumb',
    label: '面包屑中隐藏',
    dependencies: {
      show: (values) => [TYPE_MENU].includes(values.type),
      triggerFields: ['type'],
    },
  },
  {
    component: 'Switch',
    componentProps: {},
    fieldName: 'hideChildrenInMenu',
    label: '隐藏子菜单',
    dependencies: {
      show: (values) => [TYPE_MENU].includes(values.type),
      triggerFields: ['type'],
    },
  },
  {
    component: 'Select',
    componentProps: {
      multiple: true,
      allowCreate: true,
      collapseTags: true,
      options: [],
      placeholder: '输入并确认添加权限标识',
    },
    fieldName: 'authority',
    label: '权限标识',
    dependencies: {
      show: (values) =>
        [TYPE_API, TYPE_BUTTON, TYPE_MENU].includes(values.type),
      triggerFields: ['type'],
    },
  },
  {
    component: 'Input',
    componentProps: { placeholder: '请输入' },
    fieldName: 'badge',
    label: '徽标',
    dependencies: {
      show: (values) => [TYPE_MENU].includes(values.type),
      triggerFields: ['type'],
    },
  },
  {
    component: 'Select',
    componentProps: {
      options: [
        { label: 'normal', value: 'normal' },
        { label: 'dot', value: 'dot' },
      ],
      placeholder: '请选择',
    },
    fieldName: 'badgeType',
    label: '徽标类型',
    dependencies: {
      show: (values) => [TYPE_MENU].includes(values.type),
      triggerFields: ['type'],
    },
  },
  {
    component: 'Select',
    componentProps: {
      multiple: false,
      options: [
        { label: 'default', value: 'default' },
        { label: 'destructive', value: 'destructive' },
        { label: 'primary', value: 'primary' },
        { label: 'success', value: 'success' },
        { label: 'warning', value: 'warning' },
      ],
      placeholder: '请选择',
    },
    fieldName: 'badgeVariants',
    label: '徽标颜色',
    dependencies: {
      show: (values) => [TYPE_MENU].includes(values.type),
      triggerFields: ['type'],
    },
  },
  {
    component: 'Switch',
    componentProps: {},
    fieldName: 'fullPathKey',
    label: '使用完整路径作为Tab Key',
    dependencies: {
      show: (values) => [TYPE_MENU].includes(values.type),
      triggerFields: ['type'],
    },
  },
  {
    component: 'Input',
    componentProps: { placeholder: '请输入' },
    fieldName: 'activePath',
    label: '激活菜单路径',
    dependencies: {
      show: (values) => [TYPE_MENU].includes(values.type),
      triggerFields: ['type'],
    },
  },
  {
    component: 'Switch',
    componentProps: {},
    fieldName: 'affixTab',
    label: '固定标签页',
    dependencies: {
      show: (values) => [TYPE_MENU].includes(values.type),
      triggerFields: ['type'],
    },
  },
  {
    component: 'InputNumber',
    componentProps: { placeholder: '请输入' },
    fieldName: 'affixTabOrder',
    label: '固定标签排序',
    dependencies: {
      show: (values) => [TYPE_MENU].includes(values.type),
      triggerFields: ['type'],
    },
  },
  {
    component: 'Input',
    componentProps: { placeholder: '请输入' },
    fieldName: 'iframeSrc',
    label: 'iframe地址',
    dependencies: {
      show: (values) => [TYPE_LINK].includes(values.type),
      triggerFields: ['type'],
    },
  },
  {
    component: 'Switch',
    componentProps: {},
    fieldName: 'ignoreAccess',
    label: '忽略权限访问',
    dependencies: {
      show: (values) => [TYPE_MENU].includes(values.type),
      triggerFields: ['type'],
    },
  },
  {
    component: 'Input',
    componentProps: { placeholder: '请输入' },
    fieldName: 'link',
    label: '外链地址',
    dependencies: {
      show: (values) => [TYPE_LINK].includes(values.type),
      triggerFields: ['type'],
    },
  },
  {
    component: 'InputNumber',
    componentProps: { placeholder: '请输入' },
    fieldName: 'maxNumOfOpenTab',
    label: '同名Tab最大数量',
    dependencies: {
      show: (values) => [TYPE_MENU].includes(values.type),
      triggerFields: ['type'],
    },
  },
  {
    component: 'Switch',
    componentProps: {},
    fieldName: 'menuVisibleWithForbidden',
    label: '菜单可见但禁止访问',
    dependencies: {
      show: (values) => [TYPE_MENU].includes(values.type),
      triggerFields: ['type'],
    },
  },
  {
    component: 'Switch',
    componentProps: {},
    fieldName: 'openInNewWindow',
    label: '新窗口打开',
    dependencies: {
      show: (values) => [TYPE_LINK].includes(values.type),
      triggerFields: ['type'],
    },
  },
  {
    component: 'Input',
    componentProps: { placeholder: '请输入', type: 'textarea' },
    fieldName: 'query',
    label: '菜单参数(JSON)',
    dependencies: {
      show: (values) => [TYPE_MENU].includes(values.type),
      triggerFields: ['type'],
    },
  },
  {
    component: 'Switch',
    componentProps: {},
    fieldName: 'noBasicLayout',
    label: '不使用基础布局',
    dependencies: {
      show: (values) => [TYPE_MENU].includes(values.type),
      triggerFields: ['type'],
    },
  },
];

async function resetForm(api: any) {
  if (typeof api?.resetForm === 'function') {
    await api.resetForm(undefined, { keepValues: false });
  }
  if (typeof api?.resetValidate === 'function') {
    await api.resetValidate();
  }
}

const [CreateForm, CreateFormApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  handleSubmit: onCreate,
  scrollToFirstError: true,
  layout: 'horizontal',
  schema: baseSchema,
  wrapperClass: 'grid-cols-1',
});

const [UpdateForm, UpdateFormApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  handleSubmit: onUpdate,
  scrollToFirstError: true,
  layout: 'horizontal',
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: '请输入', disabled: true },
      fieldName: 'id',
      label: '权限ID',
      rules: 'required',
    },
    ...baseSchema,
  ],
  wrapperClass: 'grid-cols-1',
});

const [CreateDrawer, createdrawerApi] = useVbenDrawer({
  showCancelButton: false,
  showConfirmButton: false,
  onOpened: async () => {
    await resetForm(CreateFormApi);
    const tree = (await getPermissionTreeApi()) as RowType[];
    const normalizeTree = (nodes: RowType[]): any[] =>
      (nodes || []).map((n) => ({
        value: n.id,
        label: n.title || n.name,
        children: n.children ? normalizeTree(n.children as RowType[]) : [],
      }));
    const options = normalizeTree(tree);
    await nextTick();
    CreateFormApi.updateSchema([
      {
        fieldName: 'parentId',
        componentProps: { data: options },
      },
    ]);
    CreateFormApi.setFieldValue('parentId', null);
  },
});

const [UpdateDrawer, updatedrawerApi] = useVbenDrawer({
  showCancelButton: false,
  showConfirmButton: false,
  onOpened: async () => {
    const row = updatedrawerApi.getData();
    await resetForm(UpdateFormApi);
    if (!row?.id) return;
    const res = await getPermissionApi(row.id);
    UpdateFormApi.setValues(res);
    const tree = (await getPermissionTreeApi()) as RowType[];
    const normalizeTree = (nodes: RowType[]): any[] =>
      (nodes || []).map((n) => ({
        value: n.id,
        label: n.title || n.name,
        children: n.children ? normalizeTree(n.children as RowType[]) : [],
      }));
    const options = normalizeTree(tree);
    await nextTick();
    UpdateFormApi.updateSchema([
      {
        fieldName: 'parentId',
        componentProps: { data: options },
      },
    ]);
    UpdateFormApi.setFieldValue(
      'parentId',
      res.parentId && res.parentId !== 0 ? res.parentId : null,
    );
  },
});

function handleEdit(row: RowType) {
  updatedrawerApi.setData(row);
  updatedrawerApi.open();
}

async function onCreate(values: Record<string, any>) {
  const payload = normalizePermissionPayload(values as RowType, false);
  await createPermissionApi(payload);
  createdrawerApi.close();
  await GridApi.reload();
}

async function onUpdate(values: Record<string, any>) {
  const payload = normalizePermissionPayload(values as RowType, true);
  await updatePermissionApi(payload);
  updatedrawerApi.close();
  await GridApi.reload();
}

async function handleDelete(row: RowType) {
  ElMessageBox.confirm(
    `删除后数据不可恢复，确认删除【${row.title || row.name}】的权限吗？`,
    '警告',
    { type: 'warning' },
  ).then(async () => {
    await deletePermissionApi(row.id!);
    await GridApi.reload();
  });
}
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-tools>
        <AccessControl :codes="['superadmin']">
          <ElButton class="mr-2" type="primary" @click="createdrawerApi.open">
            新增权限
          </ElButton>
        </AccessControl>
      </template>
      <template #action="{ row }">
        <AccessControl :codes="['superadmin']">
          <ElButton type="primary" @click="handleEdit(row)">编辑</ElButton>
        </AccessControl>
        <AccessControl :codes="['superadmin']">
          <ElButton type="danger" @click="handleDelete(row)">删除</ElButton>
        </AccessControl>
      </template>
    </Grid>
    <CreateDrawer title="创建权限">
      <CreateForm />
    </CreateDrawer>
    <UpdateDrawer title="编辑权限">
      <UpdateForm />
    </UpdateDrawer>
  </Page>
</template>
