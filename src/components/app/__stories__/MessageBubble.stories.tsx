import type { Meta, StoryObj } from '@storybook/react-vite'
import { MessageBubble } from '../MessageBubble'

const meta: Meta<typeof MessageBubble> = {
  title: 'App/MessageBubble',
  component: MessageBubble,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Chat message bubble for user and assistant messages.'
      }
    }
  },
  argTypes: {
    message: {
      control: 'object',
      description: 'Message object with content, role, and timestamp'
    },
    isLast: {
      control: 'boolean',
      description: 'Whether this is the last message in the conversation'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const UserMessage: Story = {
  args: {
    message: {
      id: '1',
      content: 'مرحباً! كيف يمكنني مساعدتك اليوم؟',
      role: 'user',
      timestamp: new Date('2024-01-20T10:00:00Z')
    },
    isLast: false
  }
}

export const AssistantMessage: Story = {
  args: {
    message: {
      id: '2',
      content: 'أهلاً وسهلاً! أنا هنا لمساعدتك في أي شيء تحتاجه. يمكنني الإجابة على أسئلتك، مساعدتك في البرمجة، أو حتى مجرد الدردشة. ما الذي تود التحدث عنه؟',
      role: 'assistant',
      timestamp: new Date('2024-01-20T10:01:00Z')
    },
    isLast: false
  }
}

export const LongMessage: Story = {
  args: {
    message: {
      id: '3',
      content: `هذا رسالة طويلة جداً لتوضيح كيف تبدو الرسائل الطويلة في الواجهة. يمكن أن تحتوي على الكثير من النص والتفاصيل.

يمكن أن تحتوي أيضاً على أسطر متعددة وفقرات مختلفة.

وأحياناً قد تحتوي على قوائم:
• عنصر واحد
• عنصر آخر
• عنصر ثالث

وأيضاً يمكن أن تحتوي على كود:
\`\`\`javascript
function hello() {
  console.log("مرحباً بالعالم!");
}
\`\`\`

هذا يساعد في اختبار كيفية عرض المحتوى المتنوع في فقاعة الرسالة.`,
      role: 'assistant',
      timestamp: new Date('2024-01-20T10:02:00Z')
    },
    isLast: false
  }
}

export const LoadingMessage: Story = {
  args: {
    message: {
      id: '4',
      content: '',
      role: 'assistant',
      timestamp: new Date('2024-01-20T10:03:00Z')
    },
    isLast: true
  }
}
