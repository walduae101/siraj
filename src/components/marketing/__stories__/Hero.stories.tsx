import type { Meta, StoryObj } from "@storybook/react-vite";
import { Hero } from "../Hero";

const meta: Meta<typeof Hero> = {
  title: "Marketing/Hero",
  component: Hero,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithReducedMotion: Story = {
  args: {},
  parameters: {
    prefersReducedMotion: "reduce",
  },
};
