export const USER_STATUS = {
  normal: '正常',
  frozen: '冻结',
  deleted: '已删除',
};

export const USER_STATUS_OPTIONS = Object.entries(USER_STATUS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export const USER_STATUS_TAG_TYPE = {
  normal: 'success',
  frozen: 'danger',
  deleted: 'info',
};
