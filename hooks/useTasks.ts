import { useState, useEffect, useCallback } from 'react';
import { Task, CreateTaskData, UpdateTaskData } from '../types';
import { TaskService } from '../services/TaskService';
import { NotificationService } from '../services/NotificationService';
import { ErrorHandler, createTaskError } from '../utils/errorHandler';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedTasks = await TaskService.getTasks();
      setTasks(loadedTasks);
    } catch (err) {
      console.error('Error loading tasks:', err);
      const error = createTaskError(
        err instanceof Error ? err.message : 'Failed to load tasks',
        'LOAD',
        { operation: 'loadTasks' }
      );
      setError(error.message);
      ErrorHandler.handleError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (taskData: CreateTaskData): Promise<Task> => {
    try {
      setError(null);
      const newTask = await TaskService.createTask(taskData);
      setTasks(prev => [...prev, newTask]);
      
      // Schedule notifications for the new task
      try {
        await NotificationService.scheduleInitialNotifications(newTask);
      } catch (notificationError) {
        console.error('Failed to schedule notifications for new task:', notificationError);
        // Don't throw error for notification failure - task creation should still succeed
      }
      
      return newTask;
    } catch (err) {
      console.error('Error creating task:', err);
      const error = createTaskError(
        err instanceof Error ? err.message : 'Failed to create task',
        'CREATE',
        { taskData }
      );
      setError(error.message);
      ErrorHandler.handleError(error);
      throw error;
    }
  }, []);

  const updateTask = useCallback(async (id: string, updates: UpdateTaskData): Promise<Task> => {
    try {
      setError(null);
      const updatedTask = await TaskService.updateTask(id, updates);
      setTasks(prev => prev.map(task => task.id === id ? updatedTask : task));
      
      // Reschedule notifications for the updated task
      try {
        await NotificationService.cancelNotifications(id);
        if (updatedTask.isActive) {
          await NotificationService.scheduleInitialNotifications(updatedTask);
        }
      } catch (notificationError) {
        console.error('Failed to reschedule notifications for updated task:', notificationError);
      }
      
      return updatedTask;
    } catch (err) {
      const error = createTaskError(
        err instanceof Error ? err.message : 'Failed to update task',
        'UPDATE',
        { taskId: id, updates }
      );
      setError(error.message);
      ErrorHandler.handleError(error);
      throw error;
    }
  }, []);

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      
      // Cancel notifications before deleting task
      try {
        await NotificationService.cancelNotifications(id);
      } catch (notificationError) {
        console.error('Failed to cancel notifications for deleted task:', notificationError);
      }
      
      await TaskService.deleteTask(id);
      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (err) {
      const error = createTaskError(
        err instanceof Error ? err.message : 'Failed to delete task',
        'DELETE',
        { taskId: id }
      );
      setError(error.message);
      ErrorHandler.handleError(error);
      throw error;
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks: loadTasks,
  };
};