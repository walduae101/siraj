import type { Meta, StoryObj } from '@storybook/react';
import { LimitDialog } from './LimitDialog';
import { useState } from 'react';

const meta: Meta<typeof LimitDialog> = {
  title: 'Components/LimitDialog',
  component: LimitDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const LimitDialogWrapper = (args: any) => {
  const [open, setOpen] = useState(true);
  
  return (
    <div>
      <button onClick={() => setOpen(true)} className="px-4 py-2 bg-blue-500 text-white rounded">
        Open Limit Dialog
      </button>
      <LimitDialog {...args} open={open} onOpenChange={setOpen} />
    </div>
  );
};

export const AIGenerationLimit: Story = {
  render: LimitDialogWrapper,
  args: {
    error: {
      feature: 'ai.generate',
      used: 10,
      limit: 10,
      remaining: 0,
      upgradeUrl: '/pricing',
    },
  },
};

export const CSVExportLimit: Story = {
  render: LimitDialogWrapper,
  args: {
    error: {
      feature: 'export.csv',
      used: 5,
      limit: 5,
      remaining: 0,
      upgradeUrl: '/pricing',
    },
  },
};

export const PDFExportLimit: Story = {
  render: LimitDialogWrapper,
  args: {
    error: {
      feature: 'export.pdf',
      used: 2,
      limit: 2,
      remaining: 0,
      upgradeUrl: '/pricing',
    },
  },
};

export const APILimit: Story = {
  render: LimitDialogWrapper,
  args: {
    error: {
      feature: 'api.calls',
      used: 100,
      limit: 100,
      remaining: 0,
      upgradeUrl: '/pricing',
    },
  },
};

export const NearLimit: Story = {
  render: LimitDialogWrapper,
  args: {
    error: {
      feature: 'ai.generate',
      used: 8,
      limit: 10,
      remaining: 2,
      upgradeUrl: '/pricing',
    },
  },
};
