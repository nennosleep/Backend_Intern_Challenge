export const successResponse = (data: any = {}, message = 'Success') => ({
  success: true,
  message,
  data,
  errors: null,
});

export const paginationResponse = (data: any, meta: any, message = 'Success') => ({
  success: true,
  message,
  data,
  meta,
  errors: null,
});

export const errorResponse = (message = 'Error', errors: any = null) => ({
  success: null,
  message,
  data: {},
  errors: true,
});
