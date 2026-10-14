/**
 * The fixture API in the shape of `react-cosmos/client`, served by the in-app
 * workbench. Fixtures import `react-cosmos/client`; Vite and TypeScript alias
 * that specifier here unless `COSMOS=1` is set, in which case the real package
 * answers and the same fixtures run inside React Cosmos unchanged.
 */
export { useFixtureInput, useFixtureSelect } from '../workbench/inputs';
export { Viewport } from '../workbench/Viewport';
