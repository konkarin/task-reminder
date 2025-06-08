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
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useTasks } from '../../hooks/useTasks';
import { CreateTaskData } from '../../types';

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

export default function CreateTaskScreen() {
  const { createTask } = useTasks();
  const [taskName, setTaskName] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [scheduledTimes, setScheduledTimes] = useState<string[]>(['08:00']);
  const [reminderInterval, setReminderInterval] = useState(10);
  const [isActive, setIsActive] = useState(true);
  const [creating, setCreating] = useState(false);

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

  const validateForm = (): boolean => {
    if (!taskName.trim()) {
      Alert.alert('エラー', 'タスク名を入力してください');
      return false;
    }
    if (selectedDays.length === 0) {
      Alert.alert('エラー', '実行する曜日を選択してください');
      return false;
    }
    if (scheduledTimes.length === 0) {
      Alert.alert('エラー', '実行時刻を設定してください');
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
      Alert.alert('成功', 'タスクが作成されました', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch {
      Alert.alert('エラー', 'タスクの作成に失敗しました');
    } finally {
      setCreating(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedText type="title" style={styles.title}>新しいタスク</ThemedText>

        <View style={styles.section}>
          <Text style={styles.label}>タスク名</Text>
          <TextInput
            style={styles.textInput}
            value={taskName}
            onChangeText={setTaskName}
            placeholder="例: 朝の薬を飲む"
            maxLength={50}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>実行曜日</Text>
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
          <Text style={styles.label}>実行時刻</Text>
          {scheduledTimes.map((time, index) => (
            <View key={index} style={styles.timeRow}>
              <TextInput
                style={styles.timeInput}
                value={time}
                onChangeText={(text) => updateTime(index, text)}
                placeholder="HH:MM"
                keyboardType="numeric"
              />
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
            <Text style={styles.addButtonText}>+ 時刻を追加</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>リマインド間隔</Text>
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
            <Text style={styles.label}>アクティブ</Text>
            <Switch value={isActive} onValueChange={setIsActive} />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>キャンセル</Text>
          </TouchableOpacity>
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
  title: {
    marginBottom: 20,
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
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
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
    fontSize: 16,
    backgroundColor: 'white',
    marginRight: 10,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 10,
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