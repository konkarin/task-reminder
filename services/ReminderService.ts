import { TaskService } from './TaskService';
import { NotificationService } from './NotificationService';
import { TaskExecution } from '../types';
import { getTodayString, createDateWithTime } from '../utils/dateUtils';

export class ReminderService {
  private static reminderIntervals: Map<string, number> = new Map();

  static async startReminderSystem(): Promise<void> {
    try {
      console.log('Starting reminder system...');
      
      // Check for pending reminders every minute
      const interval = setInterval(() => {
        this.checkPendingReminders();
      }, 60000); // Check every minute

      // Store interval for cleanup if needed
      this.reminderIntervals.set('main', interval);
      
      // Initial check
      await this.checkPendingReminders();
      
      console.log('Reminder system started');
    } catch (error) {
      console.error('Failed to start reminder system:', error);
    }
  }

  static async checkPendingReminders(): Promise<void> {
    try {
      const pendingExecutions = await TaskService.getPendingExecutions();
      const tasks = await TaskService.getTasks();
      const now = new Date();

      for (const execution of pendingExecutions) {
        const task = tasks.find(t => t.id === execution.taskId);
        if (!task || !task.isActive) continue;

        const scheduledDateTime = createDateWithTime(execution.date, execution.scheduledTime);
        const timeDiff = now.getTime() - scheduledDateTime.getTime();
        
        // If the scheduled time has passed
        if (timeDiff > 0) {
          const intervalMs = task.reminderInterval * 60 * 1000;
          const remindersSent = Math.floor(timeDiff / intervalMs);
          
          // If it's time for the next reminder
          if (remindersSent > execution.reminderCount) {
            await this.sendReminderNotification(execution, task.name, task.reminderInterval);
            
            // Update reminder count
            await this.updateReminderCount(execution.id, remindersSent);
          }
        }
      }
    } catch (error) {
      console.error('Failed to check pending reminders:', error);
    }
  }

  static async sendReminderNotification(
    execution: TaskExecution,
    taskName: string,
    reminderInterval: number
  ): Promise<void> {
    try {
      await NotificationService.scheduleReminderNotification(
        execution,
        taskName,
        reminderInterval
      );
      
      console.log(`Sent reminder notification for task: ${taskName}`);
    } catch (error) {
      console.error('Failed to send reminder notification:', error);
    }
  }

  static async updateReminderCount(executionId: string, newCount: number): Promise<void> {
    try {
      const { StorageService } = await import('./StorageService');
      const executions = await StorageService.loadExecutions();
      
      const updatedExecutions = executions.map(execution => 
        execution.id === executionId 
          ? { ...execution, reminderCount: newCount }
          : execution
      );
      
      await StorageService.saveExecutions(updatedExecutions);
    } catch (error) {
      console.error('Failed to update reminder count:', error);
    }
  }

  static async stopRemindersForExecution(executionId: string): Promise<void> {
    try {
      // Cancel any scheduled reminders for this execution
      const { StorageService } = await import('./StorageService');
      const executions = await StorageService.loadExecutions();
      
      const execution = executions.find(e => e.id === executionId);
      if (execution) {
        // In a real implementation, we would need to track notification IDs
        // For now, we rely on the execution completion status
        console.log(`Stopped reminders for execution: ${executionId}`);
      }
    } catch (error) {
      console.error('Failed to stop reminders for execution:', error);
    }
  }

  static async scheduleNextDayReminders(): Promise<void> {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = tomorrow.toISOString().split('T')[0];
      
      // Generate executions for tomorrow
      await TaskService.generateDailyExecutions(tomorrowString);
      
      console.log(`Scheduled reminders for ${tomorrowString}`);
    } catch (error) {
      console.error('Failed to schedule next day reminders:', error);
    }
  }

  static stopReminderSystem(): void {
    try {
      // Clear all reminder intervals
      this.reminderIntervals.forEach((interval, key) => {
        clearInterval(interval);
        console.log(`Cleared reminder interval: ${key}`);
      });
      
      this.reminderIntervals.clear();
      console.log('Reminder system stopped');
    } catch (error) {
      console.error('Failed to stop reminder system:', error);
    }
  }

  static async handleMissedTasks(): Promise<void> {
    try {
      const today = getTodayString();
      const executions = await TaskService.getExecutionsForDate(today);
      const now = new Date();
      
      const { StorageService } = await import('./StorageService');
      const updatedExecutions = [...executions];
      let hasUpdates = false;

      for (let i = 0; i < updatedExecutions.length; i++) {
        const execution = updatedExecutions[i];
        
        if (execution.status === 'pending') {
          const scheduledDateTime = createDateWithTime(execution.date, execution.scheduledTime);
          const timeDiff = now.getTime() - scheduledDateTime.getTime();
          
          // If task is more than 2 hours overdue, mark as missed
          if (timeDiff > 2 * 60 * 60 * 1000) {
            updatedExecutions[i] = { ...execution, status: 'missed' };
            hasUpdates = true;
            console.log(`Marked task as missed: ${execution.id}`);
          }
        }
      }

      if (hasUpdates) {
        const allExecutions = await StorageService.loadExecutions();
        const updatedAllExecutions = allExecutions.map(exec => {
          const updated = updatedExecutions.find(u => u.id === exec.id);
          return updated || exec;
        });
        
        await StorageService.saveExecutions(updatedAllExecutions);
      }
    } catch (error) {
      console.error('Failed to handle missed tasks:', error);
    }
  }
}