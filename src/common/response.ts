export const successResponse = (data: any = {}, message = 'Success') => ({
  success: true,
  message,
  data,
  errors: null,
});

export const errorResponse = (message = 'Error', errors: any = null) => ({
  success: false,
  message,
  data: {},
  errors,
});
