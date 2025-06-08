import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTodayExecutions } from '../../hooks/useTodayExecutions';
import { useTasks } from '../../hooks/useTasks';
import { useNotifications } from '../../hooks/useNotifications';
import { TaskExecution } from '../../types';

interface TaskExecutionWithTask extends TaskExecution {
  taskName?: string;
}

export default function HomeScreen() {
  const { executions, loading, refreshing, error, completeExecution, refresh } = useTodayExecutions();
  const { tasks } = useTasks();
  const { hasPermission, requestPermission } = useNotifications();

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // 画面がフォーカスされた時にデータを再読み込み
  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  const executionsWithTaskNames: TaskExecutionWithTask[] = executions.map(execution => ({
    ...execution,
    taskName: tasks.find(task => task.id === execution.taskId)?.name || 'Unknown Task',
  }));

  const handleCompleteTask = async (executionId: string) => {
    try {
      await completeExecution(executionId);
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const renderTaskItem = ({ item }: { item: TaskExecutionWithTask }) => (
    <View style={styles.taskItem}>
      <View style={styles.taskInfo}>
        <Text style={styles.taskName}>{item.taskName}</Text>
        <Text style={styles.taskTime}>{item.scheduledTime}</Text>
        <Text style={[styles.taskStatus, item.status === 'completed' && styles.completedStatus]}>
          {item.status === 'completed' ? '✓ 完了' : '未完了'}
        </Text>
      </View>
      {item.status === 'pending' && (
        <TouchableOpacity
          style={styles.completeButton}
          onPress={() => handleCompleteTask(item.id)}
        >
          <Text style={styles.completeButtonText}>完了</Text>
        </TouchableOpacity>
      )}
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
      <ThemedText type="title" style={styles.title}>今日のタスク</ThemedText>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      {executionsWithTaskNames.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>今日のタスクはありません</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/tasks/create')}
          >
            <Text style={styles.createButtonText}>タスクを作成</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={executionsWithTaskNames}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
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
  title: {
    marginBottom: 20,
  },
  list: {
    flex: 1,
  },
  taskItem: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  taskTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  taskStatus: {
    fontSize: 14,
    color: '#666',
  },
  completedStatus: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  completeButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  completeButtonText: {
    color: 'white',
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
  createButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  createButtonText: {
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


