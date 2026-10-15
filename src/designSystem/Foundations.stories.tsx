import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { useTheme } from 'src/theme/ThemeProvider';
import {
  ColorSection,
  IconsSection,
  LayoutSection,
  PrimitivesSection,
  ShapeSection,
  SpaceSection,
  TypographySection,
} from 'src/designSystem/sections';
import { tokenContrast } from 'src/stories/a11y';

/**
 * The System page's live sections, rendered with the current theme. The
 * Foundations docs pages embed these under their literal token tables; the
 * tables are what agents read, these are what people look at.
 */
const meta = {
  title: 'Internal/Foundations',
  tags: ['!manifest', '!autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <main className="system">
        <Story />
      </main>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function WithTheme({ children }: { children: (theme: ReturnType<typeof useTheme>) => ReactNode }) {
  return children(useTheme());
}

export const Primitives: Story = { render: () => <PrimitivesSection /> };

export const Color: Story = {
  // Contrast off: The contrast table renders the failing token pairs themselves, e.g. warningMain on white and dark-mode text on backgroundPaper. See src/stories/a11y.ts.
  parameters: { a11y: tokenContrast },
  render: () => (
    <WithTheme>{({ lightValues, darkColors }) => <ColorSection lightValues={lightValues} darkColors={darkColors} />}</WithTheme>
  ),
};

export const Typography: Story = {
  render: () => <WithTheme>{({ values }) => <TypographySection values={values} />}</WithTheme>,
};

export const Space: Story = { render: () => <WithTheme>{({ values }) => <SpaceSection values={values} />}</WithTheme> };

export const Shape: Story = { render: () => <WithTheme>{({ values }) => <ShapeSection values={values} />}</WithTheme> };

export const Layout: Story = {
  // Contrast off: secondaryMain on secondaryTint in the grid spans. See src/stories/a11y.ts.
  parameters: { a11y: tokenContrast }, render: () => <LayoutSection /> };

export const Icons: Story = { render: () => <IconsSection /> };
