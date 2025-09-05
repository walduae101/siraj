import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UsageSnapshot from '../UsageSnapshot';

// Mock Framer Motion
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

// Mock analytics
jest.mock('~/lib/analytics', () => ({
  track: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('UsageSnapshot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('renders loading skeleton initially', () => {
    render(<UsageSnapshot />);
    
    expect(screen.getByText('استخدامي')).toBeInTheDocument();
    // Should show skeleton cards while loading
    expect(screen.getAllByText('')).toHaveLength(3); // Skeleton cards
  });

  it('renders usage data with Arabic numerals', async () => {
    render(<UsageSnapshot />);
    
    await waitFor(() => {
      expect(screen.getByText('مولدات الذكاء الاصطناعي')).toBeInTheDocument();
      expect(screen.getByText('استدعاءات API')).toBeInTheDocument();
      expect(screen.getByText('تصدير CSV')).toBeInTheDocument();
    });
  });

  it('shows nudge when usage is nearing limit (< 15% remaining)', async () => {
    // Mock usage data with high usage
    const mockUsageData = {
      plan: 'pro' as const,
      usage: {
        ai: { used: 90, limit: 100 }, // 10 remaining (10% < 15%)
        api: { used: 1000, limit: 5000 },
        csv: { used: 2, limit: 10 },
      },
    };

    // Mock the getUsage function to return high usage data
    jest.doMock('../UsageSnapshot', () => {
      const originalModule = jest.requireActual('../UsageSnapshot');
      return {
        ...originalModule,
        getUsage: jest.fn().mockResolvedValue(mockUsageData),
      };
    });

    render(<UsageSnapshot />);
    
    await waitFor(() => {
      expect(screen.getByText('أوشكت على النفاد')).toBeInTheDocument();
      expect(screen.getByText('اعرف خطط الترقية للحصول على المزيد من الاستخدام')).toBeInTheDocument();
    });
  });

  it('shows upgrade CTA for very high usage (>=90%)', async () => {
    const mockUsageData = {
      plan: 'pro' as const,
      usage: {
        ai: { used: 95, limit: 100 }, // 95% usage
        api: { used: 1000, limit: 5000 },
        csv: { used: 2, limit: 10 },
      },
    };

    jest.doMock('../UsageSnapshot', () => {
      const originalModule = jest.requireActual('../UsageSnapshot');
      return {
        ...originalModule,
        getUsage: jest.fn().mockResolvedValue(mockUsageData),
      };
    });

    render(<UsageSnapshot />);
    
    await waitFor(() => {
      expect(screen.getByText('استخدام عالي')).toBeInTheDocument();
      expect(screen.getByText('أنت تستخدم أكثر من 90% من حدك. فكر في الترقية للحصول على المزيد.')).toBeInTheDocument();
    });
  });

  it('shows error state when data fetch fails', async () => {
    // Mock getUsage to throw an error
    jest.doMock('../UsageSnapshot', () => {
      const originalModule = jest.requireActual('../UsageSnapshot');
      return {
        ...originalModule,
        getUsage: jest.fn().mockRejectedValue(new Error('Network error')),
      };
    });

    render(<UsageSnapshot />);
    
    await waitFor(() => {
      expect(screen.getByText('فشل في تحميل بيانات الاستخدام')).toBeInTheDocument();
      expect(screen.getByText('حاول مرة أخرى')).toBeInTheDocument();
    });
  });

  it('displays plan information correctly', async () => {
    render(<UsageSnapshot />);
    
    await waitFor(() => {
      expect(screen.getByText('احترافي')).toBeInTheDocument();
    });
  });

  it('tracks analytics when nudge is shown', async () => {
    const { track } = require('~/lib/analytics');
    
    // Mock today's date
    const today = new Date().toDateString();
    localStorageMock.getItem.mockReturnValue(null); // No previous nudge today
    
    const mockUsageData = {
      plan: 'pro' as const,
      usage: {
        ai: { used: 90, limit: 100 },
        api: { used: 1000, limit: 5000 },
        csv: { used: 2, limit: 10 },
      },
    };

    jest.doMock('../UsageSnapshot', () => {
      const originalModule = jest.requireActual('../UsageSnapshot');
      return {
        ...originalModule,
        getUsage: jest.fn().mockResolvedValue(mockUsageData),
      };
    });

    render(<UsageSnapshot />);
    
    await waitFor(() => {
      expect(track).toHaveBeenCalledWith('usage.nudge_shown', {
        plan: 'pro',
        usage: mockUsageData.usage,
      });
    });
  });

  it('does not show nudge if already shown today', async () => {
    const today = new Date().toDateString();
    localStorageMock.getItem.mockReturnValue(today); // Already shown today
    
    render(<UsageSnapshot />);
    
    await waitFor(() => {
      expect(screen.queryByText('أوشكت على النفاد')).not.toBeInTheDocument();
    });
  });
});
