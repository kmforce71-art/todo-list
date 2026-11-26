import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { TodoItem as TodoItemType } from '../types/todo';
import { EditIcon, TrashIcon, CheckIcon } from './Icons';
import styles from './TodoItem.module.css';

interface TodoItemProps {
  item: TodoItemType;
  onToggle: (id: string) => void;
  onUpdate: (id: string, text: string) => { success: boolean; error?: string };
  onDelete: (id: string) => void;
}

export function TodoItem({ item, onToggle, onUpdate, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const editInputRef = useRef<HTMLInputElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);

  // 편집 시작 시 입력창에 포커스
  useEffect(() => {
    if (isEditing) {
      setEditText(item.text);
      setErrorMessage(null);
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [isEditing, item.text]);

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditText(item.text);
    setErrorMessage(null);
    // 편집 취소 후 수정 버튼으로 포커스 복귀
    setTimeout(() => {
      editButtonRef.current?.focus();
    }, 0);
  }, [item.text]);

  const handleSaveEdit = useCallback(() => {
    const trimmed = editText.trim();
    if (!trimmed) {
      setErrorMessage('수정할 내용을 입력해 주세요.');
      editInputRef.current?.focus();
      return;
    }
    if (trimmed.length > 200) {
      setErrorMessage('할 일은 최대 200자까지 입력 가능합니다.');
      editInputRef.current?.focus();
      return;
    }

    const res = onUpdate(item.id, editText);
    if (res.success) {
      setIsEditing(false);
      setErrorMessage(null);
      // 저장 후 수정 버튼으로 포커스 복귀
      setTimeout(() => {
        editButtonRef.current?.focus();
      }, 0);
    } else if (res.error) {
      setErrorMessage(res.error);
      editInputRef.current?.focus();
    }
  }, [editText, item.id, onUpdate]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const checkboxId = `todo-check-${item.id}`;

  return (
    <li className={`${styles.item} ${item.completed ? styles.itemCompleted : ''}`}>
      {isEditing ? (
        // 인라인 수정 모드
        <div className={styles.editContainer}>
          <div className={styles.editInputWrapper}>
            <input
              ref={editInputRef}
              type="text"
              className={`${styles.editInput} ${errorMessage ? styles.editInputError : ''}`}
              value={editText}
              onChange={(e) => {
                const val = e.target.value;
                if (val.length <= 200) {
                  setEditText(val);
                  if (errorMessage && val.trim().length > 0) {
                    setErrorMessage(null);
                  }
                }
              }}
              onKeyDown={handleKeyDown}
              maxLength={200}
              aria-label={`"${item.text}" 수정 입력`}
              aria-invalid={!!errorMessage}
              aria-describedby={errorMessage ? `edit-error-${item.id}` : undefined}
            />
            {errorMessage && (
              <span id={`edit-error-${item.id}`} className={styles.editError} role="alert">
                {errorMessage}
              </span>
            )}
          </div>

          <div className={styles.editActions}>
            <button
              type="button"
              className={styles.saveButton}
              onClick={handleSaveEdit}
              aria-label={`"${item.text}" 저장`}
            >
              저장
            </button>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleCancelEdit}
              aria-label={`"${item.text}" 수정 취소`}
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        // 일반 표시 모드
        <>
          <div className={styles.mainContent}>
            <div className={styles.checkboxWrapper}>
              <input
                id={checkboxId}
                type="checkbox"
                className={styles.nativeCheckbox}
                checked={item.completed}
                onChange={() => onToggle(item.id)}
              />
              <span className={styles.customCheckbox} aria-hidden="true">
                {item.completed && <CheckIcon size={14} />}
              </span>
            </div>

            <label htmlFor={checkboxId} className={styles.textLabel}>
              <span className={`${styles.text} ${item.completed ? styles.textCompleted : ''}`}>
                {item.text}
              </span>
            </label>
          </div>

          <div className={styles.itemActions}>
            <button
              ref={editButtonRef}
              type="button"
              className={styles.actionButton}
              onClick={handleStartEdit}
              aria-label={`"${item.text}" 수정`}
              title="수정"
            >
              <EditIcon size={16} />
            </button>

            <button
              type="button"
              className={`${styles.actionButton} ${styles.deleteButton}`}
              onClick={() => onDelete(item.id)}
              aria-label={`"${item.text}" 삭제`}
              title="삭제"
            >
              <TrashIcon size={16} />
            </button>
          </div>
        </>
      )}
    </li>
  );
}
