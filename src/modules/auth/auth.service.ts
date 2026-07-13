import bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './auth.dto';
import { authRepository } from './auth.repository';
import { signToken } from '../../common/jwt';
import { createActivityLog } from '../../common/activityLog';

const SALT_ROUNDS = 10;

export const authService = {
  register: async (data: RegisterDto) => {
    const existing = await authRepository.findbyEmail(data.email);
    if (existing) {
      const error: any = new Error('Email already exists');
      error.statusCode = 400;
      throw error;
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await authRepository.create({
      email: data.email,
      passwordHash,
      name: data.name,
    });

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  },

  login: async (data: LoginDto) => {
    const user = await authRepository.findbyEmail(data.email);
    if (!user) {
      await createActivityLog({
        action: 'LOGIN_FAILED',
        metadata: { message: `Login failed - email not found: ${data.email}` },
      });
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      await createActivityLog({
        action: 'LOGIN_FAILED',
        userId: user.id,
        entityType: 'USER',
        entityId: user.id,
        metadata: { message: `Login failed - wrong password for: ${data.email}` },
      });
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const accessToken = signToken({ userId: user.id, email: user.email });
    const { passwordHash: _, ...safeUser } = user;
    return { accessToken, safeUser };
  },

  getProfile: async (userId: string) => {
    const user = await authRepository.findbyId(userId);
    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  },
};
