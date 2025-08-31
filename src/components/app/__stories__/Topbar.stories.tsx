import type { Meta, StoryObj } from '@storybook/react-vite'
import { Topbar } from '../Topbar'

const meta: Meta<typeof Topbar> = {
  title: 'App/Topbar',
  component: Topbar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Top navigation bar with mobile menu, model selector, and user actions.'
      }
    }
  },
  argTypes: {
    onMenuClick: {
      action: 'menu clicked',
      description: 'Callback when mobile menu is clicked'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onMenuClick: () => {}
  }
}

export const WithDarkTheme: Story = {
  args: {
    onMenuClick: () => {}
  },
  decorators: [
    (Story) => (
      <div className="bg-gray-900">
        <Story />
      </div>
    )
  ]
}
