import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useTodos } from '../hooks/useTodos';

describe('useTodos Hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('초기 상태가 정상적으로 설정되고 빈 목록일 때 진행률이 0%로 계산된다', () => {
    const { result } = renderHook(() => useTodos());
    expect(result.current.todos).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.completedCount).toBe(0);
    expect(result.current.activeCount).toBe(0);
    expect(result.current.completionRate).toBe(0);
    expect(result.current.filter).toBe('all');
    expect(result.current.searchQuery).toBe('');
  });

  describe('할 일 추가 (addTodo)', () => {
    it('공백을 제거하고 정상적으로 새 할 일을 최상단에 추가한다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('첫 번째 할 일');
      });
      act(() => {
        result.current.addTodo('  두 번째 할 일  ');
      });

      expect(result.current.todos.length).toBe(2);
      expect(result.current.todos[0].text).toBe('두 번째 할 일');
      expect(result.current.todos[1].text).toBe('첫 번째 할 일');
      expect(result.current.todos[0].completed).toBe(false);
      expect(result.current.totalCount).toBe(2);
    });

    it('빈 문자열이나 공백만 있는 입력은 등록을 차단하고 에러 메시지를 반환한다', () => {
      const { result } = renderHook(() => useTodos());

      let res1: { success: boolean; error?: string } = { success: false };
      let res2: { success: boolean; error?: string } = { success: false };

      act(() => {
        res1 = result.current.addTodo('');
        res2 = result.current.addTodo('    ');
      });

      expect(res1.success).toBe(false);
      expect(res1.error).toBe('할 일을 입력해 주세요.');
      expect(res2.success).toBe(false);
      expect(result.current.todos.length).toBe(0);
    });

    it('200자를 초과하는 입력은 등록을 차단한다', () => {
      const { result } = renderHook(() => useTodos());
      const longText = 'a'.repeat(201);

      let res: { success: boolean; error?: string } = { success: false };
      act(() => {
        res = result.current.addTodo(longText);
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('할 일은 최대 200자까지 입력 가능합니다.');
      expect(result.current.todos.length).toBe(0);
    });

    it('완료 필터가 적용된 상태에서 새 할 일을 추가하면 숨겨짐 안내 문구가 설정된다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.setFilter('completed');
      });
      act(() => {
        result.current.addTodo('진행 중인 새 할 일');
      });

      expect(result.current.filterNotice).toBe(
        '할 일을 추가했어요. 현재 조건에서는 보이지 않습니다.'
      );
      expect(result.current.filteredTodos.length).toBe(0);

      // 전체 보기 실행 시 필터 초기화 및 안내 제거
      act(() => {
        result.current.showAllView();
      });
      expect(result.current.filter).toBe('all');
      expect(result.current.filterNotice).toBeNull();
      expect(result.current.filteredTodos.length).toBe(1);
    });
  });

  describe('완료 상태 토글 (toggleTodo)', () => {
    it('체크박스 토글 시 완료 상태가 반전되고 진행률이 갱신된다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('할 일 1');
        result.current.addTodo('할 일 2');
      });

      const targetId = result.current.todos[0].id;
      act(() => {
        result.current.toggleTodo(targetId);
      });

      expect(result.current.todos[0].completed).toBe(true);
      expect(result.current.completedCount).toBe(1);
      expect(result.current.activeCount).toBe(1);
      expect(result.current.completionRate).toBe(50);

      // 다시 토글 시 미완료
      act(() => {
        result.current.toggleTodo(targetId);
      });
      expect(result.current.todos[0].completed).toBe(false);
      expect(result.current.completionRate).toBe(0);
    });
  });

  describe('내용 수정 (updateTodo)', () => {
    it('내용을 수정할 수 있으며 createdAt과 completed는 유지된다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('원래 내용');
      });

      const original = result.current.todos[0];
      const origCreatedAt = original.createdAt;

      act(() => {
        result.current.updateTodo(original.id, '  수정된 내용  ');
      });

      const updated = result.current.todos[0];
      expect(updated.text).toBe('수정된 내용');
      expect(updated.createdAt).toBe(origCreatedAt);
      expect(updated.completed).toBe(false);
    });

    it('수정 시 공백 내용 저장은 차단된다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('할 일');
      });

      let res: { success: boolean; error?: string } = { success: false };
      act(() => {
        res = result.current.updateTodo(result.current.todos[0].id, '   ');
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('수정할 내용을 입력해 주세요.');
      expect(result.current.todos[0].text).toBe('할 일');
    });
  });

  describe('개별 삭제 및 실행 취소 (deleteTodo / undoDelete)', () => {
    it('삭제 후 실행 취소 시 원래 데이터와 정렬 위치가 복원된다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('항목 1');
        result.current.addTodo('항목 2');
        result.current.addTodo('항목 3');
      });

      // 현재 목록: ['항목 3', '항목 2', '항목 1']
      const middleItem = result.current.todos[1]; // '항목 2'
      expect(middleItem.text).toBe('항목 2');

      act(() => {
        result.current.deleteTodo(middleItem.id);
      });

      expect(result.current.todos.length).toBe(2);
      expect(result.current.deletedRecord).not.toBeNull();
      expect(result.current.deletedRecord?.item.text).toBe('항목 2');
      expect(result.current.deletedRecord?.originalIndex).toBe(1);

      // 실행 취소
      act(() => {
        result.current.undoDelete();
      });

      expect(result.current.todos.length).toBe(3);
      expect(result.current.todos[1].text).toBe('항목 2');
      expect(result.current.deletedRecord).toBeNull();
    });

    it('빠른 연속 삭제 시 최신 1건만 실행 취소 대상이 된다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('항목 A');
        result.current.addTodo('항목 B');
      });

      const idA = result.current.todos[1].id;
      const idB = result.current.todos[0].id;

      act(() => {
        result.current.deleteTodo(idA);
        result.current.deleteTodo(idB);
      });

      expect(result.current.todos.length).toBe(0);
      expect(result.current.deletedRecord?.item.text).toBe('항목 B');

      act(() => {
        result.current.undoDelete();
      });

      // 최신 항목 B 복원
      expect(result.current.todos.length).toBe(1);
      expect(result.current.todos[0].text).toBe('항목 B');
    });
  });

  describe('필터와 검색 조합', () => {
    it('상태 필터와 검색어가 교집합으로 작동한다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('React 공부하기');
        result.current.addTodo('TypeScript 복습하기');
        result.current.addTodo('방 청소하기');
      });

      // 'React 공부하기' 완료 처리
      const reactId = result.current.todos.find((t) => t.text === 'React 공부하기')!.id;
      act(() => {
        result.current.toggleTodo(reactId);
      });

      // 1. 전체 필터 + 검색어 '공부' -> 2건 (React 공부하기, TypeScript 복습하기는 없음)
      act(() => {
        result.current.setSearchQuery('공부');
      });
      expect(result.current.filteredTodos.length).toBe(1);
      expect(result.current.filteredTodos[0].text).toBe('React 공부하기');

      // 2. 진행 중 필터 + 검색어 '공부' -> 0건 (완료되었으므로)
      act(() => {
        result.current.setFilter('active');
      });
      expect(result.current.filteredTodos.length).toBe(0);

      // 3. 완료 필터 + 검색어 '공부' -> 1건
      act(() => {
        result.current.setFilter('completed');
      });
      expect(result.current.filteredTodos.length).toBe(1);

      // 4. 검색어 초기화
      act(() => {
        result.current.clearSearch();
      });
      expect(result.current.searchQuery).toBe('');
      expect(result.current.filteredTodos.length).toBe(1);
    });
  });

  describe('완료 항목 일괄 삭제 (clearCompleted)', () => {
    it('완료된 모든 항목을 삭제하고 미완료 항목만 남긴다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('남길 항목 1');
        result.current.addTodo('삭제될 항목 1');
        result.current.addTodo('남길 항목 2');
      });

      const delId = result.current.todos[1].id;
      act(() => {
        result.current.toggleTodo(delId);
      });
      expect(result.current.completedCount).toBe(1);

      act(() => {
        result.current.clearCompleted();
      });

      expect(result.current.todos.length).toBe(2);
      expect(result.current.completedCount).toBe(0);
      expect(result.current.todos.some((t) => t.id === delId)).toBe(false);
    });
  });
});
