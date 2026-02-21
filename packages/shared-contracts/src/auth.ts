export const authContract = {
  endpoints: {
    register: '/register',
    login: '/login',
    logout: '/logout',
    refresh: '/refresh',
    resetPassword: '/reset-password',
    updateUser: (userId: string) => `/update/${encodeURIComponent(userId)}`,
    deleteUser: (userId: string) => `/delete/${encodeURIComponent(userId)}`,
  },
} as const;
