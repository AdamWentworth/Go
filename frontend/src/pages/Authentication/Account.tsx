// Account.tsx

import { useState, useRef, FC } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import AccountForm from './FormComponents/AccountForm';
import './Account.css';
import { toast } from 'react-toastify';
import ActionMenu from '../../components/ActionMenu';
import type { FormErrors, AccountFormValues } from '@/types/auth';
import type { AccountFormHandle } from './FormComponents/AccountForm';
import { isApiError } from '../../utils/errors';

const Account: FC = () => {
  const { updateUserDetails, logout, deleteAccount } = useAuth();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [errors, setErrors] = useState<FormErrors>({});
  const formRef = useRef<AccountFormHandle>(null);

  if (!user) {
    return <div>Loading user details...</div>;
  }

  const handleUpdateUserDetails = async (
    userId: string,
    userData: Partial<AccountFormValues>,
    setIsEditable: (edit: boolean) => void
  ): Promise<void> => {
    try {
      const result = await updateUserDetails(userId, userData);
      console.log("Update result:", result);

      if (result.success) {
        console.log('Account details updated successfully!');
        setIsEditable(false);

        if (userData.password && !result.data?.passwordUpdated) {
          toast.info('Password was not updated as it is identical to your previous password.');
        } else if (result.data?.passwordUpdated) {
          toast.success('Account details and password updated successfully!');
        } else {
          toast.success('Account details updated successfully!');
        }
      } else {
        const errorMessage =
          typeof result.error === 'string' ? result.error : '';

        setErrors((prevErrors) => ({
          ...prevErrors,
          username: errorMessage.includes('Username')
            ? 'This username is already taken.'
            : '',
          email: errorMessage.includes('Email')
            ? 'This email is already in use.'
            : '',
          pokemonGoName: errorMessage.includes('Pokémon Go name')
            ? 'This Pokémon Go name is already taken.'
            : '',
          trainerCode: errorMessage.includes('Trainer Code')
            ? 'This Trainer Code is already in use.'
            : '',
        }));
        toast.error('Update failed: ' + errorMessage);
        console.error('Update failed:', errorMessage);

        if (formRef.current) {
          formRef.current.resetForm();
        }
      }
    } catch (error: unknown) {
      let errorMessage = 'An unexpected error occurred while updating your details.';
    
      if (isApiError(error)) {
        errorMessage = error.response.data.message;
      }
    
      toast.error(errorMessage);
      console.error('Unexpected error during update:', error);
    
      if (formRef.current) {
        formRef.current.resetForm();
      }
    }    
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      navigate('/login');
    } catch (error: unknown) {
      console.error('Logout failed:', error);
      toast.error('Failed to logout. Please try again.');
    }
  };

  const handleDeleteAccount = async (): Promise<void> => {
    if (window.confirm("Are you sure you want to delete your account and all its data?")) {
      try {
        await deleteAccount(user.user_id);
        toast.success('Account deleted successfully');
      } catch (error: unknown) {
        let errorMessage = 'Failed to delete account. Please try again.';
      
        if (isApiError(error)) {
          errorMessage = error.response.data.message;
        }
      
        toast.error('Failed to delete account: ' + errorMessage);
        console.error('Delete account failed:', error);
      }      
    } else {
      toast.info('Account deletion canceled');
    }
  };

  return (
    <div className="account-page">
      <AccountForm
        ref={formRef}
        user={user}
        handleUpdateUserDetails={handleUpdateUserDetails}
        onLogout={handleLogout}
        onDeleteAccount={handleDeleteAccount}
        errors={errors}
      />
      <ActionMenu />
    </div>
  );
};

export default Account;
