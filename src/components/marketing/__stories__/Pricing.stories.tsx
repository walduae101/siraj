import type { Meta, StoryObj } from '@storybook/react-vite'
import { Pricing } from '../Pricing'

const meta: Meta<typeof Pricing> = {
  title: 'Marketing/Pricing',
  component: Pricing,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Pricing section with three tiers and yearly discount badge.'
      }
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithDarkBackground: Story = {
  decorators: [
    (Story) => (
      <div className="bg-gray-900 p-8">
        <Story />
      </div>
    )
  ]
}
