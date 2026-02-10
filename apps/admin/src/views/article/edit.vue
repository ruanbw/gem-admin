<script lang="ts" setup>
import type { ArticleApi } from "#/api/core/article";

import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { EditorContent, useEditor } from "@tiptap/vue-3";
import Image from "@tiptap/extension-image";
import StarterKit from "@tiptap/starter-kit";

import {
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElSelect,
  ElOption,
  ElUpload,
} from "element-plus";
import type { UploadFiles } from "element-plus";

import { createArticleApi, getArticleApi, updateArticleApi } from "#/api";
import { requestClient } from "#/api/request";
import { getFileUrl } from "#/composables/file";

const route = useRoute();
const router = useRouter();

const articleId = computed(() => route.query.id as string | undefined);
const isEdit = computed(() => !!articleId.value);

// 表单数据
const formData = ref<ArticleApi.CreateArticleParams>({
  title: "",
  author: "",
  previewImage: "",
  content: "",
  status: "DRAFT",
  createAt: new Date().toISOString(),
});

const loading = ref(false);
const saving = ref(false);
const imageUploading = ref(false);
const previewImageUploading = ref(false);
const previewImageFileList = ref<UploadFiles>([]);

// 初始化编辑器
const editor = useEditor({
  extensions: [
    StarterKit,
    Image.configure({
      inline: true,
      allowBase64: true,
    }),
  ],
  content: "",
  editable: true,
});

// 处理HTML内容中的img标签src，将相对路径转换为完整URL
function processImageUrls(htmlContent: string): string {
  if (!htmlContent) {
    return htmlContent;
  }

  // 匹配img标签中的src属性
  return htmlContent.replace(
    /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi,
    (match, before, src, after) => {
      // 如果src已经是完整URL（http://或https://开头），则不需要处理
      if (
        src.startsWith("http://") ||
        src.startsWith("https://") ||
        src.startsWith("data:")
      ) {
        return match;
      }

      // 将相对路径转换为完整URL
      const fullUrl = getFileUrl(src);
      return `<img${before}src="${fullUrl}"${after}>`;
    },
  );
}

// 获取文章详情
async function fetchArticle() {
  if (!articleId.value) {
    return;
  }
  loading.value = true;
  try {
    const article = await getArticleApi(articleId.value);

    // 处理图片URL
    const processedContent = processImageUrls(article.content);

    formData.value = {
      title: article.title,
      author: article.author,
      previewImage: article.previewImage,
      content: processedContent,
      status: article.status,
      createAt: article.createAt,
    };

    // 设置预览图文件列表（如果有预览图）
    if (article.previewImage) {
      previewImageFileList.value = [
        {
          name: "preview-image",
          url: getFileUrl(article.previewImage),
          status: "success",
          uid: Date.now(),
        },
      ];
    } else {
      previewImageFileList.value = [];
    }

    // 更新编辑器内容
    if (editor.value && processedContent) {
      editor.value.commands.setContent(processedContent);
    }
  } catch (err: any) {
    console.error("获取文章详情失败:", err);
    ElMessage.error(err.message || "获取文章详情失败");
  } finally {
    loading.value = false;
  }
}

// 当文章数据加载后，更新编辑器内容
watch(
  () => formData.value.content,
  (newContent) => {
    if (editor.value && newContent && !editor.value.getHTML()) {
      editor.value.commands.setContent(newContent);
    }
  },
  { immediate: true },
);

// 保存文章
async function handleSubmit() {
  if (!editor.value) {
    return;
  }

  // 获取编辑器内容
  const content = editor.value.getHTML();
  if (!content || content === "<p></p>") {
    ElMessage.warning("请输入文章内容");
    return;
  }

  if (!formData.value.title.trim()) {
    ElMessage.warning("请输入文章标题");
    return;
  }

  if (!formData.value.author.trim()) {
    ElMessage.warning("请输入作者");
    return;
  }

  saving.value = true;
  try {
    const payload = {
      ...formData.value,
      content,
      createAt: formData.value.createAt || new Date().toISOString(),
    };

    if (isEdit.value && articleId.value) {
      await updateArticleApi({ ...payload, id: articleId.value });
      ElMessage.success("更新文章成功");
    } else {
      await createArticleApi(payload);
      ElMessage.success("创建文章成功");
    }

    // 返回列表页
    router.push("/article");
  } catch (err: any) {
    console.error("保存文章失败:", err);
    ElMessage.error(err.message || "保存文章失败");
  } finally {
    saving.value = false;
  }
}

// 取消
function handleCancel() {
  router.back();
}

// 组件挂载时获取数据
onMounted(() => {
  if (isEdit.value) {
    fetchArticle();
  }

  // 监听编辑器的粘贴事件
  if (editor.value) {
    editor.value.view.dom.addEventListener("paste", handlePaste);
  }
});

// 图片上传处理
async function handleImageUpload(file: File) {
  if (!editor.value) {
    return false;
  }

  // 检查是否为图片文件
  if (!file.type.startsWith("image/")) {
    ElMessage.warning("请上传图片文件");
    return false;
  }

  imageUploading.value = true;
  try {
    // 上传图片
    // 响应格式: { code: 200, msg: "ok", data: { path: "upload/..." } }
    // requestClient 会自动解包 data 字段，所以 response 直接是 { path: "upload/..." }
    const response = await requestClient.upload<{ path: string }>(
      "/file/upload",
      { file },
    );

    // 获取返回的path
    const path = response.path;
    if (!path) {
      ElMessage.error("上传失败，未返回文件路径");
      return false;
    }

    // 使用getFileUrl获取完整链接
    const imageUrl = getFileUrl(path);

    // 插入图片到编辑器
    editor.value.chain().focus().setImage({ src: imageUrl }).run();

    ElMessage.success("图片上传成功");
    return false; // 阻止默认上传
  } catch (err: any) {
    console.error("图片上传失败:", err);
    ElMessage.error(err.message || "图片上传失败");
    return false;
  } finally {
    imageUploading.value = false;
  }
}

// 处理粘贴图片
function handlePaste(event: ClipboardEvent) {
  if (!editor.value) {
    return;
  }

  const items = event.clipboardData?.items;
  if (!items) {
    return;
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item && item.type.indexOf("image") !== -1) {
      event.preventDefault();
      const file = item.getAsFile();
      if (file) {
        handleImageUpload(file);
      }
      return;
    }
  }
}

// 预览图上传前的验证
function beforePreviewImageUpload(file: File) {
  // 检查是否为图片文件
  if (!file.type.startsWith("image/")) {
    ElMessage.warning("请上传图片文件");
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
    // 响应格式: { code: 200, msg: "ok", data: { path: "upload/..." } }
    // requestClient 会自动解包 data 字段，所以 response 直接是 { path: "upload/..." }
    const response = await requestClient.upload<{ path: string }>(
      "/file/upload",
      { file },
    );

    console.log("上传响应:", response);

    // 获取返回的path
    const path = response?.path || (response as any)?.data?.path;
    if (!path) {
      console.error("上传响应数据:", response);
      ElMessage.error("上传失败，未返回文件路径");
      return;
    }

    console.log("文件路径:", path);
    const imageUrl = getFileUrl(path);
    console.log("完整URL:", imageUrl);

    // 设置预览图路径（保存相对路径）
    formData.value.previewImage = path;

    // 更新文件列表用于预览
    const fileItem = {
      name: file.name,
      url: imageUrl,
      status: "success" as const,
      uid: Date.now(),
    };
    console.log("文件列表项:", fileItem);
    previewImageFileList.value = [fileItem];

    ElMessage.success("预览图上传成功");
  } catch (err: any) {
    console.error("预览图上传失败:", err);
    ElMessage.error(err.message || "预览图上传失败");
    previewImageFileList.value = [];
  } finally {
    previewImageUploading.value = false;
  }
}

// 移除预览图
function handlePreviewImageRemove() {
  formData.value.previewImage = "";
  previewImageFileList.value = [];
  return true;
}
</script>

<template>
  <div class="article-edit-container bg-background">
    <div class="article-edit-header">
      <h2>{{ isEdit ? "编辑文章" : "添加文章" }}</h2>
      <div class="article-edit-actions">
        <ElButton @click="handleCancel">取消</ElButton>
        <ElButton type="primary" :loading="saving" @click="handleSubmit">
          保存
        </ElButton>
      </div>
    </div>

    <div v-loading="loading" class="article-edit-content">
      <ElForm :model="formData" label-width="80px">
        <ElFormItem label="标题" required>
          <ElInput
            v-model="formData.title"
            placeholder="请输入文章标题"
            maxlength="200"
            show-word-limit
          />
        </ElFormItem>

        <ElFormItem label="作者" required>
          <ElInput
            v-model="formData.author"
            placeholder="请输入作者"
            maxlength="50"
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

        <ElFormItem label="状态" required>
          <ElSelect v-model="formData.status" placeholder="请选择状态">
            <ElOption label="草稿" value="DRAFT" />
            <ElOption label="已发布" value="PUBLISHED" />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="内容" required>
          <div class="editor-wrapper">
            <div class="editor-toolbar">
              <ElButton
                size="small"
                :class="{ 'is-active': editor?.isActive('bold') }"
                @click="editor?.chain().focus().toggleBold().run()"
              >
                <strong>B</strong>
              </ElButton>
              <ElButton
                size="small"
                :class="{ 'is-active': editor?.isActive('italic') }"
                @click="editor?.chain().focus().toggleItalic().run()"
              >
                <em>I</em>
              </ElButton>
              <ElButton
                size="small"
                :class="{
                  'is-active': editor?.isActive('heading', { level: 1 }),
                }"
                @click="
                  editor?.chain().focus().toggleHeading({ level: 1 }).run()
                "
              >
                H1
              </ElButton>
              <ElButton
                size="small"
                :class="{
                  'is-active': editor?.isActive('heading', { level: 2 }),
                }"
                @click="
                  editor?.chain().focus().toggleHeading({ level: 2 }).run()
                "
              >
                H2
              </ElButton>
              <ElButton
                size="small"
                :class="{ 'is-active': editor?.isActive('bulletList') }"
                @click="editor?.chain().focus().toggleBulletList().run()"
              >
                • 列表
              </ElButton>
              <ElButton
                size="small"
                :class="{ 'is-active': editor?.isActive('orderedList') }"
                @click="editor?.chain().focus().toggleOrderedList().run()"
              >
                1. 列表
              </ElButton>
              <ElButton
                size="small"
                :class="{ 'is-active': editor?.isActive('blockquote') }"
                @click="editor?.chain().focus().toggleBlockquote().run()"
              >
                "
              </ElButton>
              <ElButton
                size="small"
                :class="{ 'is-active': editor?.isActive('codeBlock') }"
                @click="editor?.chain().focus().toggleCodeBlock().run()"
              >
                &lt;/&gt;
              </ElButton>
              <ElUpload
                :show-file-list="false"
                :before-upload="handleImageUpload"
                accept="image/*"
                class="editor-upload"
              >
                <ElButton size="small" :loading="imageUploading" type="primary">
                  上传图片
                </ElButton>
              </ElUpload>
            </div>
            <EditorContent :editor="editor" class="editor-content" />
          </div>
        </ElFormItem>
      </ElForm>
    </div>
  </div>
</template>

<style scoped>
.article-edit-container {
  padding: 24px;
  min-height: 100%;
}

.article-edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.article-edit-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.article-edit-actions {
  display: flex;
  gap: 12px;
}

.article-edit-content {
  max-width: 1200px;
}

.editor-wrapper {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.editor-toolbar {
  padding: 8px;
  background: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.editor-toolbar .el-button.is-active {
  background: #409eff;
  color: #fff;
}

.editor-upload {
  margin-left: 8px;
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

.editor-content {
  min-height: 400px;
}

:deep(.ProseMirror) {
  min-height: 400px;
  padding: 16px;
  outline: none;
}

:deep(.ProseMirror h1),
:deep(.ProseMirror h2),
:deep(.ProseMirror h3) {
  font-weight: bold;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

:deep(.ProseMirror h1) {
  font-size: 2em;
}

:deep(.ProseMirror h2) {
  font-size: 1.5em;
}

:deep(.ProseMirror h3) {
  font-size: 1.25em;
}

:deep(.ProseMirror p) {
  margin-bottom: 1em;
  line-height: 1.6;
}

:deep(.ProseMirror img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 1em 0;
}

:deep(.ProseMirror ul),
:deep(.ProseMirror ol) {
  padding-left: 1.5em;
  margin-bottom: 1em;
}

:deep(.ProseMirror li) {
  margin-bottom: 0.5em;
}

:deep(.ProseMirror a) {
  color: #409eff;
  text-decoration: underline;
}

:deep(.ProseMirror blockquote) {
  border-left: 4px solid #e5e7eb;
  padding-left: 1em;
  margin: 1em 0;
  color: #6b7280;
  font-style: italic;
}

:deep(.ProseMirror code) {
  background-color: #f3f4f6;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.9em;
}

:deep(.ProseMirror pre) {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
  margin: 1em 0;
}

:deep(.ProseMirror pre code) {
  background-color: transparent;
  padding: 0;
  color: inherit;
}
</style>
