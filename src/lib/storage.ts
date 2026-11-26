import { StorageData, StorageStatus, TodoItem } from '../types/todo';

export const STORAGE_KEY = 'todo-app:v1';
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * TodoItem 유효성 검증
 */
export function isValidTodoItem(item: unknown): item is TodoItem {
  if (!item || typeof item !== 'object') return false;
  const t = item as Record<string, unknown>;
  return (
    typeof t.id === 'string' &&
    t.id.trim().length > 0 &&
    typeof t.text === 'string' &&
    typeof t.completed === 'boolean' &&
    typeof t.createdAt === 'string' &&
    !isNaN(Date.parse(t.createdAt)) &&
    typeof t.updatedAt === 'string' &&
    !isNaN(Date.parse(t.updatedAt))
  );
}

/**
 * StorageData 유효성 검증
 */
export function validateStorageData(data: unknown): { isValid: boolean; data?: StorageData; isUnsupportedVersion?: boolean } {
  if (!data || typeof data !== 'object') {
    return { isValid: false };
  }
  const obj = data as Record<string, unknown>;

  if (typeof obj.schemaVersion !== 'number') {
    return { isValid: false };
  }

  // 상위 스키마 버전 방어
  if (obj.schemaVersion > CURRENT_SCHEMA_VERSION) {
    return { isValid: false, isUnsupportedVersion: true };
  }

  if (!Array.isArray(obj.tasks)) {
    return { isValid: false };
  }

  const validTasks: TodoItem[] = [];
  const idSet = new Set<string>();

  for (const item of obj.tasks) {
    if (!isValidTodoItem(item) || idSet.has(item.id)) {
      return { isValid: false };
    }
    idSet.add(item.id);
    validTasks.push(item);
  }

  return {
    isValid: true,
    data: {
      schemaVersion: obj.schemaVersion,
      tasks: validTasks,
    },
  };
}

/**
 * 로컬스토리지에서 Todo 목록 불러오기
 */
export function loadTodosFromStorage(): { tasks: TodoItem[]; status: StorageStatus; rawCorrupted?: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { tasks: [], status: 'idle' };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // JSON 파싱 실패
      return { tasks: [], status: 'corrupted_read', rawCorrupted: raw };
    }

    const validation = validateStorageData(parsed);
    if (!validation.isValid || !validation.data) {
      // 데이터 구조 결함 또는 미지원 상위 버전
      return { tasks: [], status: 'corrupted_read', rawCorrupted: raw };
    }

    // createdAt 내림차순 정렬 보장
    const sorted = [...validation.data.tasks].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return { tasks: sorted, status: 'saved' };
  } catch {
    // localStorage 접근 제한 또는 보안 에러
    return { tasks: [], status: 'write_error' };
  }
}

/**
 * 로컬스토리지에 Todo 목록 저장
 */
export function saveTodosToStorage(tasks: TodoItem[]): StorageStatus {
  try {
    const data: StorageData = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      tasks,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return 'saved';
  } catch {
    // QuotaExceededException 또는 스토리지 쓰기 제한
    return 'write_error';
  }
}
