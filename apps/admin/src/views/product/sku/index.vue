<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { ProductSkuApi } from '#/api/core/product-sku';

import { ref } from 'vue';

import { AccessControl } from '@vben/access';
import { Page, useVbenDrawer } from '@vben/common-ui';

import type { UploadFiles } from 'element-plus';

import { ElButton, ElForm, ElFormItem, ElInput, ElInputNumber, ElMessage, ElMessageBox, ElSelect, ElOption, ElTag, ElUpload } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createProductSkuApi,
  deleteProductSkuApi,
  getProductSkuApi,
  getProductSkuListApi,
  updateProductSkuApi,
  getSpecListApi,
  getSpecValueListApi,
} from '#/api';
import type { SpecApi } from '#/api/core/spec';
import type { SpecValueApi } from '#/api/core/spec-value';
import { requestClient } from '#/api/request';
import { getFileUrl } from '#/composables/file';

interface RowType extends ProductSkuApi.PaginatedProductSku {}

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
        placeholder: '请输入商品ID',
        clearable: true,
        type: 'number',
      },
      defaultValue: '',
      fieldName: 'productId',
      label: '商品ID',
    },
    {
      component: 'Select',
      componentProps: {
        placeholder: '请选择状态',
        clearable: true,
        options: [
          { label: '启用', value: 1 },
          { label: '禁用', value: 0 },
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
    { field: 'id', title: 'ID', width: 80 },
    { field: 'productId', title: '商品ID', width: 100 },
    { field: 'price', title: '销售价', width: 120, formatter: ({ cellValue }) => `¥${cellValue?.toFixed(2) || '0.00'}` },
    { field: 'stock', title: '库存', width: 100 },
    {
      field: 'specValue',
      title: '规格信息',
      minWidth: 200,
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      slots: { default: 'status' },
    },
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
        const result = await getProductSkuListApi({
          current: page.currentPage,
          size: page.pageSize,
          productId: formValues.productId ? Number(formValues.productId) : undefined,
          status: formValues.status !== undefined && formValues.status !== '' ? formValues.status : undefined,
        });

        return result;
      },
    },
  },
};

const [Grid, GridApi] = useVbenVxeGrid({ formOptions, gridOptions });

// 规格选择项接口
interface SpecSelection {
  specId: number | undefined;
  specValueId: number | undefined;
  key: string; // 用于v-for的key
}

// 表单数据
const formData = ref<ProductSkuApi.CreateProductSkuParams & { id?: number }>({
  productId: 0,
  price: 0,
  stock: 0,
  lockedStock: 0,
  specJson: {},
  status: 1,
  modelUrl: undefined,
  coverImage: '',
});

// 规格选择列表
const specSelections = ref<SpecSelection[]>([]);

// 规格列表
const specList = ref<SpecApi.PaginatedSpec[]>([]);
const specListLoading = ref(false);

// 规格值列表缓存（按specId索引）
const specValueMap = ref<Record<number, SpecValueApi.PaginatedSpecValue[]>>({});
const specValueLoadingMap = ref<Record<number, boolean>>({});

const loading = ref(false);
const saving = ref(false);

// 模型文件上传相关
const modelFileList = ref<UploadFiles>([]);
const modelUploading = ref(false);

// 封面图上传相关
const coverImageFileList = ref<UploadFiles>([]);
const coverImageUploading = ref(false);

/**
 * 获取规格列表
 */
async function fetchSpecList() {
  specListLoading.value = true;
  try {
    const result = await getSpecListApi({
      current: 1,
      size: 1000,
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
 * 获取指定规格的规格值列表
 */
async function fetchSpecValues(specId: number) {
  if (!specId) {
    return;
  }

  // 如果已经加载过，直接返回
  if (specValueMap.value[specId]) {
    return;
  }

  specValueLoadingMap.value[specId] = true;
  try {
    const result = await getSpecValueListApi({
      current: 1,
      size: 1000,
      specId,
    });
    specValueMap.value[specId] = result.records || [];
  }
  catch (err: any) {
    console.error('获取规格值列表失败:', err);
    ElMessage.error(err.message || '获取规格值列表失败');
    specValueMap.value[specId] = [];
  }
  finally {
    specValueLoadingMap.value[specId] = false;
  }
}

/**
 * 当选择规格时，加载对应的规格值
 */
async function handleSpecChange(selection: SpecSelection) {
  // 清空之前选择的规格值
  selection.specValueId = undefined;
  
  if (selection.specId) {
    await fetchSpecValues(selection.specId);
  }
}

/**
 * 添加规格选择项
 */
function addSpecSelection() {
  specSelections.value.push({
    specId: undefined,
    specValueId: undefined,
    key: `spec-${Date.now()}-${Math.random()}`,
  });
}

/**
 * 删除规格选择项
 */
function removeSpecSelection(index: number) {
  specSelections.value.splice(index, 1);
}

/**
 * 从specJson解析规格选择项（用于编辑时回填）
 * specJson格式为 {规格名称: 规格值文本}，例如 {颜色: "黑色", 型号: "256G"}
 */
function parseSpecJsonToSelections(specJson: Record<string, string>) {
  specSelections.value = [];
  
  if (!specJson || Object.keys(specJson).length === 0) {
    return;
  }

  // specJson格式为 {规格名称: 规格值文本}
  Object.entries(specJson).forEach(([specName, specValueText]) => {
    // 根据规格名称找到规格ID
    const spec = specList.value.find(s => s.name === specName);
    if (!spec) {
      console.warn(`未找到规格: ${specName}`);
      return;
    }

    // 根据规格值文本找到规格值ID（需要先加载该规格的规格值列表）
    const specValues = specValueMap.value[spec.id] || [];
    const specValue = specValues.find(sv => sv.value === specValueText);
    if (!specValue) {
      console.warn(`未找到规格值: ${specValueText} (规格: ${specName})`);
      return;
    }

    specSelections.value.push({
      specId: spec.id,
      specValueId: specValue.id,
      key: `spec-${Date.now()}-${Math.random()}`,
    });
  });
}

/**
 * 将规格选择项转换为specJson
 * 返回格式为 {规格名称: 规格值文本}，例如 {颜色: "黑色", 型号: "256G"}
 */
function convertSelectionsToSpecJson(): Record<string, string> {
  const specJson: Record<string, string> = {};
  
  specSelections.value.forEach((selection) => {
    if (selection.specId && selection.specValueId) {
      // 根据规格ID找到规格名称
      const spec = specList.value.find(s => s.id === selection.specId);
      if (!spec) {
        console.warn(`未找到规格ID: ${selection.specId}`);
        return;
      }

      // 根据规格值ID找到规格值文本
      const specValues = specValueMap.value[selection.specId] || [];
      const specValue = specValues.find(sv => sv.id === selection.specValueId);
      if (!specValue) {
        console.warn(`未找到规格值ID: ${selection.specValueId} (规格: ${spec.name})`);
        return;
      }

      // 使用规格名称作为key，规格值文本作为value
      specJson[spec.name] = specValue.value;
    }
  });
  
  return specJson;
}

/**
 * 模型文件上传前的验证
 */
function beforeModelUpload(file: File) {
  // 支持的3D模型文件格式
  const allowedTypes = ['.obj', '.glb', '.gltf', '.fbx', '.dae', '.3ds'];
  const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  
  if (!allowedTypes.includes(fileExtension)) {
    ElMessage.warning('请上传3D模型文件（支持格式：.obj, .glb, .gltf, .fbx, .dae, .3ds）');
    return false;
  }
  
  // 文件大小限制（例如：100MB）
  const maxSize = 100 * 1024 * 1024;
  if (file.size > maxSize) {
    ElMessage.warning('文件大小不能超过100MB');
    return false;
  }
  
  return true;
}

/**
 * 模型文件上传处理
 */
async function handleModelUpload(options: any) {
  const { file } = options;
  
  modelUploading.value = true;
  
  try {
    // 上传文件
    const response = await requestClient.upload<{ path: string }>('/file/upload', { file });
    
    // 获取返回的path
    const path = response?.path || (response as any)?.data?.path;
    if (!path) {
      ElMessage.error('上传失败，未返回文件路径');
      return;
    }

    const fileUrl = getFileUrl(path);

    // 设置模型文件路径（保存相对路径）
    formData.value.modelUrl = path;

    // 更新文件列表用于预览
    const fileItem = {
      name: file.name,
      url: fileUrl,
      status: 'success' as const,
      uid: Date.now(),
    };
    modelFileList.value = [fileItem];
    
    ElMessage.success('模型文件上传成功');
  }
  catch (err: any) {
    console.error('模型文件上传失败:', err);
    ElMessage.error(err.message || '模型文件上传失败');
    modelFileList.value = [];
  }
  finally {
    modelUploading.value = false;
  }
}

/**
 * 移除模型文件
 */
function handleModelRemove() {
  formData.value.modelUrl = undefined;
  modelFileList.value = [];
  return true;
}

/**
 * 封面图上传前的验证
 */
function beforeCoverImageUpload(file: File) {
  // 检查是否为图片文件
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请上传图片文件');
    return false;
  }
  return true;
}

/**
 * 封面图上传处理
 */
async function handleCoverImageUpload(options: any) {
  const { file } = options;
  
  coverImageUploading.value = true;
  
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

    // 设置封面图路径（保存相对路径）
    formData.value.coverImage = path;

    // 更新文件列表用于预览
    const fileItem = {
      name: file.name,
      url: imageUrl,
      status: 'success' as const,
      uid: Date.now(),
    };
    coverImageFileList.value = [fileItem];
    
    ElMessage.success('封面图上传成功');
  }
  catch (err: any) {
    console.error('封面图上传失败:', err);
    ElMessage.error(err.message || '封面图上传失败');
    coverImageFileList.value = [];
  }
  finally {
    coverImageUploading.value = false;
  }
}

/**
 * 移除封面图
 */
function handleCoverImageRemove() {
  formData.value.coverImage = '';
  coverImageFileList.value = [];
  return true;
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
      productId: 0,
      price: 0,
      stock: 0,
      lockedStock: 0,
      specJson: {},
      status: 1,
      modelUrl: undefined,
      coverImage: '',
    };
    specSelections.value = [];
    specValueMap.value = {};
    modelFileList.value = [];
    coverImageFileList.value = [];
    saving.value = false;
    // 加载规格列表
    await fetchSpecList();
    // 添加一个空的规格选择项
    addSpecSelection();
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
      const sku = await getProductSkuApi(row.id);
      
      formData.value = {
        id: sku.id,
        productId: sku.productId,
        price: sku.price,
        stock: sku.stock,
        lockedStock: sku.lockedStock,
        specJson: sku.specJson,
        status: sku.status,
        modelUrl: sku.modelUrl,
        coverImage: sku.coverImage || '',
      };

      // 初始化模型文件列表
      if (sku.modelUrl) {
        const fileUrl = getFileUrl(sku.modelUrl);
        // 从路径中提取文件名
        const fileName = sku.modelUrl.substring(sku.modelUrl.lastIndexOf('/') + 1) || 'model';
        modelFileList.value = [{
          name: fileName,
          url: fileUrl,
          status: 'success' as const,
          uid: Date.now(),
        }];
      }
      else {
        modelFileList.value = [];
      }

      // 初始化封面图文件列表
      if (sku.coverImage) {
        coverImageFileList.value = [{
          name: 'cover-image',
          url: getFileUrl(sku.coverImage),
          status: 'success' as const,
          uid: Date.now(),
        }];
      }
      else {
        coverImageFileList.value = [];
      }

      // 加载规格列表
      await fetchSpecList();
      
      // 先预加载所有规格的规格值列表（因为需要根据规格值文本查找ID）
      const specIds = specList.value.map(s => s.id);
      await Promise.all(specIds.map(specId => fetchSpecValues(specId)));
      
      // 解析specJson为规格选择项（现在格式是 {规格名称: 规格值文本}）
      parseSpecJsonToSelections(sku.specJson);
      
      // 如果解析后没有规格选择项，添加一个空的
      if (specSelections.value.length === 0) {
        addSpecSelection();
      }
    }
    catch (err: any) {
      console.error('获取SKU详情失败:', err);
      ElMessage.error(err.message || '获取SKU详情失败');
    }
    finally {
      loading.value = false;
    }
  },
});

/**
 * 创建SKU
 */
function onCreateSku() {
  createdrawerApi.open();
}

/**
 * 编辑SKU
 */
function onEditSku(row: RowType) {
  updatedrawerApi.setData(row);
  updatedrawerApi.open();
}

/**
 * 保存SKU
 */
async function handleSubmit() {
  if (!formData.value.productId || formData.value.productId <= 0) {
    ElMessage.warning('请输入商品ID');
    return;
  }

  if (!formData.value.price || formData.value.price <= 0) {
    ElMessage.warning('请输入销售价，且必须大于0');
    return;
  }

  if (formData.value.stock === undefined || formData.value.stock < 0) {
    ElMessage.warning('请输入库存，且不能小于0');
    return;
  }

  // 验证封面图必填
  if (!formData.value.coverImage || formData.value.coverImage.trim() === '') {
    ElMessage.warning('请上传封面图');
    return;
  }

  // 验证规格选择
  const hasInvalidSelection = specSelections.value.some(
    selection => !selection.specId || !selection.specValueId,
  );
  
  if (hasInvalidSelection) {
    ElMessage.warning('请完整选择所有规格的规格值');
    return;
  }

  // 检查是否有重复的规格
  const specIds = specSelections.value
    .map(s => s.specId)
    .filter((id): id is number => id !== undefined);
  const uniqueSpecIds = new Set(specIds);
  if (specIds.length !== uniqueSpecIds.size) {
    ElMessage.warning('不能选择重复的规格');
    return;
  }

  // 将规格选择项转换为specJson
  formData.value.specJson = convertSelectionsToSpecJson();

  saving.value = true;
  try {
    // 移除skuCode字段，由后端生成
    const { skuCode, ...dataWithoutSkuCode } = formData.value as any;
    
    if (formData.value.id) {
      await updateProductSkuApi(dataWithoutSkuCode as ProductSkuApi.UpdateProductSkuParams);
      ElMessage.success('更新SKU成功');
      updatedrawerApi.close();
    }
    else {
      await createProductSkuApi(dataWithoutSkuCode as ProductSkuApi.CreateProductSkuParams);
      ElMessage.success('创建SKU成功');
      createdrawerApi.close();
    }

    await GridApi.reload();
  }
  catch (err: any) {
    console.error('保存SKU失败:', err);
  }
  finally {
    saving.value = false;
  }
}

/**
 * 删除SKU
 */
async function onDeleteSku(row: RowType) {
  ElMessageBox.confirm(
    `删除后数据不可恢复，确认删除SKU吗？`,
    '警告',
    {
      type: 'warning',
    },
  ).then(async () => {
    await deleteProductSkuApi(row.id);
    await GridApi.reload();
  });
}
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-tools>
        <AccessControl :codes="['superadmin']">
          <ElButton class="mr-2" type="primary" @click="onCreateSku">
            添加SKU
          </ElButton>
        </AccessControl>
      </template>
      <template #status="{ row }">
        <ElTag :type="row.status === 1 ? 'success' : 'info'">
          {{ row.status === 1 ? '启用' : '禁用' }}
        </ElTag>
      </template>
      <template #action="{ row }">
        <AccessControl :codes="['superadmin']">
          <ElButton type="primary" @click="onEditSku(row)">编辑</ElButton>
        </AccessControl>
        <AccessControl :codes="['superadmin']">
          <ElButton type="danger" @click="onDeleteSku(row)">删除</ElButton>
        </AccessControl>
      </template>
    </Grid>
    
    <CreateDrawer :title="'添加SKU'">
      <div v-loading="loading" class="sku-form-container">
        <ElForm :model="formData" label-width="100px">
          <ElFormItem label="商品ID" required>
            <ElInputNumber
              v-model.number="formData.productId"
              placeholder="请输入商品ID"
              :min="1"
              style="width: 100%"
            />
          </ElFormItem>

          <ElFormItem label="销售价" required>
            <ElInputNumber
              v-model.number="formData.price"
              placeholder="请输入销售价"
              :min="0.01"
              :precision="2"
              :step="0.01"
              style="width: 100%"
            />
          </ElFormItem>

          <ElFormItem label="库存" required>
            <ElInputNumber
              v-model.number="formData.stock"
              placeholder="请输入库存"
              :min="0"
              style="width: 100%"
            />
          </ElFormItem>

          <ElFormItem label="锁定库存">
            <ElInputNumber
              v-model.number="formData.lockedStock"
              placeholder="请输入锁定库存"
              :min="0"
              style="width: 100%"
            />
          </ElFormItem>

          <ElFormItem label="模型文件">
            <ElUpload
              :file-list="modelFileList"
              :limit="1"
              :before-upload="beforeModelUpload"
              :http-request="handleModelUpload"
              :on-remove="handleModelRemove"
              accept=".obj,.glb,.gltf,.fbx,.dae,.3ds"
              list-type="text"
            >
              <template #trigger>
                <ElButton type="primary" :loading="modelUploading">
                  上传模型文件
                </ElButton>
              </template>
              <template #tip>
                <div class="form-item-tip">
                  支持格式：.obj, .glb, .gltf, .fbx, .dae, .3ds，文件大小不超过100MB
                </div>
              </template>
            </ElUpload>
          </ElFormItem>

          <ElFormItem label="封面图" required>
            <ElUpload
              :file-list="coverImageFileList"
              :limit="1"
              :before-upload="beforeCoverImageUpload"
              :http-request="handleCoverImageUpload"
              :on-remove="handleCoverImageRemove"
              accept="image/*"
              list-type="picture-card"
            >
              <template v-if="coverImageFileList.length === 0">
                <div class="upload-button">
                  <span v-if="!coverImageUploading">+</span>
                  <span v-else>上传中...</span>
                </div>
              </template>
            </ElUpload>
          </ElFormItem>

          <ElFormItem label="规格信息" required>
            <div class="spec-selection-container">
              <div
                v-for="(selection, index) in specSelections"
                :key="selection.key"
                class="spec-selection-item"
              >
                <div class="spec-selection-row">
                  <ElSelect
                    v-model="selection.specId"
                    placeholder="请选择规格"
                    filterable
                    clearable
                    :loading="specListLoading"
                    style="flex: 1; margin-right: 10px"
                    @change="handleSpecChange(selection)"
                  >
                    <ElOption
                      v-for="spec in specList"
                      :key="spec.id"
                      :label="spec.name"
                      :value="spec.id"
                      :disabled="specSelections.some((s, i) => i !== index && s.specId === spec.id)"
                    />
                  </ElSelect>
                  
                  <ElSelect
                    v-if="selection.specId"
                    v-model="selection.specValueId"
                    placeholder="请选择规格值"
                    filterable
                    clearable
                    :loading="specValueLoadingMap[selection.specId] || false"
                    style="flex: 1; margin-right: 10px"
                  >
                    <ElOption
                      v-for="specValue in (specValueMap[selection.specId] || [])"
                      :key="specValue.id"
                      :label="specValue.value"
                      :value="specValue.id"
                    />
                  </ElSelect>
                  
                  <ElButton
                    type="danger"
                    size="small"
                    @click="removeSpecSelection(index)"
                  >
                    删除
                  </ElButton>
                </div>
              </div>
              
              <ElButton
                type="primary"
                style="width: 100%; margin-top: 10px"
                @click="addSpecSelection"
              >
                添加规格
              </ElButton>
            </div>
          </ElFormItem>

          <ElFormItem label="状态" required>
            <ElSelect v-model.number="formData.status" placeholder="请选择状态" style="width: 100%">
              <ElOption :label="'启用'" :value="1" />
              <ElOption :label="'禁用'" :value="0" />
            </ElSelect>
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

    <UpdateDrawer :title="'编辑SKU'">
      <div v-loading="loading" class="sku-form-container">
        <ElForm :model="formData" label-width="100px">
          <ElFormItem label="商品ID" required>
            <ElInputNumber
              v-model.number="formData.productId"
              placeholder="请输入商品ID"
              :min="1"
              style="width: 100%"
            />
          </ElFormItem>

          <ElFormItem label="销售价">
            <ElInputNumber
              v-model.number="formData.price"
              placeholder="请输入销售价"
              :min="0.01"
              :precision="2"
              :step="0.01"
              style="width: 100%"
            />
          </ElFormItem>

          <ElFormItem label="库存">
            <ElInputNumber
              v-model.number="formData.stock"
              placeholder="请输入库存"
              :min="0"
              style="width: 100%"
            />
          </ElFormItem>

          <ElFormItem label="锁定库存">
            <ElInputNumber
              v-model.number="formData.lockedStock"
              placeholder="请输入锁定库存"
              :min="0"
              style="width: 100%"
            />
          </ElFormItem>

          <ElFormItem label="模型文件">
            <ElUpload
              :file-list="modelFileList"
              :limit="1"
              :before-upload="beforeModelUpload"
              :http-request="handleModelUpload"
              :on-remove="handleModelRemove"
              accept=".obj,.glb,.gltf,.fbx,.dae,.3ds"
              list-type="text"
            >
              <template #trigger>
                <ElButton type="primary" :loading="modelUploading">
                  上传模型文件
                </ElButton>
              </template>
              <template #tip>
                <div class="form-item-tip">
                  支持格式：.obj, .glb, .gltf, .fbx, .dae, .3ds，文件大小不超过100MB
                </div>
              </template>
            </ElUpload>
          </ElFormItem>

          <ElFormItem label="封面图" required>
            <ElUpload
              :file-list="coverImageFileList"
              :limit="1"
              :before-upload="beforeCoverImageUpload"
              :http-request="handleCoverImageUpload"
              :on-remove="handleCoverImageRemove"
              accept="image/*"
              list-type="picture-card"
            >
              <template v-if="coverImageFileList.length === 0">
                <div class="upload-button">
                  <span v-if="!coverImageUploading">+</span>
                  <span v-else>上传中...</span>
                </div>
              </template>
            </ElUpload>
          </ElFormItem>

          <ElFormItem label="规格信息" required>
            <div class="spec-selection-container">
              <div
                v-for="(selection, index) in specSelections"
                :key="selection.key"
                class="spec-selection-item"
              >
                <div class="spec-selection-row">
                  <ElSelect
                    v-model="selection.specId"
                    placeholder="请选择规格"
                    filterable
                    clearable
                    :loading="specListLoading"
                    style="flex: 1; margin-right: 10px"
                    @change="handleSpecChange(selection)"
                  >
                    <ElOption
                      v-for="spec in specList"
                      :key="spec.id"
                      :label="spec.name"
                      :value="spec.id"
                      :disabled="specSelections.some((s, i) => i !== index && s.specId === spec.id)"
                    />
                  </ElSelect>
                  
                  <ElSelect
                    v-if="selection.specId"
                    v-model="selection.specValueId"
                    placeholder="请选择规格值"
                    filterable
                    clearable
                    :loading="specValueLoadingMap[selection.specId] || false"
                    style="flex: 1; margin-right: 10px"
                  >
                    <ElOption
                      v-for="specValue in (specValueMap[selection.specId] || [])"
                      :key="specValue.id"
                      :label="specValue.value"
                      :value="specValue.id"
                    />
                  </ElSelect>
                  
                  <ElButton
                    type="danger"
                    size="small"
                    @click="removeSpecSelection(index)"
                  >
                    删除
                  </ElButton>
                </div>
              </div>
              
              <ElButton
                type="primary"
                style="width: 100%; margin-top: 10px"
                @click="addSpecSelection"
              >
                添加规格
              </ElButton>
            </div>
          </ElFormItem>

          <ElFormItem label="状态">
            <ElSelect v-model.number="formData.status" placeholder="请选择状态" style="width: 100%">
              <ElOption :label="'启用'" :value="1" />
              <ElOption :label="'禁用'" :value="0" />
            </ElSelect>
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
.sku-form-container {
  padding: 20px 0;
}

.form-item-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.spec-selection-container {
  width: 100%;
}

.spec-selection-item {
  margin-bottom: 10px;
}

.spec-selection-row {
  display: flex;
  align-items: center;
  gap: 10px;
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

