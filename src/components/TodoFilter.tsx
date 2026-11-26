import { FilterType } from '../types/todo';
import { SearchIcon, CloseIcon } from './Icons';
import styles from './TodoFilter.module.css';

interface TodoFilterProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  resultCount: number;
  isSearchingOrFiltered: boolean;
}

export function TodoFilter({
  currentFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onClearSearch,
  resultCount,
  isSearchingOrFiltered,
}: TodoFilterProps) {
  const filterOptions: { type: FilterType; label: string }[] = [
    { type: 'all', label: '전체' },
    { type: 'active', label: '진행 중' },
    { type: 'completed', label: '완료' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.controlsRow}>
        {/* 상태 필터 그룹 */}
        <div
          className={styles.filterGroup}
          role="group"
          aria-label="할 일 상태 필터"
        >
          {filterOptions.map(({ type, label }) => {
            const isSelected = currentFilter === type;
            return (
              <button
                key={type}
                type="button"
                className={`${styles.filterButton} ${isSelected ? styles.filterSelected : ''}`}
                onClick={() => onFilterChange(type)}
                aria-pressed={isSelected}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* 검색 입력창 */}
        <div className={styles.searchContainer}>
          <label htmlFor="todo-search-input" className="sr-only">
            할 일 검색
          </label>
          <div className={styles.searchInputWrapper}>
            <SearchIcon className={styles.searchIcon} size={16} />
            <input
              id="todo-search-input"
              type="text"
              className={styles.searchInput}
              placeholder="할 일 검색"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              autoComplete="off"
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.clearSearchButton}
                onClick={onClearSearch}
                aria-label="검색어 초기화"
              >
                <CloseIcon size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 결과 개수 안내 보조 텍스트 */}
      {isSearchingOrFiltered && (
        <div className={styles.resultMeta}>
          <span>조건에 맞는 할 일 {resultCount}개</span>
        </div>
      )}
    </div>
  );
}
