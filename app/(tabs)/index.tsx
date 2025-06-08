import React, { useEffect, useState } from 'react';
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
  const [completingTasks, setCompletingTasks] = useState<Set<string>>(new Set());

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

  const executionsWithTaskNames: TaskExecutionWithTask[] = executions
    .filter(execution => execution.status === 'pending') // 完了タスクを除外
    .map(execution => ({
      ...execution,
      taskName: tasks.find(task => task.id === execution.taskId)?.name || 'タスク名不明',
    }));

  const handleCompleteTask = async (executionId: string) => {
    try {
      // 完了中のタスクとして追加
      setCompletingTasks(prev => new Set(prev).add(executionId));
      
      // 2秒後にタスクを完了してリストから削除
      setTimeout(async () => {
        await completeExecution(executionId);
        setCompletingTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(executionId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to complete task:', error);
      // エラーの場合は完了中状態をリセット
      setCompletingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(executionId);
        return newSet;
      });
    }
  };

  const renderTaskItem = ({ item }: { item: TaskExecutionWithTask }) => {
    const isCompleting = completingTasks.has(item.id);
    
    return (
      <View style={styles.taskItem}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => handleCompleteTask(item.id)}
          disabled={isCompleting}
        >
          <View style={styles.checkboxCircle}>
            {isCompleting && <View style={styles.checkboxInner} />}
          </View>
        </TouchableOpacity>
        <View style={styles.taskInfo}>
          <Text style={styles.taskName}>{item.taskName}</Text>
          <Text style={styles.taskTime}>{item.scheduledTime}</Text>
        </View>
      </View>
    );
  };

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
      
      {executionsWithTaskNames.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>今日のタスクはありません</Text>
          <Text style={styles.emptySubText}>右上の + ボタンから新しいタスクを作成できます</Text>
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
  list: {
    flex: 1,
  },
  taskItem: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: 15,
  },
  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2196F3',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2196F3',
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});


