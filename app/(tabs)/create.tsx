import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useTasks } from '../../hooks/useTasks';
import { CreateTaskData } from '../../types';
import { useColorScheme } from '@/hooks/useColorScheme';

const DAYS_OF_WEEK = [
  { label: '月', value: 1 },
  { label: '火', value: 2 },
  { label: '水', value: 3 },
  { label: '木', value: 4 },
  { label: '金', value: 5 },
  { label: '土', value: 6 },
  { label: '日', value: 0 },
];

const REMINDER_INTERVALS = [
  { label: '5分', value: 5 },
  { label: '10分', value: 10 },
  { label: '15分', value: 15 },
  { label: '30分', value: 30 },
  { label: '60分', value: 60 },
];

export default function CreateTabScreen() {
  const { createTask } = useTasks();
  const colorScheme = useColorScheme();
  const [taskName, setTaskName] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [scheduledTimes, setScheduledTimes] = useState<string[]>(['08:00']);
  const [reminderInterval, setReminderInterval] = useState(10);
  const [isActive, setIsActive] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const addTime = () => {
    setScheduledTimes(prev => [...prev, '12:00']);
  };

  const removeTime = (index: number) => {
    if (scheduledTimes.length > 1) {
      setScheduledTimes(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateTime = (index: number, time: string) => {
    setScheduledTimes(prev => prev.map((t, i) => i === index ? time : t));
  };

  const showTimePickerForIndex = (index: number) => {
    setEditingTimeIndex(index);
    setShowTimePicker(true);
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime && editingTimeIndex !== null) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      updateTime(editingTimeIndex, timeString);
    }
    setEditingTimeIndex(null);
  };

  const parseTimeString = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const validateForm = (): boolean => {
    if (!taskName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'タスク名を入力してください',
        visibilityTime: 3000,
      });
      return false;
    }
    if (selectedDays.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'やる曜日を選択してください',
        visibilityTime: 3000,
      });
      return false;
    }
    if (scheduledTimes.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'やる時間を設定してください',
        visibilityTime: 3000,
      });
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      setCreating(true);
      const taskData: CreateTaskData = {
        name: taskName.trim(),
        scheduledTimes,
        daysOfWeek: selectedDays,
        reminderInterval,
        isActive,
      };

      await createTask(taskData);
      Toast.show({
        type: 'success',
        text1: 'タスクを作成しました',
        visibilityTime: 2000,
      });
      
      // フォームをリセット
      setTaskName('');
      setSelectedDays([]);
      setScheduledTimes(['08:00']);
      setReminderInterval(10);
      setIsActive(true);
      
      // タスク一覧タブに移動（アニメーション付き）
      setTimeout(() => {
        router.push('/(tabs)/tasks');
      }, 300);
    } catch {
      Toast.show({
        type: 'error',
        text1: 'タスクの作成に失敗しました',
        visibilityTime: 3000,
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={[styles.label, colorScheme === 'dark' && styles.labelDark]}>タスク名</Text>
          <TextInput
            style={styles.textInput}
            value={taskName}
            onChangeText={setTaskName}
            placeholder="例: 朝のお薬を飲む"
            maxLength={50}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, colorScheme === 'dark' && styles.labelDark]}>やる曜日</Text>
          <View style={styles.daysContainer}>
            {DAYS_OF_WEEK.map(day => (
              <TouchableOpacity
                key={day.value}
                style={[
                  styles.dayButton,
                  selectedDays.includes(day.value) && styles.dayButtonSelected
                ]}
                onPress={() => toggleDay(day.value)}
              >
                <Text style={[
                  styles.dayButtonText,
                  selectedDays.includes(day.value) && styles.dayButtonTextSelected
                ]}>
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, colorScheme === 'dark' && styles.labelDark]}>やる時間</Text>
          {scheduledTimes.map((time, index) => (
            <View key={index} style={styles.timeRow}>
              <TouchableOpacity
                style={styles.timeInput}
                onPress={() => showTimePickerForIndex(index)}
              >
                <Text style={styles.timeInputText}>{time}</Text>
              </TouchableOpacity>
              {scheduledTimes.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeTime(index)}
                >
                  <Text style={styles.removeButtonText}>削除</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity style={styles.addButton} onPress={addTime}>
            <Text style={styles.addButtonText}>+ 時間を追加</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, colorScheme === 'dark' && styles.labelDark]}>お知らせ間隔</Text>
          <View style={styles.intervalContainer}>
            {REMINDER_INTERVALS.map(interval => (
              <TouchableOpacity
                key={interval.value}
                style={[
                  styles.intervalButton,
                  reminderInterval === interval.value && styles.intervalButtonSelected
                ]}
                onPress={() => setReminderInterval(interval.value)}
              >
                <Text style={[
                  styles.intervalButtonText,
                  reminderInterval === interval.value && styles.intervalButtonTextSelected
                ]}>
                  {interval.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.switchRow}>
            <Text style={[styles.label, colorScheme === 'dark' && styles.labelDark]}>有効にする</Text>
            <Switch 
              value={isActive} 
              onValueChange={setIsActive}
              trackColor={{ false: '#ccc', true: '#4CAF50' }}
              thumbColor={isActive ? '#fff' : '#f4f3f4'}
              ios_backgroundColor="#ccc"
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.createButton, creating && styles.disabledButton]}
            onPress={handleCreate}
            disabled={creating}
          >
            <Text style={styles.createButtonText}>
              {creating ? '作成中...' : '作成'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {showTimePicker && editingTimeIndex !== null && (
        <DateTimePicker
          value={parseTimeString(scheduledTimes[editingTimeIndex])}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onTimeChange}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  labelDark: {
    color: '#fff',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 6,
    justifyContent: 'space-between',
  },
  dayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
    flex: 1,
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  dayButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  dayButtonTextSelected: {
    color: 'white',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    marginRight: 10,
    justifyContent: 'center',
  },
  timeInputText: {
    fontSize: 16,
    color: '#333',
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f44336',
    borderRadius: 5,
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  addButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
    borderRadius: 5,
    marginTop: 8,
  },
  addButtonText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  intervalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  intervalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  intervalButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  intervalButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  intervalButtonTextSelected: {
    color: 'white',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  createButton: {
    paddingVertical: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});