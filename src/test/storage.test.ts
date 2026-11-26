import { describe, it, expect, beforeEach } from 'vitest';
import {
  STORAGE_KEY,
  CURRENT_SCHEMA_VERSION,
  isValidTodoItem,
  validateStorageData,
  loadTodosFromStorage,
  saveTodosToStorage,
} from '../lib/storage';
import { TodoItem } from '../types/todo';

describe('Storage Library (lib/storage)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('isValidTodoItem', () => {
    it('유효한 TodoItem 객체를 정상 판별한다', () => {
      const validItem: TodoItem = {
        id: '1',
        text: '테스트 할 일',
        completed: false,
        createdAt: '2026-11-26T00:00:00.000Z',
        updatedAt: '2026-11-26T00:00:00.000Z',
      };
      expect(isValidTodoItem(validItem)).toBe(true);
    });

    it('필수 필드가 누락되거나 타입이 잘못된 객체를 거부한다', () => {
      expect(isValidTodoItem(null)).toBe(false);
      expect(isValidTodoItem({})).toBe(false);
      expect(isValidTodoItem({ id: '', text: '할 일' })).toBe(false);
      expect(isValidTodoItem({ id: '1', text: 123, completed: false })).toBe(false);
      expect(isValidTodoItem({ id: '1', text: '할 일', completed: 'false' })).toBe(false);
      expect(isValidTodoItem({ id: '1', text: '할 일', completed: false, createdAt: 'invalid-date' })).toBe(false);
    });
  });

  describe('validateStorageData', () => {
    it('유효한 스키마 버전과 할 일 목록을 통과시킨다', () => {
      const validData = {
        schemaVersion: 1,
        tasks: [
          {
            id: 'task-1',
            text: '청소하기',
            completed: false,
            createdAt: '2026-11-26T00:00:00.000Z',
            updatedAt: '2026-11-26T00:00:00.000Z',
          },
        ],
      };
      const result = validateStorageData(validData);
      expect(result.isValid).toBe(true);
      expect(result.data?.tasks.length).toBe(1);
    });

    it('현재 버전보다 높은 상위 스키마 버전은 거부하여 덮어쓰기를 방지한다', () => {
      const futureData = {
        schemaVersion: CURRENT_SCHEMA_VERSION + 1,
        tasks: [],
      };
      const result = validateStorageData(futureData);
      expect(result.isValid).toBe(false);
      expect(result.isUnsupportedVersion).toBe(true);
    });

    it('중복된 ID가 포함된 목록은 유효하지 않은 것으로 판별한다', () => {
      const duplicateData = {
        schemaVersion: 1,
        tasks: [
          {
            id: 'task-1',
            text: '할 일 1',
            completed: false,
            createdAt: '2026-11-26T00:00:00.000Z',
            updatedAt: '2026-11-26T00:00:00.000Z',
          },
          {
            id: 'task-1',
            text: '할 일 2',
            completed: true,
            createdAt: '2026-11-26T00:00:00.000Z',
            updatedAt: '2026-11-26T00:00:00.000Z',
          },
        ],
      };
      const result = validateStorageData(duplicateData);
      expect(result.isValid).toBe(false);
    });
  });

  describe('loadTodosFromStorage / saveTodosToStorage', () => {
    it('저장소가 비어있을 때 빈 배열과 idle 상태를 반환한다', () => {
      const { tasks, status } = loadTodosFromStorage();
      expect(tasks).toEqual([]);
      expect(status).toBe('idle');
    });

    it('목록을 저장하고 새로고침(다시 읽기) 시 createdAt 내림차순으로 복원한다', () => {
      const items: TodoItem[] = [
        {
          id: '1',
          text: '어제 등록',
          completed: false,
          createdAt: '2026-11-25T10:00:00.000Z',
          updatedAt: '2026-11-25T10:00:00.000Z',
        },
        {
          id: '2',
          text: '오늘 등록',
          completed: true,
          createdAt: '2026-11-26T10:00:00.000Z',
          updatedAt: '2026-11-26T10:00:00.000Z',
        },
      ];

      const saveStatus = saveTodosToStorage(items);
      expect(saveStatus).toBe('saved');

      const loaded = loadTodosFromStorage();
      expect(loaded.status).toBe('saved');
      expect(loaded.tasks.length).toBe(2);
      // 최신 항목이 맨 위
      expect(loaded.tasks[0].id).toBe('2');
      expect(loaded.tasks[1].id).toBe('1');
    });

    it('손상된 JSON 문자열이 저장소에 있을 때 corrupted_read를 반환하고 원본 데이터를 보존한다', () => {
      const brokenJson = '{ schemaVersion: 1, tasks: broken...';
      localStorage.setItem(STORAGE_KEY, brokenJson);

      const loaded = loadTodosFromStorage();
      expect(loaded.status).toBe('corrupted_read');
      expect(loaded.tasks).toEqual([]);
      expect(loaded.rawCorrupted).toBe(brokenJson);
      // 스토리지에 원본이 그대로 남아있는지 확인
      expect(localStorage.getItem(STORAGE_KEY)).toBe(brokenJson);
    });

    it('스토리지 저장이 실패하는 환경(예외 발생)에서 write_error를 반환한다', () => {
      const origSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error('QuotaExceededError');
      };

      const saveStatus = saveTodosToStorage([]);
      expect(saveStatus).toBe('write_error');

      localStorage.setItem = origSetItem;
    });
  });
});
