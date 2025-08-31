import type { Meta, StoryObj } from '@storybook/react-vite'
import { Features } from '../Features'

const meta: Meta<typeof Features> = {
  title: 'Marketing/Features',
  component: Features,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Features section showcasing product capabilities with animated cards.'
      }
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithCustomBackground: Story = {
  decorators: [
    (Story) => (
      <div className="bg-gradient-to-br from-violet-900 to-cyan-900 p-8">
        <Story />
      </div>
    )
  ]
}
