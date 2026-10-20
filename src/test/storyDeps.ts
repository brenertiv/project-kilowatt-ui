/**
 * Every package the story tests load in the browser, pinned in
 * `optimizeDeps.include` for the storybook Vitest project (vite.config.ts).
 *
 * Vite pre-bundles dependencies before the run. One it only meets mid-run (a
 * story that imports a package, or a MUI subpath, the warm cache
 * hasn't seen) makes it re-optimize and reload the page under the running
 * tests. They then fail with "Failed to fetch dynamically imported module",
 * "failed to find the current suite" or a null `useState`, and the next run
 * passes. Pinning the list keeps the pre-bundle complete. `storyDeps.test.ts`
 * fails when `src` imports a package that is missing here.
 */
export const storyDeps = [
  // Storybook and Vitest runtime, loaded by every story file.
  'storybook/test',
  'storybook/preview-api',
  '@storybook/addon-docs',
  '@storybook/addon-docs/blocks',
  'react',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'react-dom',
  'react-dom/client',

  '@amcharts/amcharts5',
  '@amcharts/amcharts5/percent',
  '@amcharts/amcharts5/themes/Animated',
  '@amcharts/amcharts5/xy',
  '@mui/material/Autocomplete',
  '@mui/material/Box',
  '@mui/material/Button',
  '@mui/material/ButtonGroup',
  '@mui/material/Card',
  '@mui/material/CardActionArea',
  '@mui/material/CardActions',
  '@mui/material/CardContent',
  '@mui/material/CardHeader',
  '@mui/material/Checkbox',
  '@mui/material/colors',
  '@mui/material/CssBaseline',
  '@mui/material/Fab',
  '@mui/material/FormControl',
  '@mui/material/FormControlLabel',
  '@mui/material/FormGroup',
  '@mui/material/FormHelperText',
  '@mui/material/FormLabel',
  '@mui/material/Icon',
  '@mui/material/IconButton',
  '@mui/material/InputAdornment',
  '@mui/material/InputLabel',
  '@mui/material/List',
  '@mui/material/ListItem',
  '@mui/material/ListItemText',
  '@mui/material/Menu',
  '@mui/material/MenuItem',
  '@mui/material/Paper',
  '@mui/material/Radio',
  '@mui/material/RadioGroup',
  '@mui/material/Rating',
  '@mui/material/Select',
  '@mui/material/Slider',
  '@mui/material/Stack',
  '@mui/material/styles',
  '@mui/material/Switch',
  '@mui/material/TextField',
  '@mui/material/useMediaQuery',
  '@mui/material/ToggleButton',
  '@mui/material/ToggleButtonGroup',
  '@mui/material/Tooltip',
  '@mui/material/Typography',
  '@tanstack/react-query',
  'axios',
  'i18next',
  'react-i18next',
];
