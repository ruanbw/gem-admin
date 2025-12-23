<script setup lang="ts">
import { useVbenForm } from '@vben/common-ui';
import { ElButton } from 'element-plus';
import { nextTick, watch } from 'vue';

export interface RecyclingProcess {
    title: string;
    desc: string;
}

interface Props {
    modelValue: RecyclingProcess[];
}

interface Emits {
    (e: 'update:modelValue', value: RecyclingProcess[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 将 recyclingProcess 数组转换为表单 schema
function buildRecyclingProcessSchema(processes: RecyclingProcess[]) {
    const schema: any[] = [];
    processes.forEach((_, index) => {
        schema.push({
            component: 'Input',
            componentProps: {
                placeholder: '请输入标题',
                class: 'w-full',
            },
            fieldName: `recyclingProcess.${index}.title`,
            label: `说明标题${index + 1}`,
            rules: 'required',
            formItemClass: 'col-span-1',
        });
        schema.push({
            component: 'Input',
            componentProps: {
                placeholder: '请输入描述',
                type: 'textarea',
                class: 'w-full',
            },
            fieldName: `recyclingProcess.${index}.desc`,
            label: `说明${index + 1}`,
            rules: 'required',
            formItemClass: 'col-span-1',
        });
        // 添加删除按钮字段（使用插槽渲染）
        schema.push({
            component: 'div',
            fieldName: `delete_process_${index}`,
            label: '',
            formItemClass: 'col-span-1 flex items-end',
            hideLabel: true,
        });
    });
    return schema;
}

// 将表单值转换为 API 需要的格式 - 回收流程
function convertRecyclingProcessToApi(values: Record<string, any>): RecyclingProcess[] {
    const processes: RecyclingProcess[] = [];

    if (values.recyclingProcess && typeof values.recyclingProcess === 'object') {
        // 处理嵌套对象结构
        const recyclingProcessObj = values.recyclingProcess;
        const indices = Object.keys(recyclingProcessObj)
            .map(key => parseInt(key, 10))
            .filter(num => !isNaN(num))
            .sort((a, b) => a - b);

        indices.forEach(index => {
            const process = recyclingProcessObj[index];
            if (process && typeof process === 'object') {
                const title = process.title;
                const desc = process.desc;
                if (title !== undefined && desc !== undefined) {
                    processes.push({
                        title: String(title || ''),
                        desc: String(desc || ''),
                    });
                }
            }
        });
    } else {
        // 处理扁平结构（向后兼容）
        const processMap = new Map<number, Partial<RecyclingProcess>>();

        Object.keys(values).forEach((key) => {
            const match = key.match(/^recyclingProcess\.(\d+)\.(title|desc)$/);
            if (match) {
                const index = parseInt(match[1] || '0', 10);
                const field = (match[2] || '') as 'title' | 'desc';
                if (field && (field === 'title' || field === 'desc')) {
                    if (!processMap.has(index)) {
                        processMap.set(index, {});
                    }
                    const process = processMap.get(index)!;
                    process[field] = values[key];
                }
            }
        });

        // 转换为数组并按索引排序
        Array.from(processMap.entries())
            .sort(([a], [b]) => a - b)
            .forEach(([, process]) => {
                if (process.title !== undefined && process.desc !== undefined) {
                    processes.push({
                        title: String(process.title || ''),
                        desc: String(process.desc || ''),
                    });
                }
            });
    }

    return processes;
}

// 回收流程表单
let isUpdatingFromProps = false;

const [RecyclingProcessForm, RecyclingProcessFormApi] = useVbenForm({
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
        const processes = convertRecyclingProcessToApi(values || {});
        emit('update:modelValue', processes);
    },
});

// 监听 props 变化，更新表单
watch(() => props.modelValue, async (newValue) => {
    // 避免循环更新
    if (isUpdatingFromProps) {
        return;
    }
    if (!newValue || newValue.length === 0) {
        RecyclingProcessFormApi.setState({ schema: [] });
        return;
    }

    // 构建表单 schema
    const recyclingProcessSchema = buildRecyclingProcessSchema(newValue);
    RecyclingProcessFormApi.setState({ schema: recyclingProcessSchema });

    // 等待 DOM 更新完成
    await nextTick();
    await nextTick();

    // 设置表单初始值
    const recyclingProcessValues: Record<string, any> = {
        recyclingProcess: {} as Record<number, { title: string; desc: string }>,
    };
    newValue.forEach((process, index) => {
        if (!recyclingProcessValues.recyclingProcess[index]) {
            recyclingProcessValues.recyclingProcess[index] = {} as { title: string; desc: string };
        }
        recyclingProcessValues.recyclingProcess[index].title = process.title;
        recyclingProcessValues.recyclingProcess[index].desc = process.desc;
    });
    isUpdatingFromProps = true;
    await RecyclingProcessFormApi.setValues(recyclingProcessValues);
    await nextTick();
    isUpdatingFromProps = false;
}, { immediate: true });

// 添加回收流程项
function handleAddFlow() {
    const newList = [...props.modelValue, { title: '', desc: '' }];
    emit('update:modelValue', newList);
}

// 删除回收流程项
function handleDeleteFlow(index: number) {
    const newList = [...props.modelValue];
    newList.splice(index, 1);
    emit('update:modelValue', newList);
}

// 暴露方法供父组件调用
defineExpose({
    getValues: async () => {
        const values = await RecyclingProcessFormApi.getValues();
        return convertRecyclingProcessToApi(values || {});
    },
});
</script>

<template>
    <div>
        <div v-if="modelValue.length === 0" class="text-center py-8 text-gray-400">
            添加回收流程说明
        </div>
        <RecyclingProcessForm v-else>
            <template v-for="(_, index) in modelValue" :key="`delete_process_${index}`"
                #[`delete_process_${index}`]>
                <div class="flex items-end h-full pb-1">
                    <ElButton type="danger" size="small" @click="handleDeleteFlow(index)">
                        删除
                    </ElButton>
                </div>
            </template>
        </RecyclingProcessForm>
        <div class="mt-4">
            <ElButton type="primary" @click="handleAddFlow">
                添加说明
            </ElButton>
        </div>
    </div>
</template>

<style scoped></style>

