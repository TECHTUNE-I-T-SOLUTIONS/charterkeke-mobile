import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface NotificationContextType {
  unreadCount: number;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  resetUnreadCount: () => void;
  setUnreadCount: (count: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCountState] = useState(0);

  const incrementUnreadCount = useCallback(() => {
    setUnreadCountState((prev) => prev + 1);
  }, []);

  const decrementUnreadCount = useCallback(() => {
    setUnreadCountState((prev) => (prev > 0 ? prev - 1 : 0));
  }, []);

  const resetUnreadCount = useCallback(() => {
    setUnreadCountState(0);
  }, []);

  const setUnreadCount = useCallback((count: number) => {
    setUnreadCountState(Math.max(0, count));
  }, []);

  const value: NotificationContextType = {
    unreadCount,
    incrementUnreadCount,
    decrementUnreadCount,
    resetUnreadCount,
    setUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationBadge = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationBadge must be used within NotificationProvider');
  }
  return context;
};
