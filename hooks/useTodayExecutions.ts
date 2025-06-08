import { useState, useEffect, useCallback } from 'react';
import { TaskExecution } from '../types';
import { TaskService } from '../services/TaskService';
import { ReminderService } from '../services/ReminderService';
import { ErrorHandler, createTaskError } from '../utils/errorHandler';

export const useTodayExecutions = () => {
  const [executions, setExecutions] = useState<TaskExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExecutions = useCallback(async () => {
    try {
      setError(null);
      const todayExecutions = await TaskService.getTodayExecutions();
      setExecutions(todayExecutions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load executions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const completeExecution = useCallback(async (executionId: string): Promise<void> => {
    try {
      setError(null);
      await TaskService.completeExecution(executionId);
      
      // Stop reminders for this execution
      await ReminderService.stopRemindersForExecution(executionId);
      
      setExecutions(prev => 
        prev.map(execution => 
          execution.id === executionId 
            ? { ...execution, completedAt: new Date(), status: 'completed' as const }
            : execution
        )
      );
    } catch (err) {
      const error = createTaskError(
        err instanceof Error ? err.message : 'Failed to complete execution',
        'COMPLETE',
        { executionId }
      );
      setError(error.message);
      ErrorHandler.handleError(error);
      throw error;
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadExecutions();
  }, [loadExecutions]);

  useEffect(() => {
    loadExecutions();
  }, [loadExecutions]);

  return {
    executions,
    loading,
    refreshing,
    error,
    completeExecution,
    refresh,
  };
};