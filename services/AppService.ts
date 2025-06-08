import { TaskService } from './TaskService';
import { NotificationService } from './NotificationService';
import { ReminderService } from './ReminderService';
import { getTodayString, formatDate } from '../utils/dateUtils';

export class AppService {
  static async initializeApp(): Promise<void> {
    try {
      console.log('Initializing app...');
      
      // Generate daily executions for today
      await this.generateTodayExecutions();
      
      // Clean up old executions (keep last 30 days)
      await this.cleanupOldExecutions();
      
      // Request notification permissions
      await NotificationService.requestPermissions();
      
      // Start reminder system
      await ReminderService.startReminderSystem();
      
      // Handle missed tasks
      await ReminderService.handleMissedTasks();
      
      console.log('App initialization completed');
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  }

  static async generateTodayExecutions(): Promise<void> {
    try {
      const today = getTodayString();
      console.log(`Generating executions for ${today}`);
      
      // Check if executions already exist for today
      const existingExecutions = await TaskService.getExecutionsForDate(today);
      
      if (existingExecutions.length === 0) {
        // Generate new executions for today
        const newExecutions = await TaskService.generateDailyExecutions(today);
        console.log(`Generated ${newExecutions.length} executions for today`);
        
        // Schedule notifications for today's tasks
        await this.scheduleNotificationsForDate(today);
      } else {
        console.log(`Executions already exist for today (${existingExecutions.length} items)`);
      }
    } catch (error) {
      console.error('Failed to generate today executions:', error);
    }
  }

  static async scheduleNotificationsForDate(date: string): Promise<void> {
    try {
      const executions = await TaskService.getExecutionsForDate(date);
      const tasks = await TaskService.getTasks();
      
      for (const execution of executions) {
        if (execution.status === 'pending') {
          const task = tasks.find(t => t.id === execution.taskId);
          if (task && task.isActive) {
            // Schedule initial notification
            await NotificationService.scheduleInitialNotifications(task);
          }
        }
      }
    } catch (error) {
      console.error('Failed to schedule notifications for date:', error);
    }
  }

  static async cleanupOldExecutions(): Promise<void> {
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      const cutoffDate = formatDate(thirtyDaysAgo);
      console.log(`Cleaning up executions older than ${cutoffDate}`);
      
      const allExecutions = await TaskService.getExecutionsForDate('');
      const recentExecutions = allExecutions.filter(
        execution => execution.date >= cutoffDate
      );
      
      if (recentExecutions.length !== allExecutions.length) {
        const { StorageService } = await import('./StorageService');
        await StorageService.saveExecutions(recentExecutions);
        console.log(`Cleaned up ${allExecutions.length - recentExecutions.length} old executions`);
      }
    } catch (error) {
      console.error('Failed to cleanup old executions:', error);
    }
  }

  static async handleDateChange(): Promise<void> {
    try {
      console.log('Date changed, updating executions...');
      await this.generateTodayExecutions();
    } catch (error) {
      console.error('Failed to handle date change:', error);
    }
  }

  static async rescheduleAllNotifications(): Promise<void> {
    try {
      console.log('Rescheduling all notifications...');
      
      // Cancel all existing notifications
      const tasks = await TaskService.getTasks();
      for (const task of tasks) {
        await NotificationService.cancelNotifications(task.id);
      }
      
      // Reschedule notifications for active tasks
      for (const task of tasks) {
        if (task.isActive) {
          await NotificationService.scheduleInitialNotifications(task);
        }
      }
      
      console.log('All notifications rescheduled');
    } catch (error) {
      console.error('Failed to reschedule notifications:', error);
    }
  }
}