// contextTypes.ts

import type { User } from './auth';
import { ApiResponse } from './common';

export interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  updateUserDetails: (
    userId: string,
    newDetails: Partial<User>
  ) => Promise<ApiResponse<User>>;
  deleteAccount: (userId: string) => Promise<void>;
}