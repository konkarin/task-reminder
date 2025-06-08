import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function EditTaskScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">タスク編集</ThemedText>
      <Text style={styles.message}>タスク編集機能は開発中です</Text>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
});