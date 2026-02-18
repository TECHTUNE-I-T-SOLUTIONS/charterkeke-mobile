import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import AlertDialog, { AlertType } from '@/components/ui/AlertDialog';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  type?: AlertType;
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    options: AlertOptions;
  }>({
    visible: false,
    options: { title: '', type: 'info' },
  });

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertState({
      visible: true,
      options,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const showSuccess = useCallback((title: string, message?: string) => {
    showAlert({
      type: 'success',
      title,
      message,
      buttons: [{ text: 'OK', style: 'default' }],
    });
  }, [showAlert]);

  const showError = useCallback((title: string, message?: string) => {
    showAlert({
      type: 'error',
      title,
      message,
      buttons: [{ text: 'OK', style: 'default' }],
    });
  }, [showAlert]);

  const showWarning = useCallback((title: string, message?: string) => {
    showAlert({
      type: 'warning',
      title,
      message,
      buttons: [{ text: 'OK', style: 'default' }],
    });
  }, [showAlert]);

  const showConfirm = useCallback(
    (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
      showAlert({
        type: 'confirm',
        title,
        message,
        buttons: [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: onCancel,
          },
          {
            text: 'Confirm',
            style: 'default',
            onPress: onConfirm,
          },
        ],
      });
    },
    [showAlert]
  );

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        showSuccess,
        showError,
        showWarning,
        showConfirm,
        hideAlert,
      }}
    >
      {children}
      <AlertDialog
        visible={alertState.visible}
        type={alertState.options.type}
        title={alertState.options.title}
        message={alertState.options.message}
        buttons={alertState.options.buttons}
        onDismiss={hideAlert}
      />
    </AlertContext.Provider>
  );
};
