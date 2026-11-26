import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import App from '../App';

describe('App Component Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('초기 화면에 헤더, 입력창, 필터, 빈 상태 메시지가 올바르게 렌더링된다', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: '나의 할 일' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('어떤 일을 할 예정인가요?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '할 일 추가' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '전체' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('아직 할 일이 없어요')).toBeInTheDocument();
  });

  it('새 할 일을 추가하면 목록에 나타나고 입력창이 비워지며 포커스가 유지된다', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByPlaceholderText('어떤 일을 할 예정인가요?');
    await user.type(input, '비타민 챙겨먹기');

    const submitBtn = screen.getByRole('button', { name: '할 일 추가' });
    await user.click(submitBtn);

    expect(screen.getByText('비타민 챙겨먹기')).toBeInTheDocument();
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
  });

  it('한글 IME 조합 중(isComposing === true) Enter 키는 등록되지 않는다', () => {
    render(<App />);

    const input = screen.getByPlaceholderText('어떤 일을 할 예정인가요?');
    fireEvent.change(input, { target: { value: '한글입력' } });

    // isComposing: true 상태의 Enter 이벤트 발송
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });

    // 목록에 등록되지 않고 입력창에 값이 그대로 남아있어야 함
    expect(screen.queryByText('한글입력')).not.toBeInTheDocument();
    expect(input).toHaveValue('한글입력');

    // isComposing: false 상태의 Enter 이벤트 발송 시 정상 등록
    fireEvent.keyDown(input, { key: 'Enter', isComposing: false });
    expect(screen.getByText('한글입력')).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('체크박스 클릭으로 완료 상태를 전환할 수 있다', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByPlaceholderText('어떤 일을 할 예정인가요?');
    await user.type(input, '산책하기{enter}');

    const checkbox = screen.getByRole('checkbox', { name: '산책하기' });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    // 완료 통계 및 진행률 막대 갱신 확인
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('진행률 100%')).toBeInTheDocument();
  });

  it('할 일 내용 수정 및 Esc 키 취소가 올바르게 동작한다', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByPlaceholderText('어떤 일을 할 예정인가요?');
    await user.type(input, '원래 내용{enter}');

    // 수정 버튼 클릭
    const editBtn = screen.getByRole('button', { name: '"원래 내용" 수정' });
    await user.click(editBtn);

    const editInput = screen.getByRole('textbox', { name: '"원래 내용" 수정 입력' });
    expect(editInput).toBeInTheDocument();
    expect(editInput).toHaveFocus();

    // 새 내용 입력 후 Esc 취소
    await user.clear(editInput);
    await user.type(editInput, '변경 시도');
    fireEvent.keyDown(editInput, { key: 'Escape', nativeEvent: { isComposing: false } });

    // 원래 내용으로 복귀
    expect(screen.getByText('원래 내용')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: '"원래 내용" 수정 입력' })).not.toBeInTheDocument();
  });

  it('개별 삭제 및 실행 취소 스낵바 인터랙션이 올바르게 동작한다', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByPlaceholderText('어떤 일을 할 예정인가요?');
    await user.type(input, '삭제할 할 일{enter}');

    const deleteBtn = screen.getByRole('button', { name: '"삭제할 할 일" 삭제' });
    await user.click(deleteBtn);

    expect(screen.queryByText('삭제할 할 일')).not.toBeInTheDocument();

    // 실행 취소 알림 노출 확인
    const undoToast = screen.getByRole('status', { name: '실행 취소 알림' });
    expect(undoToast).toHaveTextContent('할 일을 삭제했어요.');

    const undoBtn = screen.getByRole('button', { name: '"삭제할 할 일" 삭제 실행 취소' });
    await user.click(undoBtn);

    // 다시 복원 확인
    expect(screen.getByText('삭제할 할 일')).toBeInTheDocument();
  });

  it('완료 항목 일괄 삭제 모달 확인 및 취소가 정상 동작한다', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByPlaceholderText('어떤 일을 할 예정인가요?');
    await user.type(input, '완료 대상 항목{enter}');

    const checkbox = screen.getByRole('checkbox', { name: '완료 대상 항목' });
    await user.click(checkbox);

    const clearSummaryBtn = screen.getByRole('button', { name: '완료된 할 일 1개 모두 삭제' });
    expect(clearSummaryBtn).not.toBeDisabled();

    // 모달 열기
    await user.click(clearSummaryBtn);
    expect(screen.getByRole('heading', { name: '완료한 할 일을 삭제할까요?' })).toBeInTheDocument();

    // 취소 버튼 클릭 시 닫히고 항목 유지
    const cancelModalBtn = screen.getByRole('button', { name: '취소' });
    await user.click(cancelModalBtn);
    expect(screen.getByText('완료 대상 항목')).toBeInTheDocument();

    // 다시 모달 열고 삭제 확인
    await user.click(clearSummaryBtn);
    const confirmDeleteBtn = screen.getByRole('button', { name: '1개 삭제' });
    await user.click(confirmDeleteBtn);

    expect(screen.queryByText('완료 대상 항목')).not.toBeInTheDocument();
  });
});
