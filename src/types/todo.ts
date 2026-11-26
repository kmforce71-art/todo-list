/**
 * TodoList 기본 데이터 모델 및 상태 타입
 */

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string; // ISO 8601 문자열
  updatedAt: string; // ISO 8601 문자열
}

export type FilterType = 'all' | 'active' | 'completed';

export interface StorageData {
  schemaVersion: number;
  tasks: TodoItem[];
}

export interface DeletedTaskRecord {
  item: TodoItem;
  originalIndex: number;
}

export type StorageStatus = 'idle' | 'saved' | 'write_error' | 'corrupted_read';
