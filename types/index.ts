export interface Task {
  id: string;
  name: string;
  scheduledTimes: string[];
  daysOfWeek: number[];
  reminderInterval: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskExecution {
  id: string;
  taskId: string;
  scheduledTime: string;
  date: string;
  completedAt: Date | null;
  reminderCount: number;
  status: 'pending' | 'completed' | 'missed';
}

export interface ScheduledNotification {
  id: string;
  taskId: string;
  executionId: string;
  scheduledTime: Date;
  type: 'initial' | 'reminder';
  isActive: boolean;
}

export interface AppSettings {
  defaultReminderInterval: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  historyRetentionDays: number;
  notificationPriority: 'default' | 'high' | 'max';
}

export type CreateTaskData = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTaskData = Partial<Omit<Task, 'id' | 'createdAt'>>;