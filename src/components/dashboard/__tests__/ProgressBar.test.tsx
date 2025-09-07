import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProgressBar from '../ProgressBar';

// Mock Framer Motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock the RTL utilities
jest.mock('../../rtl', () => ({
  toArabicDigits: (n: number | string) => String(n),
  getRTLTextAlign: () => 'text-right',
  isRTLLocale: () => true,
}));

describe('ProgressBar', () => {
  it('renders with correct ARIA props', () => {
    render(
      <ProgressBar
        value={45}
        max={100}
        label="Test Progress"
        showNumbers={true}
      />
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '45');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    expect(progressBar).toHaveAttribute('aria-label', 'Test Progress');
  });

  it('displays correct values and label', () => {
    render(
      <ProgressBar
        value={75}
        max={100}
        label="Usage"
        showNumbers={true}
      />
    );

    expect(screen.getByText('Usage')).toBeInTheDocument();
    expect(screen.getByText('75 / 100')).toBeInTheDocument();
  });

  it('shows warning for high usage (>=90%)', () => {
    render(
      <ProgressBar
        value={95}
        max={100}
        label="High Usage"
        showNumbers={true}
      />
    );

    expect(screen.getByText('استخدام عالي - فكر في الترقية')).toBeInTheDocument();
  });

  it('hides numbers when showNumbers is false', () => {
    render(
      <ProgressBar
        value={50}
        max={100}
        label="Hidden Numbers"
        showNumbers={false}
      />
    );

    expect(screen.getByText('Hidden Numbers')).toBeInTheDocument();
    expect(screen.queryByText('50 / 100')).not.toBeInTheDocument();
  });

  it('handles zero values correctly', () => {
    render(
      <ProgressBar
        value={0}
        max={100}
        label="Zero Progress"
        showNumbers={true}
      />
    );

    expect(screen.getByText('0 / 100')).toBeInTheDocument();
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  it('handles values exceeding max correctly', () => {
    render(
      <ProgressBar
        value={150}
        max={100}
        label="Over Max"
        showNumbers={true}
      />
    );

    // Should cap at 100%
    expect(screen.getByText('150 / 100')).toBeInTheDocument();
    expect(screen.getByText('استخدام عالي - فكر في الترقية')).toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { rerender } = render(
      <ProgressBar
        value={50}
        max={100}
        size="sm"
        showNumbers={false}
      />
    );

    let progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveClass('h-2');

    rerender(
      <ProgressBar
        value={50}
        max={100}
        size="lg"
        showNumbers={false}
      />
    );

    progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveClass('h-4');
  });

  it('shows different colors based on usage percentage', () => {
    const { rerender } = render(
      <ProgressBar
        value={30}
        max={100}
        showNumbers={false}
      />
    );

    // Low usage should be green
    let progressFill = screen.getByRole('progressbar').querySelector('div');
    expect(progressFill).toHaveClass('bg-green-500');

    // Medium usage should be yellow
    rerender(
      <ProgressBar
        value={80}
        max={100}
        showNumbers={false}
      />
    );

    progressFill = screen.getByRole('progressbar').querySelector('div');
    expect(progressFill).toHaveClass('bg-yellow-500');

    // High usage should be red
    rerender(
      <ProgressBar
        value={95}
        max={100}
        showNumbers={false}
      />
    );

    progressFill = screen.getByRole('progressbar').querySelector('div');
    expect(progressFill).toHaveClass('bg-red-500');
  });
});
