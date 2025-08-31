import type { Meta, StoryObj } from '@storybook/react-vite'
import { Sidebar } from '../Sidebar'

const meta: Meta<typeof Sidebar> = {
  title: 'App/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Collapsible sidebar with chat list, search, and settings.'
      }
    }
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the sidebar is open'
    },
    onToggle: {
      action: 'toggled',
      description: 'Callback when sidebar is toggled'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    isOpen: true,
    onToggle: () => {}
  }
}

export const Closed: Story = {
  args: {
    isOpen: false,
    onToggle: () => {}
  }
}

export const WithDarkTheme: Story = {
  args: {
    isOpen: true,
    onToggle: () => {}
  },
  decorators: [
    (Story) => (
      <div className="bg-gray-900 h-screen">
        <Story />
      </div>
    )
  ]
}
