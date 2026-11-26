import { useState, useRef, useCallback } from 'react';
import { useTodos } from './hooks/useTodos';
import { Header } from './components/Header';
import { TodoInput } from './components/TodoInput';
import { TodoFilter } from './components/TodoFilter';
import { TodoList } from './components/TodoList';
import { TodoSummary } from './components/TodoSummary';
import { ConfirmDialog } from './components/ConfirmDialog';
import { UndoToast } from './components/UndoToast';
import styles from './App.module.css';

export function App() {
  const {
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
    resetCorruptedStorage,
    filterNotice,
    showAllView,
  } = useTodos();

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const clearButtonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenClearDialog = useCallback(() => {
    setIsConfirmDialogOpen(true);
  }, []);

  const handleCloseClearDialog = useCallback(() => {
    setIsConfirmDialogOpen(false);
  }, []);

  const handleConfirmClearCompleted = useCallback(() => {
    clearCompleted();
    setIsConfirmDialogOpen(false);
  }, [clearCompleted]);

  const handleFocusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const isSearchingOrFiltered = filter !== 'all' || searchQuery.trim().length > 0;

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <Header
          totalCount={totalCount}
          completedCount={completedCount}
          completionRate={completionRate}
        />

        <TodoInput
          onAddTodo={addTodo}
          filterNotice={filterNotice}
          onShowAll={showAllView}
          inputRef={inputRef}
        />

        <TodoFilter
          currentFilter={filter}
          onFilterChange={setFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearSearch={clearSearch}
          resultCount={filteredTodos.length}
          isSearchingOrFiltered={isSearchingOrFiltered}
        />

        <TodoList
          todos={todos}
          filteredTodos={filteredTodos}
          filter={filter}
          searchQuery={searchQuery}
          onToggle={toggleTodo}
          onUpdate={updateTodo}
          onDelete={deleteTodo}
          onClearSearch={clearSearch}
          onShowAll={showAllView}
          onFocusInput={handleFocusInput}
        />

        <TodoSummary
          activeCount={activeCount}
          completedCount={completedCount}
          onOpenClearDialog={handleOpenClearDialog}
          storageStatus={storageStatus}
          onResetCorruptedStorage={resetCorruptedStorage}
          clearButtonRef={clearButtonRef}
        />
      </div>

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        count={completedCount}
        onConfirm={handleConfirmClearCompleted}
        onCancel={handleCloseClearDialog}
        triggerElement={clearButtonRef.current}
      />

      <UndoToast
        deletedRecord={deletedRecord}
        onUndo={undoDelete}
        onDismiss={dismissUndo}
      />
    </main>
  );
}

export default App;
