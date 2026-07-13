export const successResponse = (data: any = {}, message = 'Success') => ({
  success: true,
  message: 'Success',
  data,
  errors: null,
});

export const errorResponse = (message = 'Error', errors: any = null) => ({
  success: null,
  message,
  data: {},
  errors: true,
});
