<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { SpecValueApi } from '#/api/core/spec-value';

import { ref } from 'vue';

import { AccessControl } from '@vben/access';
import { Page, useVbenDrawer } from '@vben/common-ui';

import { ElButton, ElForm, ElFormItem, ElInput, ElMessage, ElMessageBox, ElOption, ElSelect, ElUpload } from 'element-plus';
import type { UploadFiles } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createSpecValueApi,
  deleteSpecValueApi,
  getSpecListApi,
  getSpecValueApi,
  getSpecValueListApi,
  updateSpecValueApi,
} from '#/api';
import type { SpecApi } from '#/api/core/spec';
import { requestClient } from '#/api/request';
import { getFileUrl } from '#/composables/file';

interface RowType extends SpecValueApi.PaginatedSpecValue {}

/**
 * 获取规格列表选项（用于查询表单）
 */
async function getSpecOptions() {
  const result = await getSpecListApi({
    current: 1,
    size: 1000, // 获取足够多的数据
  });
  return result.records || [];
}

/**
 * 查询表单选项
 */
const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: false,
  schema: [
    {
      component: 'ApiSelect',
      componentProps: {
        api: getSpecOptions,
        labelField: 'name',
        valueField: 'id',
        placeholder: '请选择规格（支持搜索规格名）',
        filterable: true,
        clearable: true,
      },
      defaultValue: undefined,
      fieldName: 'specId',
      label: '规格',
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
    { field: 'id', title: 'ID', width: 80 },
    { field: 'specId', title: '规格ID', width: 100 },
    { field: 'specName', title: '规格名', minWidth: 150 },
    { field: 'value', title: '规格值', minWidth: 200 },
    { field: 'createdAt', title: '创建时间', width: 180 },
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
        const result = await getSpecValueListApi({
          current: page.currentPage,
          size: page.pageSize,
          specId: formValues.specId ? Number(formValues.specId) : undefined,
        });

        return result;
      },
    },
  },
};

const [Grid, GridApi] = useVbenVxeGrid({ formOptions, gridOptions });

// 表单数据
const formData = ref<SpecValueApi.CreateSpecValueParams & { id?: number }>({
  specId: undefined,
  value: '',
  previewImage: '',
});

const loading = ref(false);
const saving = ref(false);
const previewImageUploading = ref(false);
const previewImageFileList = ref<UploadFiles>([]);

// 规格列表相关
const specList = ref<SpecApi.PaginatedSpec[]>([]);
const specListLoading = ref(false);
const specSearchKeyword = ref('');

/**
 * 获取规格列表（支持通过名称搜索）
 */
async function fetchSpecList(keyword?: string) {
  specListLoading.value = true;
  try {
    const result = await getSpecListApi({
      current: 1,
      size: 100, // 获取足够多的数据
      name: keyword || undefined,
    });
    specList.value = result.records || [];
  }
  catch (err: any) {
    console.error('获取规格列表失败:', err);
    ElMessage.error(err.message || '获取规格列表失败');
    specList.value = [];
  }
  finally {
    specListLoading.value = false;
  }
}

/**
 * 规格搜索方法（远程搜索）
 */
function handleSpecSearch(keyword: string) {
  specSearchKeyword.value = keyword;
  fetchSpecList(keyword);
}

/**
 * 创建抽屉选项
 */
const [CreateDrawer, createdrawerApi] = useVbenDrawer({
  showCancelButton: false,
  showConfirmButton: false,
  onOpened: async () => {
    // 重置表单
    formData.value = {
      specId: undefined,
      value: '',
      previewImage: '',
    };
    previewImageFileList.value = [];
    saving.value = false;
    previewImageUploading.value = false;
    // 加载规格列表
    specSearchKeyword.value = '';
    await fetchSpecList();
  },
});

/**
 * 编辑抽屉选项
 */
const [UpdateDrawer, updatedrawerApi] = useVbenDrawer({
  showCancelButton: false,
  showConfirmButton: false,
  onOpened: async () => {
    const row = updatedrawerApi.getData();
    if (!row?.id) {
      return;
    }
    loading.value = true;
    try {
      const specValue = await getSpecValueApi(row.id);
      
      formData.value = {
        id: specValue.id,
        specId: specValue.specId,
        value: specValue.value,
        previewImage: specValue.previewImage || '',
      };

      // 设置预览图文件列表（如果有预览图）
      if (specValue.previewImage) {
        previewImageFileList.value = [{
          name: 'preview-image',
          url: getFileUrl(specValue.previewImage),
          status: 'success',
          uid: Date.now(),
        }];
      } else {
        previewImageFileList.value = [];
      }

      // 加载规格列表（确保当前选中的规格在列表中）
      specSearchKeyword.value = '';
      await fetchSpecList();
    }
    catch (err: any) {
      console.error('获取规格值详情失败:', err);
      ElMessage.error(err.message || '获取规格值详情失败');
    }
    finally {
      loading.value = false;
    }
  },
});

/**
 * 创建规格值
 */
function onCreateSpecValue() {
  createdrawerApi.open();
}

/**
 * 编辑规格值
 */
function onEditSpecValue(row: RowType) {
  updatedrawerApi.setData(row);
  updatedrawerApi.open();
}

/**
 * 保存规格值
 */
async function handleSubmit() {
  if (!formData.value.specId || formData.value.specId <= 0) {
    ElMessage.warning('请输入规格ID');
    return;
  }

  if (!formData.value.value?.trim()) {
    ElMessage.warning('请输入规格值');
    return;
  }

  saving.value = true;
  try {
    if (formData.value.id) {
      await updateSpecValueApi({ 
        ...formData.value, 
        id: formData.value.id,
      } as SpecValueApi.UpdateSpecValueParams);
      ElMessage.success('更新规格值成功');
      updatedrawerApi.close();
    }
    else {
      await createSpecValueApi(formData.value);
      ElMessage.success('创建规格值成功');
      createdrawerApi.close();
    }

    await GridApi.reload();
  }
  catch (err: any) {
    console.error('保存规格值失败:', err);
    ElMessage.error(err.message || '保存规格值失败');
  }
  finally {
    saving.value = false;
  }
}

/**
 * 删除规格值
 */
async function onDeleteSpecValue(row: RowType) {
  ElMessageBox.confirm(
    `删除后数据不可恢复，确认删除规格值【${row.value}】吗？`,
    '警告',
    {
      type: 'warning',
    },
  ).then(async () => {
    await deleteSpecValueApi(row.id);
    await GridApi.reload();
  });
}

// 预览图上传前的验证
function beforePreviewImageUpload(file: File) {
  // 检查是否为图片文件
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请上传图片文件');
    return false;
  }
  return true;
}

// 预览图上传处理（自定义上传）
async function handlePreviewImageUpload(options: any) {
  const { file } = options;
  
  previewImageUploading.value = true;
  
  try {
    // 上传图片
    const response = await requestClient.upload<{ path: string }>('/file/upload', { file });
    
    // 获取返回的path
    const path = response?.path || (response as any)?.data?.path;
    if (!path) {
      ElMessage.error('上传失败，未返回文件路径');
      return;
    }

    const imageUrl = getFileUrl(path);

    // 设置预览图路径（保存相对路径）
    formData.value.previewImage = path;

    // 更新文件列表用于预览
    const fileItem = {
      name: file.name,
      url: imageUrl,
      status: 'success' as const,
      uid: Date.now(),
    };
    previewImageFileList.value = [fileItem];
    
    ElMessage.success('预览图上传成功');
  }
  catch (err: any) {
    console.error('预览图上传失败:', err);
    ElMessage.error(err.message || '预览图上传失败');
    previewImageFileList.value = [];
  }
  finally {
    previewImageUploading.value = false;
  }
}

// 移除预览图
function handlePreviewImageRemove() {
  formData.value.previewImage = '';
  previewImageFileList.value = [];
  return true;
}
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-tools>
        <AccessControl :codes="['superadmin']">
          <ElButton class="mr-2" type="primary" @click="onCreateSpecValue">
            添加规格值
          </ElButton>
        </AccessControl>
      </template>
      <template #action="{ row }">
        <AccessControl :codes="['superadmin']">
          <ElButton type="primary" @click="onEditSpecValue(row)">编辑</ElButton>
        </AccessControl>
        <AccessControl :codes="['superadmin']">
          <ElButton type="danger" @click="onDeleteSpecValue(row)">删除</ElButton>
        </AccessControl>
      </template>
    </Grid>
    
    <CreateDrawer :title="'添加规格值'">
      <div v-loading="loading" class="spec-value-form-container">
        <ElForm :model="formData" label-width="100px">
          <ElFormItem label="规格" required>
            <ElSelect
              v-model="formData.specId"
              placeholder="请选择规格（支持搜索规格名）"
              filterable
              remote
              :remote-method="handleSpecSearch"
              :loading="specListLoading"
              clearable
              style="width: 100%"
            >
              <ElOption
                v-for="spec in specList"
                :key="spec.id"
                :label="spec.name"
                :value="spec.id"
              />
            </ElSelect>
          </ElFormItem>

          <ElFormItem label="规格值" required>
            <ElInput
              v-model="formData.value"
              placeholder="请输入规格值"
              maxlength="50"
              show-word-limit
            />
          </ElFormItem>

          <ElFormItem label="预览图">
            <ElUpload
              :file-list="previewImageFileList"
              :limit="1"
              :before-upload="beforePreviewImageUpload"
              :http-request="handlePreviewImageUpload"
              :on-remove="handlePreviewImageRemove"
              accept="image/*"
              list-type="picture-card"
            >
              <template v-if="previewImageFileList.length === 0">
                <div class="upload-button">
                  <span v-if="!previewImageUploading">+</span>
                  <span v-else>上传中...</span>
                </div>
              </template>
            </ElUpload>
          </ElFormItem>

          <ElFormItem>
            <ElButton @click="createdrawerApi.close">取消</ElButton>
            <ElButton type="primary" :loading="saving" @click="handleSubmit">
              保存
            </ElButton>
          </ElFormItem>
        </ElForm>
      </div>
    </CreateDrawer>

    <UpdateDrawer :title="'编辑规格值'">
      <div v-loading="loading" class="spec-value-form-container">
        <ElForm :model="formData" label-width="100px">
          <ElFormItem label="规格" required>
            <ElSelect
              v-model="formData.specId"
              placeholder="请选择规格（支持搜索规格名）"
              filterable
              remote
              :remote-method="handleSpecSearch"
              :loading="specListLoading"
              clearable
              style="width: 100%"
            >
              <ElOption
                v-for="spec in specList"
                :key="spec.id"
                :label="spec.name"
                :value="spec.id"
              />
            </ElSelect>
          </ElFormItem>

          <ElFormItem label="规格值" required>
            <ElInput
              v-model="formData.value"
              placeholder="请输入规格值"
              maxlength="50"
              show-word-limit
            />
          </ElFormItem>

          <ElFormItem label="预览图">
            <ElUpload
              :file-list="previewImageFileList"
              :limit="1"
              :before-upload="beforePreviewImageUpload"
              :http-request="handlePreviewImageUpload"
              :on-remove="handlePreviewImageRemove"
              accept="image/*"
              list-type="picture-card"
            >
              <template v-if="previewImageFileList.length === 0">
                <div class="upload-button">
                  <span v-if="!previewImageUploading">+</span>
                  <span v-else>上传中...</span>
                </div>
              </template>
            </ElUpload>
          </ElFormItem>

          <ElFormItem>
            <ElButton @click="updatedrawerApi.close">取消</ElButton>
            <ElButton type="primary" :loading="saving" @click="handleSubmit">
              保存
            </ElButton>
          </ElFormItem>
        </ElForm>
      </div>
    </UpdateDrawer>
  </Page>
</template>

<style scoped>
.spec-value-form-container {
  padding: 20px 0;
}

.upload-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 28px;
  color: #8c939d;
  cursor: pointer;
}

:deep(.el-upload--picture-card) {
  width: 148px;
  height: 148px;
}

:deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 148px;
  height: 148px;
}
</style>
