import { userRepository } from './user.repository';

export const userService = {
  findMany: async () => {
    const users = await userRepository.findMany();
    return users.map(user => ({
      ...user,
      roles: user.userRoles.map(ur => ur.role.name),
      userRoles: undefined, // remove raw relation data
    }));
  },

  findById: async (id: string) => {
    const user = await userRepository.findById(id);
    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return {
      ...user,
      roles: user.userRoles.map(ur => ur.role.name),
      userRoles: undefined,
    };
  },

  assignRole: async (userId: string, roleName: string) => {
    // Check if user exists
    await userService.findById(userId);
    return userRepository.assignRole(userId, roleName);
  },

  unassignRole: async (userId: string, roleName: string) => {
    await userService.findById(userId);
    return userRepository.unassignRole(userId, roleName);
  },
};
