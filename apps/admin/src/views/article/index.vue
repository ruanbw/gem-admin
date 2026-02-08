<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { ArticleApi } from '#/api/core/article';

import { useRouter } from 'vue-router';

import { AccessControl } from '@vben/access';
import { Page } from '@vben/common-ui';

import { ElButton, ElMessageBox, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteArticleApi,
  getArticleListApi,
} from '#/api';
import { getFileUrl } from '#/composables/file';

interface RowType extends ArticleApi.PaginatedArticle {}

const router = useRouter();

/**
 * 查询表单选项
 */
const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: false,
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入标题',
        clearable: true,
      },
      defaultValue: '',
      fieldName: 'title',
      label: '标题',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入作者',
        clearable: true,
      },
      defaultValue: '',
      fieldName: 'author',
      label: '作者',
    },
    {
      component: 'Select',
      componentProps: {
        placeholder: '请选择状态',
        clearable: true,
        options: [
          { label: '草稿', value: 'DRAFT' },
          { label: '已发布', value: 'PUBLISHED' },
        ],
      },
      defaultValue: '',
      fieldName: 'status',
      label: '状态',
    },
  ],
  // 控制表单是否显示折叠按钮
  showCollapseButton: true,
  submitButtonOptions: {
    content: '查询',
  },
  // 是否在字段值改变时提交表单
  submitOnChange: false,
  // 按下回车时是否提交表单
  submitOnEnter: false,
};

/**
 * 表格选项
 */
const gridOptions: VxeGridProps<RowType> = {
  checkboxConfig: {
    highlight: true,
    labelField: 'id',
  },
  columns: [
    { field: 'previewImage', title: '预览图', cellRender: { name: 'CellImage' }, width: 120 },
    { field: 'title', title: '标题', minWidth: 200 },
    { field: 'author', title: '作者', width: 120 },
    {
      field: 'status',
      title: '状态',
      width: 100,
      slots: { default: 'status' },
    },
    { field: 'createAt', title: '创建时间', width: 180 },
    { field: 'action', title: '操作', width: 150, slots: { default: 'action' }, fixed: 'right' },
  ],
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    response: {
      result: 'records',
    },
    ajax: {
      query: async ({ page }, formValues) => {
        const result = await getArticleListApi({
          current: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });

        // 处理预览图URL
        result.records.forEach((item: ArticleApi.PaginatedArticle) => {
          if (item.previewImage) {
            item.previewImage = getFileUrl(item.previewImage);
          }
        });

        return result;
      },
    },
  },
};

const [Grid, GridApi] = useVbenVxeGrid({ formOptions, gridOptions });

/**
 * 创建文章
 */
function onCreateArticle() {
  router.push('/article/edit');
}

/**
 * 编辑文章
 */
function onEditArticle(row: RowType) {
  router.push(`/article/edit?id=${row.id}`);
}

/**
 * 删除文章
 */
async function onDeleteArticle(row: RowType) {
  ElMessageBox.confirm(
    `删除后数据不可恢复，确认删除【${row.title}】的文章吗？`,
    '警告',
    {
      type: 'warning',
    },
  ).then(async () => {
    await deleteArticleApi(row.id);
    await GridApi.reload();
  });
}
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-tools>
        <AccessControl :codes="['superadmin']">
          <ElButton class="mr-2" type="primary" @click="onCreateArticle">
            添加文章
          </ElButton>
        </AccessControl>
      </template>
      <template #status="{ row }">
        <ElTag :type="row.status === 'PUBLISHED' ? 'success' : 'info'">
          {{ row.status === 'PUBLISHED' ? '已发布' : '草稿' }}
        </ElTag>
      </template>
      <template #action="{ row }">
        <AccessControl :codes="['superadmin']">
          <ElButton type="primary" @click="onEditArticle(row)">编辑</ElButton>
        </AccessControl>
        <AccessControl :codes="['superadmin']">
          <ElButton type="danger" @click="onDeleteArticle(row)">删除</ElButton>
        </AccessControl>
      </template>
    </Grid>
  </Page>
</template>

