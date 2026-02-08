import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'Order',
    path: '/order',
    component: () => import('#/views/order/index.vue'),
    meta: {
      icon: 'lucide:shopping-cart',
      title: '订单管理',
    },
  },
  {
    name: 'OrderDetail',
    path: '/order/detail',
    component: () => import('#/views/order/detail.vue'),
    meta: {
      hideInMenu: true,
      title: '订单详情',
    },
  },
  {
    name: 'OrderEdit',
    path: '/order/edit',
    component: () => import('#/views/order/edit.vue'),
    meta: {
      hideInMenu: true,
      title: '编辑订单',
    },
  },
];

export default routes;
