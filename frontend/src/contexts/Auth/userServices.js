// contexts/Auth/userServices.js

import { toast } from 'react-toastify';
import {
  updateUserDetails as updateUserService,
  deleteAccount as deleteAccountService,
} from '../../features/Authentication/services/authService';

export const useUserServices = (userRef, setUser, clearSession) => {
  const updateUserDetails = async (userId, userData) => {
    try {
      const response = await updateUserService(userId, userData);
      console.log('Full response from update:', response);

      if (!response.success) {
        console.error('Update failed:', response);
        toast.error(`Failed to update account details: ${response.error}`);
        return { success: false, error: response.error };
      }

      const updatedData = { ...userRef.current, ...response.data };
      console.log('Updated user data after merge:', updatedData);

      setUser(updatedData);
      localStorage.setItem('user', JSON.stringify(updatedData));

      toast.success('Account details updated successfully!');
      return { success: true, data: updatedData };
    } catch (error) {
      console.error('Error updating user details:', error);
      toast.error(`Failed to update account details: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  const deleteAccount = async (userId) => {
    try {
      await deleteAccountService(userId);
      clearSession(false);
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  return {
    updateUserDetails,
    deleteAccount,
  };
};
