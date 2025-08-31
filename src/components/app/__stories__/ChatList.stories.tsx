import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChatList } from '../ChatList'

const meta: Meta<typeof ChatList> = {
  title: 'App/ChatList',
  component: ChatList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'List of chat conversations with search and filtering.'
      }
    }
  },
  argTypes: {
    searchQuery: {
      control: 'text',
      description: 'Search query to filter chats'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    searchQuery: ''
  }
}

export const Empty: Story = {
  args: {
    searchQuery: ''
  },
  decorators: [
    (Story) => (
      <div className="h-96">
        <Story />
      </div>
    )
  ]
}

export const WithDarkTheme: Story = {
  args: {
    searchQuery: ''
  },
  decorators: [
    (Story) => (
      <div className="bg-gray-900 h-96">
        <Story />
      </div>
    )
  ]
}
