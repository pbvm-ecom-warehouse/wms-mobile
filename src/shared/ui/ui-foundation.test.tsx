import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { AppButton } from './app-button';
import { EmptyState } from './empty-state';
import { IconButton } from './icon-button';
import { StatusBadge } from './status-badge';

describe('shared UI foundation', () => {
  it('prevents button activation while loading', () => {
    const onPress = jest.fn();
    const view = render(<AppButton label="Đăng nhập" loading onPress={onPress} />);

    fireEvent.press(view.getByRole('button'));

    expect(onPress).not.toHaveBeenCalled();
    expect(view.getByRole('button').props.accessibilityState).toMatchObject({
      disabled: true,
    });
    expect(view.getByText('Đang xử lý...')).toBeTruthy();
  });

  it('prevents disabled icon button activation', () => {
    const onPress = jest.fn();
    const view = render(
      <IconButton
        accessibilityLabel="Thông báo (sắp có)"
        disabled
        icon={null}
        onPress={onPress}
      />,
    );

    fireEvent.press(view.getByRole('button'));

    expect(onPress).not.toHaveBeenCalled();
    expect(view.getByRole('button').props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });
  it.each([
    ['success', 'Hoàn tất'],
    ['warning', 'Đang xử lý'],
    ['danger', 'Thất bại'],
    ['neutral', 'Đang chờ'],
  ] as const)('renders the %s status variant', (variant, label) => {
    const view = render(<StatusBadge variant={variant} label={label} />);

    expect(view.getByText(label)).toBeTruthy();
  });

  it('exposes the empty-state recovery action', () => {
    const onAction = jest.fn();
    const view = render(
      <EmptyState
        title="Chưa có dữ liệu"
        description="Danh sách sẽ xuất hiện tại đây."
        actionLabel="Thử lại"
        onAction={onAction}
      />,
    );

    fireEvent.press(view.getByRole('button', { name: 'Thử lại' }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
