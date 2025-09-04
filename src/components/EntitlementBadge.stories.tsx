import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '~/components/ui/badge';
import { Crown, Users } from 'lucide-react';

const meta: Meta<typeof Badge> = {
  title: 'Components/EntitlementBadge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const FreePlan: Story = {
  render: () => (
    <Badge variant="outline" className="bg-gray-100 text-gray-800">
      Free
    </Badge>
  ),
};

export const ProPlan: Story = {
  render: () => (
    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
      <Crown className="h-3 w-3 mr-1" />
      Pro
    </Badge>
  ),
};

export const OrgPlan: Story = {
  render: () => (
    <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
      <Users className="h-3 w-3 mr-1" />
      Organization
    </Badge>
  ),
};

export const ActiveStatus: Story = {
  render: () => (
    <Badge className="bg-green-100 text-green-800">
      Active
    </Badge>
  ),
};

export const CanceledStatus: Story = {
  render: () => (
    <Badge className="bg-yellow-100 text-yellow-800">
      Canceled
    </Badge>
  ),
};

export const ExpiredStatus: Story = {
  render: () => (
    <Badge className="bg-red-100 text-red-800">
      Expired
    </Badge>
  ),
};
