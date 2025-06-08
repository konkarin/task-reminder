import { useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { NotificationService } from '../services/NotificationService';
import { TaskService } from '../services/TaskService';
import { ReminderService } from '../services/ReminderService';

export const useNotificationHandler = () => {
  const handleNotificationReceived = useCallback((notification: Notifications.Notification) => {
    console.log('Notification received:', notification);
    
    // Handle foreground notification display
    const { data } = notification.request.content;
    
    if (data?.type === 'reminder') {
      console.log(`Reminder notification for task ${data.taskId}`);
    } else if (data?.type === 'initial') {
      console.log(`Initial notification for task ${data.taskId}`);
    }
  }, []);

  const handleNotificationResponse = useCallback(async (response: Notifications.NotificationResponse) => {
    console.log('Notification response:', response);
    
    const { data } = response.notification.request.content;
    
    try {
      if (data?.taskId) {
        // If user tapped on notification, navigate to the relevant task
        console.log(`User interacted with notification for task ${data.taskId}`);
        
        // In a full implementation, you would navigate to the specific task
        // or show a quick action modal
        
        if (data.type === 'reminder' && data.executionId) {
          // For reminder notifications, optionally mark as completed
          // This would require user confirmation in a real app
          console.log(`Reminder notification tapped for execution ${data.executionId}`);
        }
      }
    } catch (error) {
      console.error('Failed to handle notification response:', error);
    }
  }, []);

  const handleBackgroundNotification = useCallback(async () => {
    try {
      // Check for any missed notifications or state updates
      await ReminderService.checkPendingReminders();
      await ReminderService.handleMissedTasks();
    } catch (error) {
      console.error('Failed to handle background notification:', error);
    }
  }, []);

  useEffect(() => {
    // Set up notification listeners
    const notificationListener = NotificationService.addNotificationReceivedListener(
      handleNotificationReceived
    );

    const responseListener = NotificationService.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    // Handle app state changes for background processing
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // App came to foreground
        handleBackgroundNotification();
      } else if (nextAppState === 'background') {
        // App went to background
        console.log('App went to background');
      }
    };

    // In a real implementation, you would use AppState from 'react-native'
    // AppState.addEventListener('change', handleAppStateChange);

    return () => {
      // Clean up listeners
      notificationListener.remove();
      responseListener.remove();
      
      // AppState.removeEventListener('change', handleAppStateChange);
    };
  }, [handleNotificationReceived, handleNotificationResponse, handleBackgroundNotification]);

  return {
    handleNotificationReceived,
    handleNotificationResponse,
    handleBackgroundNotification,
  };
};