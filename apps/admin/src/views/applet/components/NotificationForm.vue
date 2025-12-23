<script setup lang="ts">
import { useVbenForm } from '@vben/common-ui';
import { ElButton } from 'element-plus';
import { nextTick, watch } from 'vue';

export interface Notification {
    content: string;
    url: string;
}

interface Props {
    modelValue: Notification[];
}

interface Emits {
    (e: 'update:modelValue', value: Notification[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 将 notifications 数组转换为表单 schema
function buildNotificationSchema(notifications: Notification[]) {
    const schema: any[] = [];
    notifications.forEach((_, index) => {
        schema.push({
            component: 'Input',
            componentProps: {
                placeholder: '请输入通知内容',
                type: 'textarea',
                class: 'w-full',
            },
            fieldName: `notification.${index}.content`,
            label: `通知内容 ${index + 1}`,
            rules: 'required',
            formItemClass: 'col-span-1',
        });
        schema.push({
            component: 'Input',
            componentProps: {
                placeholder: '请输入链接地址',
                class: 'w-full',
            },
            fieldName: `notification.${index}.url`,
            label: `链接地址 ${index + 1}`,
            rules: 'required',
            formItemClass: 'col-span-1',
        });
        // 添加删除按钮字段（使用插槽渲染）
        schema.push({
            component: 'div',
            fieldName: `delete_notification_${index}`,
            label: '',
            formItemClass: 'col-span-1 flex items-end',
            hideLabel: true,
        });
    });
    return schema;
}

// 将表单值转换为 API 需要的格式 - 通知
function convertNotificationToApi(values: Record<string, any>): Notification[] {
    const notifications: Notification[] = [];

    if (values.notification && typeof values.notification === 'object') {
        // 处理嵌套对象结构
        const notificationObj = values.notification;
        const indices = Object.keys(notificationObj)
            .map(key => parseInt(key, 10))
            .filter(num => !isNaN(num))
            .sort((a, b) => a - b);

        indices.forEach(index => {
            const notification = notificationObj[index];
            if (notification && typeof notification === 'object') {
                const content = notification.content;
                const url = notification.url;
                if (content !== undefined && url !== undefined) {
                    notifications.push({
                        content: String(content || ''),
                        url: String(url || ''),
                    });
                }
            }
        });
    } else {
        // 处理扁平结构（向后兼容）
        const notificationMap = new Map<number, Partial<Notification>>();

        Object.keys(values).forEach((key) => {
            const match = key.match(/^notification\.(\d+)\.(content|url)$/);
            if (match) {
                const index = parseInt(match[1] || '0', 10);
                const field = (match[2] || '') as 'content' | 'url';
                if (field && (field === 'content' || field === 'url')) {
                    if (!notificationMap.has(index)) {
                        notificationMap.set(index, {});
                    }
                    const notification = notificationMap.get(index)!;
                    notification[field] = values[key];
                }
            }
        });

        // 转换为数组并按索引排序
        Array.from(notificationMap.entries())
            .sort(([a], [b]) => a - b)
            .forEach(([, notification]) => {
                if (notification.content !== undefined && notification.url !== undefined) {
                    notifications.push({
                        content: String(notification.content || ''),
                        url: String(notification.url || ''),
                    });
                }
            });
    }

    return notifications;
}

// 通知表单
let isUpdatingFromProps = false;

const [NotificationForm, NotificationFormApi] = useVbenForm({
    commonConfig: {
        componentProps: {
            class: 'w-full',
            position: 'top',
        },
    },
    scrollToFirstError: true,
    layout: 'horizontal',
    schema: [],
    wrapperClass: 'grid-cols-3',
    showDefaultActions: false,
    handleValuesChange: async (values) => {
        // 避免循环更新
        if (isUpdatingFromProps) {
            return;
        }
        const notifications = convertNotificationToApi(values || {});
        emit('update:modelValue', notifications);
    },
});

// 监听 props 变化，更新表单
watch(() => props.modelValue, async (newValue) => {
    // 避免循环更新
    if (isUpdatingFromProps) {
        return;
    }
    if (!newValue || newValue.length === 0) {
        NotificationFormApi.setState({ schema: [] });
        return;
    }

    // 构建表单 schema
    const notificationSchema = buildNotificationSchema(newValue);
    NotificationFormApi.setState({ schema: notificationSchema });

    // 等待 DOM 更新完成
    await nextTick();
    await nextTick();

    // 设置表单初始值
    const notificationValues: Record<string, any> = {
        notification: {} as Record<number, { content: string; url: string }>,
    };
    newValue.forEach((notification, index) => {
        if (!notificationValues.notification[index]) {
            notificationValues.notification[index] = {} as { content: string; url: string };
        }
        notificationValues.notification[index].content = notification.content;
        notificationValues.notification[index].url = notification.url;
    });
    isUpdatingFromProps = true;
    await NotificationFormApi.setValues(notificationValues);
    await nextTick();
    isUpdatingFromProps = false;
}, { immediate: true });

// 添加通知项
function handleAddNotification() {
    const newList = [...props.modelValue, { content: '', url: '' }];
    emit('update:modelValue', newList);
}

// 删除通知项
function handleDeleteNotification(index: number) {
    const newList = [...props.modelValue];
    newList.splice(index, 1);
    emit('update:modelValue', newList);
}

// 暴露方法供父组件调用
defineExpose({
    getValues: async () => {
        const values = await NotificationFormApi.getValues();
        return convertNotificationToApi(values || {});
    },
});
</script>

<template>
    <div>
        <div v-if="modelValue.length === 0" class="text-center py-8 text-gray-400">
            添加通知配置
        </div>
        <NotificationForm v-else>
            <template v-for="(_, index) in modelValue" :key="`delete_notification_${index}`"
                #[`delete_notification_${index}`]>
                <div class="flex items-end h-full pb-1">
                    <ElButton type="danger" size="small" @click="handleDeleteNotification(index)">
                        删除
                    </ElButton>
                </div>
            </template>
        </NotificationForm>
        <div class="mt-4">
            <ElButton type="primary" @click="handleAddNotification">
                添加通知
            </ElButton>
        </div>
    </div>
</template>

<style scoped></style>

