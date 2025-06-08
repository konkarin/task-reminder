import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTasks } from '../../hooks/useTasks';
import { Task } from '../../types';

const DAYS_OF_WEEK_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export default function TasksScreen() {
  const { tasks, loading, error, deleteTask, refreshTasks } = useTasks();

  // 画面がフォーカスされた時にタスクを再読み込み
  useFocusEffect(
    React.useCallback(() => {
      refreshTasks();
    }, [refreshTasks])
  );

  const handleDeleteTask = (task: Task) => {
    Alert.alert(
      '確認',
      `「${task.name}」を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(task.id);
              Toast.show({
                type: 'success',
                text1: 'タスクを削除しました',
                visibilityTime: 2000,
              });
            } catch {
              Toast.show({
                type: 'error',
                text1: 'タスクの削除に失敗しました',
                visibilityTime: 3000,
              });
            }
          },
        },
      ]
    );
  };

  const renderTaskItem = ({ item }: { item: Task }) => (
    <View style={styles.taskItem}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskName}>{item.name}</Text>
        <View style={styles.statusContainer}>
          <Text style={[styles.status, !item.isActive && styles.inactiveStatus]}>
            {item.isActive ? 'アクティブ' : '無効'}
          </Text>
        </View>
      </View>
      
      <View style={styles.taskDetails}>
        <Text style={styles.detailLabel}>やる時間:</Text>
        <Text style={styles.detailValue}>{item.scheduledTimes.sort().join(', ')}</Text>
      </View>
      
      <View style={styles.taskDetails}>
        <Text style={styles.detailLabel}>曜日:</Text>
        <Text style={styles.detailValue}>
          {item.daysOfWeek.sort((a, b) => {
            // 日曜(0)を7として扱い、月曜(1)から昇順にソート
            const dayA = a === 0 ? 7 : a;
            const dayB = b === 0 ? 7 : b;
            return dayA - dayB;
          }).map(day => DAYS_OF_WEEK_LABELS[day]).join(', ')}
        </Text>
      </View>
      
      <View style={styles.taskDetails}>
        <Text style={styles.detailLabel}>お知らせ間隔:</Text>
        <Text style={styles.detailValue}>{item.reminderInterval}分</Text>
      </View>
      
      <View style={styles.taskButtonContainer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push(`/tasks/${item.id}/edit`)}
        >
          <Text style={styles.editButtonText}>編集</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteTask(item)}
        >
          <Text style={styles.deleteButtonText}>削除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">読み込み中...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      {tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>タスクがありません</Text>
          <TouchableOpacity
            style={styles.createFirstButton}
            onPress={() => router.push('/(tabs)/create')}
          >
            <Text style={styles.createFirstButtonText}>最初のタスクを作成</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  list: {
    flex: 1,
  },
  taskItem: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  taskName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  inactiveStatus: {
    color: '#666',
    backgroundColor: '#f0f0f0',
  },
  taskDetails: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  taskButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  editButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  createFirstButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  createFirstButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});