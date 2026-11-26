import { TodoItem as TodoItemType, FilterType } from '../types/todo';
import { TodoItem } from './TodoItem';
import styles from './TodoList.module.css';

interface TodoListProps {
  todos: TodoItemType[];
  filteredTodos: TodoItemType[];
  filter: FilterType;
  searchQuery: string;
  onToggle: (id: string) => void;
  onUpdate: (id: string, text: string) => { success: boolean; error?: string };
  onDelete: (id: string) => void;
  onClearSearch: () => void;
  onShowAll: () => void;
  onFocusInput: () => void;
}

export function TodoList({
  todos,
  filteredTodos,
  filter,
  searchQuery,
  onToggle,
  onUpdate,
  onDelete,
  onClearSearch,
  onShowAll,
  onFocusInput,
}: TodoListProps) {
  // 1. 전체 할 일이 0개인 경우
  if (todos.length === 0) {
    return (
      <div className={styles.emptyContainer} role="status">
        <p className={styles.emptyTitle}>아직 할 일이 없어요</p>
        <p className={styles.emptyDescription}>오늘 해야 할 일을 등록해 보세요.</p>
        <button
          type="button"
          className={styles.emptyActionButton}
          onClick={onFocusInput}
        >
          첫 할 일을 입력해 보세요.
        </button>
      </div>
    );
  }

  // 2. 검색어가 있고 결과가 0개인 경우
  if (searchQuery.trim().length > 0 && filteredTodos.length === 0) {
    return (
      <div className={styles.emptyContainer} role="status">
        <p className={styles.emptyTitle}>일치하는 할 일이 없어요</p>
        <p className={styles.emptyDescription}>
          검색어 &apos;<strong>{searchQuery}</strong>&apos;에 해당하는 할 일이 없습니다.
        </p>
        <button
          type="button"
          className={styles.emptyActionButton}
          onClick={onClearSearch}
        >
          검색어 초기화
        </button>
      </div>
    );
  }

  // 3. 필터 조건 결과가 0개인 경우
  if (filteredTodos.length === 0) {
    if (filter === 'active') {
      return (
        <div className={styles.emptyContainer} role="status">
          <p className={styles.emptyTitle}>진행 중인 할 일이 없어요</p>
          <p className={styles.emptyDescription}>모든 할 일을 완료했거나 등록된 할 일이 없습니다.</p>
          <button
            type="button"
            className={styles.emptyActionButton}
            onClick={onShowAll}
          >
            전체 보기
          </button>
        </div>
      );
    }

    if (filter === 'completed') {
      return (
        <div className={styles.emptyContainer} role="status">
          <p className={styles.emptyTitle}>아직 완료한 할 일이 없어요</p>
          <p className={styles.emptyDescription}>할 일을 완료하면 이곳에서 확인할 수 있습니다.</p>
          <button
            type="button"
            className={styles.emptyActionButton}
            onClick={onShowAll}
          >
            전체 보기
          </button>
        </div>
      );
    }

    return (
      <div className={styles.emptyContainer} role="status">
        <p className={styles.emptyTitle}>이 조건에 맞는 할 일이 없어요</p>
        <button
          type="button"
          className={styles.emptyActionButton}
          onClick={onShowAll}
        >
          전체 보기
        </button>
      </div>
    );
  }

  // 4. 필터링된 할 일 목록 렌더링
  return (
    <ul className={styles.list} aria-label="할 일 목록">
      {filteredTodos.map((item) => (
        <TodoItem
          key={item.id}
          item={item}
          onToggle={onToggle}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
