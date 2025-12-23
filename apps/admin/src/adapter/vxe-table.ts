import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import { h } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { setupVbenVxeTable, useVbenVxeGrid } from '@vben/plugins/vxe-table';

import { ElButton, ElImage, ElTag } from 'element-plus';

import { useVbenForm } from './form';

setupVbenVxeTable({
  configVxeTable: (vxeUI) => {
    vxeUI.setConfig({
      grid: {
        align: 'center',
        border: false,
        columnConfig: {
          resizable: true,
        },
        minHeight: 180,
        formConfig: {
          // 全局禁用vxe-table的表单配置，使用formOptions
          enabled: false,
        },
        proxyConfig: {
          autoLoad: true,
          response: {
            result: 'items',
            total: 'total',
            list: 'items',
          },
          showActiveMsg: true,
          showResponseMsg: false,
        },
        round: true,
        showOverflow: true,
        size: 'small',
      } as VxeTableGridOptions,
    });

    // 表格配置项可以用 cellRender: { name: 'CellImage' },
    vxeUI.renderer.add('CellImage', {
      renderTableDefault(_renderOpts, params) {
        const { column, row } = params;
        const src = row[column.field];
        const vnode = h(ElImage, { src, previewSrcList: [src] });
        return vnode as any;
      },
    });

    // 表格配置项可以用 cellRender: { name: 'CellLink' },
    vxeUI.renderer.add('CellLink', {
      renderTableDefault(renderOpts) {
        const { props } = renderOpts;
        const vnode = h(
          ElButton,
          { size: 'small', link: true },
          { default: () => props?.text },
        );
        return vnode as any;
      },
    });

    // 表格配置项可以用 cellRender: { name: 'CellIcon' },
    vxeUI.renderer.add('CellIcon', {
      renderTableDefault(_renderOpts, params) {
        const { column, row } = params;
        const icon = row[column.field];
        if (!icon) return null as any;
        if (typeof icon === 'string' && /^https?:/i.test(icon)) {
          const vnode = h(ElImage, {
            src: icon,
            previewSrcList: [icon],
            style: 'width:20px;height:20px',
            fit: 'contain',
          });
          return vnode as any;
        }
        const vnode = h(IconifyIcon, { icon, width: 20, height: 20 });
        return vnode as any;
      },
    });

    // 表格配置项可以用 cellRender: { name: 'CellTypeTag' },
    vxeUI.renderer.add('CellTypeTag', {
      renderTableDefault(_renderOpts, params) {
        const { column, row } = params;
        const value = row[column.field];
        const map: Record<
          number,
          { label: string; type: 'danger' | 'info' | 'success' | 'warning' }
        > = {
          0: { label: '菜单', type: 'success' },
          1: { label: '按钮', type: 'warning' },
          2: { label: '接口', type: 'info' },
          3: { label: '外链', type: 'danger' },
        };
        const meta = map[value as number] || {
          label: String(value ?? ''),
          type: 'info',
        };
        const vnode = h(
          ElTag,
          { type: meta.type },
          { default: () => meta.label },
        );
        return vnode as any;
      },
    });

    // 这里可以自行扩展 vxe-table 的全局配置，比如自定义格式化
    // vxeUI.formats.add
  },
  useVbenForm,
});

export { useVbenVxeGrid };

export type * from '@vben/plugins/vxe-table';
