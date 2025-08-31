import type { Meta, StoryObj } from '@storybook/react-vite'
import { AnimatedBackground } from '../AnimatedBackground'

const meta: Meta<typeof AnimatedBackground> = {
  title: 'Visuals/AnimatedBackground',
  component: AnimatedBackground,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Animated background with gradient blobs, grid parallax, and twinkles. Respects prefers-reduced-motion.'
      }
    }
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    className: ''
  }
}

export const WithCustomHeight: Story = {
  args: {
    className: 'h-96'
  }
}

export const WithReducedMotion: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Background with reduced motion preferences. Animations should be disabled or simplified.'
      }
    }
  },
  decorators: [
    (Story) => (
      <div style={{ 'prefers-reduced-motion': 'reduce' } as React.CSSProperties}>
        <Story />
      </div>
    )
  ]
}
