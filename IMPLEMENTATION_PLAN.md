# TodoList 웹앱 구현 계획서

## 1. 개요 및 목적
- 순수 프론트엔드 기반(React + TypeScript + Vite)의 반응형 한국어 TodoList 웹앱 구현
- DESIGN.md 명세를 100% 준수하는 디자인 토큰, 컴포넌트, 접근성, 인터랙션 구현
- 백엔드/로그인 없이 브라우저 로컬 저장소(`localStorage`)를 활용한 안정적인 데이터 지속성 보장

## 2. 파일 구조 설계
```text
todo-list/
├── .agents/skills/todo-qa-verification/SKILL.md
├── DESIGN.md
├── IMPLEMENTATION_PLAN.md
├── README.md
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── types/
│   │   └── todo.ts             # TodoItem, FilterType, StorageState 타입 정의
│   ├── styles/
│   │   ├── tokens.css          # DESIGN.md에 정의된 CSS Custom Properties
│   │   └── global.css          # 기본 리셋, 접근성 스타일, 유틸리티
│   ├── lib/
│   │   ├── storage.ts          # localStorage 입출력, 스키마 검증, 에러 핸들링
│   │   └── date.ts             # 로컬 한국어 날짜 포맷팅 유틸
│   ├── hooks/
│   │   └── useTodos.ts         # 할 일 상태 관리(추가, 완료, 수정, 삭제, Undo, 일괄삭제, 검색, 필터)
│   ├── components/
│   │   ├── Header.tsx          # 헤더, 오늘 날짜, 진행률 프로그레스 바
│   │   ├── TodoInput.tsx       # 할 일 추가 폼, 글자수 카운터, IME 조합 제어
│   │   ├── TodoFilter.tsx      # 상태 필터(전체/진행 중/완료) 및 검색창
│   │   ├── TodoList.tsx        # 할 일 항목 목록 컨테이너 및 빈 상태 뷰
│   │   ├── TodoItem.tsx        # 개별 할 일 항목 (체크박스, 인라인 수정, 삭제)
│   │   ├── TodoSummary.tsx     # 하단 잔여 개수, 완료 삭제 버튼, 스토리지 상태 문구
│   │   ├── ConfirmDialog.tsx   # 일괄 삭제 확인 모달 대화상자 (Native dialog + 접근성 포커스)
│   │   └── UndoToast.tsx       # 삭제 실행 취소 스낵바
│   └── test/
│       ├── setup.ts
│       ├── storage.test.ts     # 스토리지 스키마 검증 및 예외 테스트
│       └── useTodos.test.tsx   # 비즈니스 로직 단위 테스트
│       └── App.test.tsx        # 컴포넌트 통합 테스트
└── e2e/
    └── todo.spec.ts            # Playwright 브라우저 E2E 및 반응형 뷰포트 검증
```

## 3. 핵심 세부 구현 기준
1. **IME 조합 방지**:
   - `onKeyDown` 이벤트 시 `e.nativeEvent.isComposing` 확인
2. **200자 제한 및 공백 검사**:
   - `text.trim()`으로 비어있는 경우 안내 표시 및 등록 차단
3. **실행 취소(Undo) 구현**:
   - 삭제된 항목의 index와 TodoItem 객체를 보관하여 원위치로 복원
   - 새 삭제 발생 시 이전 항목 대체 (최신 1건 대상)
4. **일괄 삭제 모달**:
   - `<dialog>` 요소 활용, `showModal()` 호출로 포커스 트랩 및 Esc 닫기
   - 열릴 때 "취소" 버튼에 기본 포커스
5. **접근성(A11y)**:
   - 버튼마다 구체적인 `aria-label` 지정 ("'<할일>' 수정", "'<할일>' 삭제")
   - `aria-pressed`, `aria-live`, `aria-describedby` 적절히 배치
   - 포커스 링 outline: 2px solid var(--color-focus) 및 offset: 3px 유지
6. **로컬스토리지 안정성**:
   - schemaVersion 검증, 유효하지 않은 데이터 파싱 시 기존 원본 보호
   - QuotaExceededException 등 쓰기 실패 시 에러 상태를 UI에 표시하고 인메모리 동작 유지
