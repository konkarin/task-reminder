import { format, startOfDay, addDays, isSameDay, parseISO } from 'date-fns';

export const formatDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const formatTime = (date: Date): string => {
  return format(date, 'HH:mm');
};

export const getTodayString = (): string => {
  return formatDate(new Date());
};

export const parseTimeString = (timeString: string): { hours: number; minutes: number } => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
};

export const createDateWithTime = (dateString: string, timeString: string): Date => {
  const date = parseISO(dateString);
  const { hours, minutes } = parseTimeString(timeString);
  
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
};

export const isToday = (dateString: string): boolean => {
  return isSameDay(parseISO(dateString), new Date());
};

export const getDayOfWeek = (dateString: string): number => {
  return parseISO(dateString).getDay();
};

export const getNextExecutionDates = (daysOfWeek: number[], startDate?: Date): string[] => {
  const start = startDate || new Date();
  const dates: string[] = [];
  
  for (let i = 0; i < 7; i++) {
    const date = addDays(startOfDay(start), i);
    const dayOfWeek = date.getDay();
    
    if (daysOfWeek.includes(dayOfWeek)) {
      dates.push(formatDate(date));
    }
  }
  
  return dates;
};