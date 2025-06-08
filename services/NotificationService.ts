import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import { Task, TaskExecution, ScheduledNotification } from '../types';
import { createDateWithTime } from '../utils/dateUtils';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    try {
      // Check if we're in Expo Go
      const isExpoGo = __DEV__ && !process.env.EAS_BUILD;
      
      if (isExpoGo) {
        Alert.alert(
          '開発環境での制限',
          'Expo Goでは通知機能が制限されています。完全な通知機能を使用するには Development Build が必要です。',
          [{ text: 'OK' }]
        );
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (Platform.OS === 'android' && finalStatus === 'granted') {
        await Notifications.setNotificationChannelAsync('reminder', {
          name: 'Task Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
        });
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      Alert.alert(
        'エラー',
        '通知権限の設定中にエラーが発生しました。Development Buildが必要な可能性があります。'
      );
      return false;
    }
  }

  static async checkPermissionStatus(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Failed to check notification permissions:', error);
      return false;
    }
  }

  static async scheduleInitialNotifications(task: Task): Promise<string[]> {
    try {
      // Check if we're in Expo Go
      const isExpoGo = __DEV__ && !process.env.EAS_BUILD;
      
      if (isExpoGo) {
        console.log('Skipping notification scheduling in Expo Go environment');
        return [];
      }

      const hasPermission = await this.checkPermissionStatus();
      if (!hasPermission) {
        throw new Error('Notification permissions not granted');
      }

      const notificationIds: string[] = [];

      for (const dayOfWeek of task.daysOfWeek) {
        for (const scheduledTime of task.scheduledTimes) {
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: 'タスクリマインダー',
              body: `${task.name}の時間です`,
              data: {
                taskId: task.id,
                type: 'initial',
                scheduledTime,
                dayOfWeek,
              },
            },
            trigger: {
              weekday: dayOfWeek === 0 ? 1 : dayOfWeek + 1, // Expo uses 1-7 for Sun-Sat
              hour: parseInt(scheduledTime.split(':')[0]),
              minute: parseInt(scheduledTime.split(':')[1]),
              repeats: true,
            } as Notifications.NotificationTriggerInput,
          });

          notificationIds.push(notificationId);
        }
      }

      return notificationIds;
    } catch (error) {
      console.error('Failed to schedule initial notifications:', error);
      throw error;
    }
  }

  static async scheduleReminderNotification(
    execution: TaskExecution,
    taskName: string,
    reminderInterval: number
  ): Promise<string> {
    try {
      const hasPermission = await this.checkPermissionStatus();
      if (!hasPermission) {
        throw new Error('Notification permissions not granted');
      }

      const scheduledDateTime = createDateWithTime(execution.date, execution.scheduledTime);
      const reminderTime = new Date(scheduledDateTime.getTime() + reminderInterval * 60 * 1000);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'タスクリマインダー',
          body: `${taskName}がまだ完了していません`,
          data: {
            taskId: execution.taskId,
            executionId: execution.id,
            type: 'reminder',
            reminderCount: execution.reminderCount + 1,
          },
        },
        trigger: {
          date: reminderTime,
        } as Notifications.NotificationTriggerInput,
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule reminder notification:', error);
      throw error;
    }
  }

  static async cancelNotifications(taskId: string): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      const notificationsToCancel = scheduledNotifications.filter(
        notification => notification.content.data?.taskId === taskId
      );

      const cancelPromises = notificationsToCancel.map(notification =>
        Notifications.cancelScheduledNotificationAsync(notification.identifier)
      );

      await Promise.all(cancelPromises);
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
      throw error;
    }
  }

  static async cancelNotificationById(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
      throw error;
    }
  }

  static async sendImmediateNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<string> {
    try {
      // Check if we're in Expo Go
      const isExpoGo = __DEV__ && !process.env.EAS_BUILD;
      
      if (isExpoGo) {
        // Show alert instead of notification in Expo Go
        Alert.alert(title, body);
        return 'expo-go-mock-notification';
      }

      const hasPermission = await this.checkPermissionStatus();
      if (!hasPermission) {
        throw new Error('Notification permissions not granted');
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null, // Send immediately
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to send immediate notification:', error);
      throw error;
    }
  }

  static async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  static addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  static addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }
}