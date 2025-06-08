import { useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { AppService } from '../services/AppService';
import { ReminderService } from '../services/ReminderService';

export const useRealtimeUpdates = () => {
  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    console.log('App state changed to:', nextAppState);
    
    if (nextAppState === 'active') {
      // App came to foreground
      try {
        // Check if date has changed
        await AppService.handleDateChange();
        
        // Check for pending reminders
        await ReminderService.checkPendingReminders();
        
        // Handle any missed tasks
        await ReminderService.handleMissedTasks();
        
        console.log('App state change handling completed');
      } catch (error) {
        console.error('Failed to handle app state change:', error);
      }
    } else if (nextAppState === 'background') {
      // App went to background
      console.log('App went to background - reminders will continue');
    }
  }, []);

  const handleDateChange = useCallback(async () => {
    try {
      console.log('Date change detected');
      await AppService.handleDateChange();
      await ReminderService.scheduleNextDayReminders();
    } catch (error) {
      console.error('Failed to handle date change:', error);
    }
  }, []);

  const setupDateChangeListener = useCallback(() => {
    let lastDate = new Date().toDateString();
    
    // Check for date change every hour
    const interval = setInterval(() => {
      const now = new Date();
      const today = now.toDateString();
      
      if (lastDate !== today) {
        lastDate = today;
        handleDateChange();
      }
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, [handleDateChange]);

  useEffect(() => {
    // Set up app state listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Set up date change detection
    const cleanupDateListener = setupDateChangeListener();

    return () => {
      subscription?.remove();
      cleanupDateListener();
    };
  }, [handleAppStateChange, setupDateChangeListener]);

  return {
    handleAppStateChange,
    handleDateChange,
  };
};