import { userRepository } from './user.repository';

export const userService = {
  findMany: () => {
    return userRepository.findMany();
  },

  findById: async (id: string) => {
    const user = await userRepository.findById(id);
    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return user;
  },

  assignRole: async (userId: string, roleName: string) => {
    // Check if user exists
    await userService.findById(userId);
    return userRepository.assignRole(userId, roleName);
  },
};
