import { useState, useEffect, useMemo, useCallback } from 'react';
import { TodoItem, FilterType, DeletedTaskRecord, StorageStatus } from '../types/todo';
import { loadTodosFromStorage, saveTodosToStorage } from '../lib/storage';

export function useTodos() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deletedRecord, setDeletedRecord] = useState<DeletedTaskRecord | null>(null);
  const [storageStatus, setStorageStatus] = useState<StorageStatus>('idle');
  const [corruptedRaw, setCorruptedRaw] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [filterNotice, setFilterNotice] = useState<string | null>(null);

  // 초기 로컬 스토리지 로드
  useEffect(() => {
    const { tasks, status, rawCorrupted } = loadTodosFromStorage();
    setTodos(tasks);
    setStorageStatus(status);
    if (rawCorrupted) {
      setCorruptedRaw(rawCorrupted);
    }
    setIsInitialized(true);
  }, []);

  // 상태 변경 시 자동 저장 (초기화 완료 후 및 corrupted_read 상태가 아닐 때만 저장)
  useEffect(() => {
    if (!isInitialized) return;
    if (storageStatus === 'corrupted_read') {
      // 데이터 손상 상태에서는 덮어쓰지 않고 보호
      return;
    }
    const status = saveTodosToStorage(todos);
    setStorageStatus(status);
  }, [todos, isInitialized, storageStatus]);

  // 할 일 추가
  const addTodo = useCallback(
    (rawText: string): { success: boolean; error?: string } => {
      const trimmed = rawText.trim();
      if (!trimmed) {
        return { success: false, error: '할 일을 입력해 주세요.' };
      }
      if (trimmed.length > 200) {
        return { success: false, error: '할 일은 최대 200자까지 입력 가능합니다.' };
      }

      const now = new Date().toISOString();
      const newItem: TodoItem = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `todo-${Date.now()}-${Math.random()}`,
        text: trimmed,
        completed: false,
        createdAt: now,
        updatedAt: now,
      };

      setTodos((prev) => [newItem, ...prev]);

      // 현재 필터/검색 조건에 새 항목이 보이는지 확인
      const isVisibleInFilter = filter === 'all' || filter === 'active';
      const isVisibleInSearch =
        !searchQuery.trim() || trimmed.toLowerCase().includes(searchQuery.trim().toLowerCase());

      if (!isVisibleInFilter || !isVisibleInSearch) {
        setFilterNotice('할 일을 추가했어요. 현재 조건에서는 보이지 않습니다.');
      } else {
        setFilterNotice(null);
      }

      return { success: true };
    },
    [filter, searchQuery]
  );

  // 완료 상태 토글
  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              completed: !item.completed,
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
  }, []);

  // 내용 수정
  const updateTodo = useCallback((id: string, rawText: string): { success: boolean; error?: string } => {
    const trimmed = rawText.trim();
    if (!trimmed) {
      return { success: false, error: '수정할 내용을 입력해 주세요.' };
    }
    if (trimmed.length > 200) {
      return { success: false, error: '할 일은 최대 200자까지 입력 가능합니다.' };
    }

    setTodos((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              text: trimmed,
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
    return { success: true };
  }, []);

  // 개별 삭제 (실행 취소 기록 포함)
  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index === -1) return prev;
      const targetItem = prev[index];
      // 실행 취소 레코드 저장 (최신 1건)
      setDeletedRecord({
        item: targetItem,
        originalIndex: index,
      });
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  // 삭제 실행 취소
  const undoDelete = useCallback(() => {
    if (!deletedRecord) return;
    const { item, originalIndex } = deletedRecord;
    setTodos((prev) => {
      // 이미 같은 ID가 있다면 중복 방지
      if (prev.some((t) => t.id === item.id)) return prev;
      const next = [...prev];
      const targetIndex = Math.min(Math.max(0, originalIndex), next.length);
      next.splice(targetIndex, 0, item);
      return next;
    });
    setDeletedRecord(null);
  }, [deletedRecord]);

  // 실행 취소 알림 닫기
  const dismissUndo = useCallback(() => {
    setDeletedRecord(null);
  }, []);

  // 완료 항목 일괄 삭제
  const clearCompleted = useCallback(() => {
    setTodos((prev) => prev.filter((item) => !item.completed));
  }, []);

  // 손상된 로컬스토리지 강제 초기화 및 복구
  const resetCorruptedStorage = useCallback(() => {
    setCorruptedRaw(null);
    setStorageStatus('saved');
    saveTodosToStorage(todos);
  }, [todos]);

  // 검색어 초기화
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // 전체 보기로 전환
  const showAllView = useCallback(() => {
    setFilter('all');
    setSearchQuery('');
    setFilterNotice(null);
  }, []);

  // 필터링 및 검색된 항목 목록
  const filteredTodos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return todos.filter((item) => {
      // 1. 상태 필터
      if (filter === 'active' && item.completed) return false;
      if (filter === 'completed' && !item.completed) return false;

      // 2. 검색어 필터
      if (query && !item.text.toLowerCase().includes(query)) return false;

      return true;
    });
  }, [todos, filter, searchQuery]);

  // 통계 계산
  const totalCount = todos.length;
  const completedCount = useMemo(() => todos.filter((t) => t.completed).length, [todos]);
  const activeCount = totalCount - completedCount;
  const completionRate = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return {
    todos,
    filteredTodos,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    clearSearch,
    addTodo,
    toggleTodo,
    updateTodo,
    deleteTodo,
    undoDelete,
    dismissUndo,
    deletedRecord,
    clearCompleted,
    totalCount,
    completedCount,
    activeCount,
    completionRate,
    storageStatus,
    corruptedRaw,
    resetCorruptedStorage,
    filterNotice,
    setFilterNotice,
    showAllView,
  };
}
