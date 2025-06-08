import uuid from 'react-native-uuid';
import { Task, TaskExecution, CreateTaskData, UpdateTaskData } from '../types';
import { StorageService } from './StorageService';
import { getTodayString, getDayOfWeek } from '../utils/dateUtils';

export class TaskService {
  static async createTask(taskData: CreateTaskData): Promise<Task> {
    try {
      const now = new Date();
      const newTask: Task = {
        ...taskData,
        id: uuid.v4() as string,
        createdAt: now,
        updatedAt: now,
      };

      const tasks = await StorageService.loadTasks();
      tasks.push(newTask);
      await StorageService.saveTasks(tasks);

      await this.generateDailyExecutions(getTodayString());

      return newTask;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }

  static async updateTask(id: string, updates: UpdateTaskData): Promise<Task> {
    try {
      const tasks = await StorageService.loadTasks();
      const taskIndex = tasks.findIndex(task => task.id === id);
      
      if (taskIndex === -1) {
        throw new Error('Task not found');
      }

      const updatedTask: Task = {
        ...tasks[taskIndex],
        ...updates,
        updatedAt: new Date(),
      };

      tasks[taskIndex] = updatedTask;
      await StorageService.saveTasks(tasks);

      await this.generateDailyExecutions(getTodayString());

      return updatedTask;
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  }

  static async deleteTask(id: string): Promise<void> {
    try {
      const tasks = await StorageService.loadTasks();
      const filteredTasks = tasks.filter(task => task.id !== id);
      await StorageService.saveTasks(filteredTasks);

      const executions = await StorageService.loadExecutions();
      const filteredExecutions = executions.filter(execution => execution.taskId !== id);
      await StorageService.saveExecutions(filteredExecutions);
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  }

  static async getTasks(): Promise<Task[]> {
    try {
      return await StorageService.loadTasks();
    } catch (error) {
      console.error('Failed to get tasks:', error);
      return [];
    }
  }

  static async getTaskById(id: string): Promise<Task | null> {
    try {
      const tasks = await StorageService.loadTasks();
      return tasks.find(task => task.id === id) || null;
    } catch (error) {
      console.error('Failed to get task by id:', error);
      return null;
    }
  }

  static async generateDailyExecutions(date: string): Promise<TaskExecution[]> {
    try {
      const tasks = await StorageService.loadTasks();
      const activeTasks = tasks.filter(task => task.isActive);
      const dayOfWeek = getDayOfWeek(date);

      const newExecutions: TaskExecution[] = [];

      for (const task of activeTasks) {
        if (task.daysOfWeek.includes(dayOfWeek)) {
          for (const scheduledTime of task.scheduledTimes) {
            const executionId = uuid.v4() as string;
            const execution: TaskExecution = {
              id: executionId,
              taskId: task.id,
              scheduledTime,
              date,
              completedAt: null,
              reminderCount: 0,
              status: 'pending',
            };
            newExecutions.push(execution);
          }
        }
      }

      const existingExecutions = await StorageService.loadExecutions();
      const filteredExistingExecutions = existingExecutions.filter(
        execution => execution.date !== date
      );

      const allExecutions = [...filteredExistingExecutions, ...newExecutions];
      await StorageService.saveExecutions(allExecutions);

      return newExecutions;
    } catch (error) {
      console.error('Failed to generate daily executions:', error);
      throw error;
    }
  }

  static async completeExecution(executionId: string): Promise<void> {
    try {
      const executions = await StorageService.loadExecutions();
      const executionIndex = executions.findIndex(execution => execution.id === executionId);
      
      if (executionIndex === -1) {
        throw new Error('Execution not found');
      }

      executions[executionIndex] = {
        ...executions[executionIndex],
        completedAt: new Date(),
        status: 'completed',
      };

      await StorageService.saveExecutions(executions);
    } catch (error) {
      console.error('Failed to complete execution:', error);
      throw error;
    }
  }

  static async getExecutionsForDate(date: string): Promise<TaskExecution[]> {
    try {
      const executions = await StorageService.loadExecutions();
      return executions.filter(execution => execution.date === date);
    } catch (error) {
      console.error('Failed to get executions for date:', error);
      return [];
    }
  }

  static async getTodayExecutions(): Promise<TaskExecution[]> {
    return this.getExecutionsForDate(getTodayString());
  }

  static async getPendingExecutions(): Promise<TaskExecution[]> {
    try {
      const executions = await StorageService.loadExecutions();
      return executions.filter(execution => execution.status === 'pending');
    } catch (error) {
      console.error('Failed to get pending executions:', error);
      return [];
    }
  }
}