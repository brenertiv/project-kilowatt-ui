import { parseFigmaUrl } from '../figma/url';

/**
 * `parameters.design` for a component's stories: its node in the Figma file,
 * shown in Storybook's Design panel. Set it on the meta:
 *
 *   parameters: { design: figmaDesign('https://www.figma.com/design/<key>/<file>?node-id=12-345') }
 *
 * The link is stored in canonical form. A link that is not a Figma node throws
 * when the story file loads, so the story tests catch it.
 */
export function figmaDesign(url: string) {
  const link = parseFigmaUrl(url);
  if (!link) throw new Error(`Not a Figma link: ${url}`);
  if (!link.nodeId) throw new Error(`Link a component's node ("Copy link to selection"), not the whole file: ${url}`);
  return { type: 'figma' as const, url: link.url };
}
