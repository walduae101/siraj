import type { Meta, StoryObj } from "@storybook/react-vite";
import { Composer } from "../Composer";

const meta: Meta<typeof Composer> = {
  title: "App/Composer",
  component: Composer,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    onSendMessage: { action: "message sent" },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};
