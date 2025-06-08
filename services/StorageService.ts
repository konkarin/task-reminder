import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, TaskExecution, AppSettings } from '../types';

const STORAGE_KEYS = {
  TASKS: '@reminder_tasks',
  EXECUTIONS: '@reminder_executions',
  SETTINGS: '@reminder_settings',
} as const;

export class StorageService {
  static async saveTasks(tasks: Task[]): Promise<void> {
    try {
      const serializedTasks = JSON.stringify(tasks, (key, value) => {
        if (key === 'createdAt' || key === 'updatedAt') {
          return value instanceof Date ? value.toISOString() : value;
        }
        return value;
      });
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, serializedTasks);
    } catch (error) {
      console.error('Failed to save tasks:', error);
      throw error;
    }
  }

  static async loadTasks(): Promise<Task[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
      if (!data) {
        return [];
      }
      
      const tasks = JSON.parse(data, (key, value) => {
        if (key === 'createdAt' || key === 'updatedAt') {
          return typeof value === 'string' ? new Date(value) : value;
        }
        return value;
      });
      
      return tasks;
    } catch (error) {
      console.error('Failed to load tasks:', error);
      return [];
    }
  }

  static async saveExecutions(executions: TaskExecution[]): Promise<void> {
    try {
      const serializedExecutions = JSON.stringify(executions, (key, value) => {
        if (key === 'completedAt') {
          return value instanceof Date ? value.toISOString() : value;
        }
        return value;
      });
      await AsyncStorage.setItem(STORAGE_KEYS.EXECUTIONS, serializedExecutions);
    } catch (error) {
      console.error('Failed to save executions:', error);
      throw error;
    }
  }

  static async loadExecutions(dateRange?: { from: string; to: string }): Promise<TaskExecution[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.EXECUTIONS);
      if (!data) return [];
      
      const executions: TaskExecution[] = JSON.parse(data, (key, value) => {
        if (key === 'completedAt') {
          return value ? new Date(value) : null;
        }
        return value;
      });

      if (!dateRange) return executions;

      return executions.filter(execution => {
        return execution.date >= dateRange.from && execution.date <= dateRange.to;
      });
    } catch (error) {
      console.error('Failed to load executions:', error);
      return [];
    }
  }

  static async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  static async loadSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        return {
          defaultReminderInterval: 10,
          soundEnabled: true,
          vibrationEnabled: true,
          historyRetentionDays: 30,
          notificationPriority: 'high',
        };
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      return {
        defaultReminderInterval: 10,
        soundEnabled: true,
        vibrationEnabled: true,
        historyRetentionDays: 30,
        notificationPriority: 'high',
      };
    }
  }

  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TASKS,
        STORAGE_KEYS.EXECUTIONS,
        STORAGE_KEYS.SETTINGS,
      ]);
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw error;
    }
  }
}