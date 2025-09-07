import type { Meta, StoryObj } from '@storybook/react';
import { PaywallGate } from './PaywallGate';
import { Button } from '~/components/ui/button';

const meta: Meta<typeof PaywallGate> = {
  title: 'Components/PaywallGate',
  component: PaywallGate,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    feature: {
      control: 'select',
      options: ['ai.generate', 'export.csv', 'export.pdf', 'api.calls'],
    },
    plan: {
      control: 'select',
      options: ['pro', 'org'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    feature: 'ai.generate',
    plan: 'pro',
    children: (
      <div className="p-4 border rounded-lg bg-green-50">
        <p className="text-green-800">✅ You have access to this feature!</p>
        <Button className="mt-2">Use Feature</Button>
      </div>
    ),
  },
};

export const ProFeature: Story = {
  args: {
    feature: 'export.pdf',
    plan: 'pro',
    children: (
      <div className="p-4 border rounded-lg bg-green-50">
        <p className="text-green-800">✅ PDF export available!</p>
        <Button className="mt-2">Export PDF</Button>
      </div>
    ),
  },
};

export const OrgFeature: Story = {
  args: {
    feature: 'api.calls',
    plan: 'org',
    children: (
      <div className="p-4 border rounded-lg bg-green-50">
        <p className="text-green-800">✅ API access available!</p>
        <Button className="mt-2">Make API Call</Button>
      </div>
    ),
  },
};

export const WithCustomFallback: Story = {
  args: {
    feature: 'ai.generate',
    plan: 'pro',
    fallback: (
      <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
        <p className="text-gray-500">Custom fallback content</p>
        <Button variant="outline" className="mt-2">Learn More</Button>
      </div>
    ),
    children: (
      <div className="p-4 border rounded-lg bg-green-50">
        <p className="text-green-800">✅ You have access!</p>
      </div>
    ),
  },
};
