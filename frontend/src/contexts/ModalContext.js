// ModalContext.js

import React, { createContext, useContext, useState, useCallback } from 'react';
import ConfirmDialog from '../components/modals/ConfirmDialog'; // Adjust the path as needed
import AlertDialog from '../components/modals/AlertDialog'; // Adjust the path as needed

// Create the context
const ModalContext = createContext();

// Custom hook to use the ModalContext
export const useModal = () => {
  return useContext(ModalContext);
};

// Modal Provider Component
export const ModalProvider = ({ children }) => {
  const [modalContent, setModalContent] = useState(null);

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setModalContent({
        type: 'confirm',
        message,
        onConfirm: () => {
          resolve(true);
          setModalContent(null);
        },
        onCancel: () => {
          resolve(false);
          setModalContent(null);
        },
      });
    });
  }, []);

  const alert = useCallback((message) => {
    return new Promise((resolve) => {
      setModalContent({
        type: 'alert',
        message,
        onClose: () => {
          resolve();
          setModalContent(null);
        },
      });
    });
  }, []);

  return (
    <ModalContext.Provider value={{ confirm, alert }}>
      {children}
      {modalContent && <ModalRenderer modal={modalContent} />}
    </ModalContext.Provider>
  );
};

// Modal Renderer Component
const ModalRenderer = ({ modal }) => {
  switch (modal.type) {
    case 'confirm':
      return (
        <ConfirmDialog
          message={modal.message}
          onConfirm={modal.onConfirm}
          onCancel={modal.onCancel}
        />
      );
    case 'alert':
      return <AlertDialog message={modal.message} onClose={modal.onClose} />;
    default:
      return null;
  }
};
