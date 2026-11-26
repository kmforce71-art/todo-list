import { useState, useRef, useCallback, type FormEvent, type KeyboardEvent, type ChangeEvent, type RefObject } from 'react';
import { PlusIcon } from './Icons';
import styles from './TodoInput.module.css';

interface TodoInputProps {
  onAddTodo: (text: string) => { success: boolean; error?: string };
  filterNotice: string | null;
  onShowAll: () => void;
  inputRef?: RefObject<HTMLInputElement>;
}

export function TodoInput({ onAddTodo, filterNotice, onShowAll, inputRef: externalInputRef }: TodoInputProps) {
  const [text, setText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || internalInputRef;

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      if (e) {
        e.preventDefault();
      }
      const trimmed = text.trim();
      if (!trimmed) {
        setErrorMessage('할 일을 입력해 주세요.');
        inputRef.current?.focus();
        return;
      }
      if (trimmed.length > 200) {
        setErrorMessage('할 일은 최대 200자까지 입력 가능합니다.');
        inputRef.current?.focus();
        return;
      }

      const result = onAddTodo(text);
      if (result.success) {
        setText('');
        setErrorMessage(null);
        inputRef.current?.focus();
      } else if (result.error) {
        setErrorMessage(result.error);
        inputRef.current?.focus();
      }
    },
    [text, onAddTodo, inputRef]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // 한글 IME 조합 중 Enter 등록 방지 (다양한 브라우저 및 jsdom 환경 대응)
    const isComposing =
      e.nativeEvent.isComposing ||
      (e as unknown as { isComposing?: boolean }).isComposing ||
      (e.nativeEvent as unknown as { isComposing?: boolean }).isComposing;

    if (isComposing) {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length <= 200) {
      setText(val);
      if (errorMessage && val.trim().length > 0) {
        setErrorMessage(null);
      }
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <label htmlFor="new-todo-input" className={styles.label}>
          새 할 일
        </label>
        <div className={styles.inputRow}>
          <div className={styles.inputWrapper}>
            <input
              id="new-todo-input"
              ref={inputRef}
              type="text"
              className={`${styles.input} ${errorMessage ? styles.inputError : ''}`}
              placeholder="어떤 일을 할 예정인가요?"
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              maxLength={200}
              aria-invalid={!!errorMessage}
              aria-describedby={errorMessage ? 'todo-input-error' : 'todo-char-count'}
              autoComplete="off"
            />
            <span id="todo-char-count" className={styles.charCount}>
              {text.length}/200
            </span>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            aria-label="할 일 추가"
          >
            <PlusIcon size={18} />
            <span>추가</span>
          </button>
        </div>

        {errorMessage && (
          <p id="todo-input-error" className={styles.errorMessage} role="alert">
            {errorMessage}
          </p>
        )}
      </form>

      {filterNotice && (
        <div className={styles.noticeBanner} role="status">
          <span>{filterNotice}</span>
          <button
            type="button"
            className={styles.showAllButton}
            onClick={onShowAll}
          >
            전체 보기
          </button>
        </div>
      )}
    </div>
  );
}
