import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { NotificationService } from '../services/NotificationService';
import { Task } from '../types';

export const useNotifications = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkPermissionStatus = useCallback(async () => {
    try {
      const status = await NotificationService.checkPermissionStatus();
      setHasPermission(status);
      return status;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check permission');
      return false;
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const granted = await NotificationService.requestPermissions();
      setHasPermission(granted);
      
      if (!granted) {
        setError('通知の許可が必要です');
      }
      
      return granted;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request permission';
      setError(errorMessage);
      return false;
    }
  }, []);

  const scheduleTaskNotifications = useCallback(async (task: Task): Promise<string[]> => {
    try {
      setError(null);
      
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          throw new Error('Notification permissions not granted');
        }
      }

      const notificationIds = await NotificationService.scheduleInitialNotifications(task);
      return notificationIds;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to schedule notifications';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [hasPermission, requestPermission]);

  const cancelTaskNotifications = useCallback(async (taskId: string): Promise<void> => {
    try {
      setError(null);
      await NotificationService.cancelNotifications(taskId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel notifications';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const sendTestNotification = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          throw new Error('Notification permissions not granted');
        }
      }

      await NotificationService.sendImmediateNotification(
        'テスト通知',
        'アプリが正常に動作しています'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send test notification';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    const initializePermissions = async () => {
      setLoading(true);
      await checkPermissionStatus();
      setLoading(false);
    };

    initializePermissions();
  }, [checkPermissionStatus]);

  return {
    hasPermission,
    loading,
    error,
    requestPermission,
    scheduleTaskNotifications,
    cancelTaskNotifications,
    sendTestNotification,
    checkPermissionStatus,
  };
};