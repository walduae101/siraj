import type { Preview } from '@storybook/react-vite'
import '../src/styles/globals.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    },

    // Add RTL support
    direction: {
      default: 'ltr',
      values: ['ltr', 'rtl']
    }
  },

  // Global decorators
  decorators: [
    (Story, context) => {
      const direction = context.globals.direction || 'ltr'
      return (
        <div dir={direction} lang={direction === 'rtl' ? 'ar' : 'en'}>
          <Story />
        </div>
      )
    }
  ]
};

export default preview;
