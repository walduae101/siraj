import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import QuickActions from '../QuickActions';

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock the RTL utilities
jest.mock('../../rtl', () => ({
  getRTLFlexAlign: () => 'justify-end',
  isRTLLocale: () => true,
}));

// Mock the toast system
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
};

jest.mock('~/components/ui/Toast', () => ({
  useToast: () => mockToast,
}));

// Mock fetch
global.fetch = jest.fn();

describe('QuickActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders all action buttons', () => {
    render(<QuickActions />);
    
    expect(screen.getByText('إجراءات سريعة')).toBeInTheDocument();
    expect(screen.getByText('إنشاء محتوى')).toBeInTheDocument();
    expect(screen.getByText('تصدير CSV')).toBeInTheDocument();
    expect(screen.getByText('دعوة عضو')).toBeInTheDocument();
  });

  it('triggers toast when generate action is clicked', async () => {
    const user = userEvent.setup();
    render(<QuickActions />);
    
    const generateButton = screen.getByText('إنشاء محتوى');
    await user.click(generateButton);
    
    expect(mockToast.info).toHaveBeenCalledWith(
      'انتقال إلى مولد المحتوى',
      'سيتم توجيهك إلى صفحة إنشاء المحتوى'
    );
  });

  it('triggers toast when invite action is clicked', async () => {
    const user = userEvent.setup();
    render(<QuickActions />);
    
    const inviteButton = screen.getByText('دعوة عضو');
    await user.click(inviteButton);
    
    expect(mockToast.info).toHaveBeenCalledWith(
      'انتقال إلى دعوة الأعضاء',
      'سيتم توجيهك إلى صفحة دعوة الأعضاء'
    );
  });

  it('handles export success correctly', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    render(<QuickActions />);
    
    const exportButton = screen.getByText('تصدير CSV');
    await user.click(exportButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/export/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(mockToast.success).toHaveBeenCalledWith(
        'تم التصدير ✓',
        'تم تصدير البيانات بنجاح'
      );
    });
  });

  it('handles export error correctly', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    render(<QuickActions />);
    
    const exportButton = screen.getByText('تصدير CSV');
    await user.click(exportButton);
    
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        'فشل في التصدير',
        'حدث خطأ أثناء تصدير البيانات'
      );
    });
  });

  it('handles export network error correctly', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<QuickActions />);
    
    const exportButton = screen.getByText('تصدير CSV');
    await user.click(exportButton);
    
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        'خطأ في التصدير',
        'تحقق من اتصالك بالإنترنت'
      );
    });
  });

  it('shows loading state during export', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
    );

    render(<QuickActions />);
    
    const exportButton = screen.getByText('تصدير CSV');
    await user.click(exportButton);
    
    // Should show loading state
    expect(screen.getByText('تصدير CSV')).toBeDisabled();
  });

  it('calls custom onGenerate callback when provided', async () => {
    const user = userEvent.setup();
    const mockOnGenerate = jest.fn();
    
    render(<QuickActions onGenerate={mockOnGenerate} />);
    
    const generateButton = screen.getByText('إنشاء محتوى');
    await user.click(generateButton);
    
    expect(mockOnGenerate).toHaveBeenCalled();
    expect(mockToast.info).not.toHaveBeenCalled();
  });

  it('calls custom onInvite callback when provided', async () => {
    const user = userEvent.setup();
    const mockOnInvite = jest.fn();
    
    render(<QuickActions onInvite={mockOnInvite} />);
    
    const inviteButton = screen.getByText('دعوة عضو');
    await user.click(inviteButton);
    
    expect(mockOnInvite).toHaveBeenCalled();
    expect(mockToast.info).not.toHaveBeenCalled();
  });

  it('calls custom onExport callback when provided', async () => {
    const user = userEvent.setup();
    const mockOnExport = jest.fn();
    
    render(<QuickActions onExport={mockOnExport} />);
    
    const exportButton = screen.getByText('تصدير CSV');
    await user.click(exportButton);
    
    expect(mockOnExport).toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(<QuickActions />);
    
    const generateButton = screen.getByLabelText('إنشاء محتوى');
    const exportButton = screen.getByLabelText('تصدير CSV');
    const inviteButton = screen.getByLabelText('دعوة عضو');
    
    expect(generateButton).toBeInTheDocument();
    expect(exportButton).toBeInTheDocument();
    expect(inviteButton).toBeInTheDocument();
  });

  it('renders with RTL layout', () => {
    render(<QuickActions />);
    
    const container = screen.getByText('إجراءات سريعة').closest('div');
    expect(container).toHaveClass('justify-end');
  });
});
