import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Slide from '@mui/material/Slide';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useColorScheme, useTheme } from '@mui/material/styles';
import { useContentWidth } from './contentWidth';
import { PageScrollProvider, useElementHeight } from './pageScroll';
import { Icon, type IconName } from '../icons';

/** A page within a section, listed in the section panel. */
export type AppShellPanelItem = {
  /** Identifies the page in `page` and `onPageChange`. */
  id: string;
  /** The page's name. */
  label: string;
  /** The icon before the name. */
  icon: IconName;
  /** A second line under the name, such as the item's type. */
  secondary?: string;
  /** A count at the end of the row, such as open issues. */
  count?: number;
  /** Where the page lives, if it has a URL: the row renders as a link. */
  href?: string;
  /** The page's type, matched against the panel's `filter` options, such as `'report'`. */
  kind?: string;
};

/** A section's panel: its pages, with search. */
export type AppShellPanel = {
  /** The pages, in order. */
  items: AppShellPanelItem[];
  /** Controls under the panel's header, such as a New button. Left out of the phone menu, so put the same action in the page too. */
  actions?: ReactNode;
  /** Content under the list, such as the company name. */
  footer?: ReactNode;
  /** Shows the System, Light and Dark appearance control under the list, as My account does. Default `false`. */
  colorScheme?: boolean;
  /** A filter button in the panel's header that narrows the pages to one `kind`, such as Home's workspace types. `label` names the button and its menu; each option's `value` matches the items' `kind`. */
  filter?: { label: string; options: { value: string; label: string }[] };
  /** One icon button in the panel's header, before its collapse control, for a section-wide action such as Notifications' preferences. Left out of the phone menu, so put the same action in the page too. */
  headerAction?: { label: string; icon: IconName; onClick: () => void };
};

/** A top-level section of the app, shown as an icon in the rail. */
export type AppShellSection = {
  /** Identifies the section in `section` and `onSectionChange`. */
  id: string;
  /** The section's name: its tooltip, its panel's heading and the panel's landmark label. */
  label: string;
  /** Where the section lives, if it has a URL: the rail item renders as a link. */
  href?: string;
  /** A short note read with the label, such as "10 unread". It puts a dot on the icon, or `count` when there is one. */
  badge?: string;
  /** A number on the icon in place of the dot, such as unread notifications. Give `badge` the words for it. */
  count?: number;
  /** Where the section sits in the rail: with the other sections, or at the bottom, as Notifications and My account do. Default `'start'`. */
  placement?: 'start' | 'end';
  /** The section's pages. Leave it out for a section with no pages of its own: it has no panel. */
  panel?: AppShellPanel;
  /** Leaves the section out of the phone menu, for one that's rarely used on a phone. Default `false`. */
  hideOnPhone?: boolean;
  /** A section the account doesn't have but can upgrade to: a plus in the disabled color in place of its icon, its name as its tooltip, no badge and no panel. Choosing it opens its upgrade page through `onSectionChange`. To hide one, leave it out of `sections`. Default `false`. */
  missing?: boolean;
} & (
  | {
      /** The rail icon. */
      icon: IconName;
      initials?: never;
    }
  | {
      /** Initials on an avatar in place of the icon, for the signed-in person's section (My account). */
      initials: string;
      icon?: never;
    }
);

/** A company the person belongs to. */
export type AppShellCompany = {
  /** Identifies the company in `onCompanyChange`. */
  id: string;
  /** The company's name. */
  name: string;
  /** A second line in the switcher, such as the person's role there. */
  detail?: string;
  /** The company's mark, as an image URL, shown on a white tile (marks are drawn for white). Without one, the company's initials stand in. */
  logo?: string;
};

export type AppShellProps = {
  /** The company the person is in: the rail's first button on wide screens, and the company button at the foot of the phone menu. */
  company: AppShellCompany;
  /** Every company the person belongs to, the current one included. The company button opens a menu of them, with the current one checked. Default the current company alone. */
  companies?: AppShellCompany[];
  /** The top-level sections, in rail order, each with its panel. */
  sections: AppShellSection[];
  /** The id of the current section. */
  section: string;
  /** The id of the current page in the current section's panel. */
  page?: string;
  /** Header content at the start, after the panel toggle: the scope button. On phones it fills the header between the menu button and `headerEnd`. */
  headerStart?: ReactNode;
  /** Header content at the end: actions such as Ask Enertiv. On phones there's room for an icon button, not a labelled one. */
  headerEnd?: ReactNode;
  /** A side column at the end, such as the assistant. Shown while `asideOpen`; on phones (below `md`) it opens as a bottom sheet. */
  aside?: ReactNode;
  /** Whether `aside` is shown. Default `false`. */
  asideOpen?: boolean;
  /** At `md` and up, whether the aside is a column beside the page (`true`) or floats over it at the bottom right (`false`), where its header drags it. Put the Dock and Undock control in the aside's own header. Default `true`. */
  asideDocked?: boolean;
  /** The aside column's starting width in pixels, between 280 and 560; the floating aside takes it too. Default `344`. */
  defaultAsideWidth?: number;
  /** Called with the new width after the aside column is resized, so the app can remember it. */
  onAsideWidthChange?: (width: number) => void;
  /** Where the floating aside starts, as its distance from the window's right and bottom edges. Default `null`: the bottom right corner, 16px in. */
  defaultAsidePosition?: AppShellAsidePosition | null;
  /** Called with the floating aside's position after it's dragged, or `null` after a double-click on its header puts it back in the corner, so the app can remember it. */
  onAsidePositionChange?: (position: AppShellAsidePosition | null) => void;
  /** The accessible name of `aside`, such as "Ask Enertiv". Default `'Side panel'`. */
  asideLabel?: string;
  /** Called when the bottom sheet's scrim or Escape closes `aside`. */
  onAsideClose?: () => void;
  /** Leaves the header out on wide screens, for a page with no scope and no page-wide actions. Phones keep theirs, which holds the menu button. Default `false`. */
  hideHeader?: boolean;
  /** Whether the page is still loading. A panel docking from the floating panel keeps its overlay up until this is `false`, so the page behind it never shows mid-load. Default `false`. */
  loading?: boolean;
  /** Whether the section panel starts docked on wide screens. Undocked, it opens over the page while a rail item is hovered. Default `true`. */
  defaultPanelOpen?: boolean;
  /** Called when the section panel docks or undocks on wide screens, so the app can remember it. */
  onPanelOpenChange?: (open: boolean) => void;
  /** The section panel's starting width in pixels, between 220 and 380. Default `256`. */
  defaultPanelWidth?: number;
  /** Called with the new width after the panel is resized, so the app can remember it. */
  onPanelWidthChange?: (width: number) => void;
  /** Called with a section's id when it's chosen in the rail. */
  onSectionChange?: (section: string) => void;
  /** Called with a page's id and its section's id when it's chosen in a panel. The section differs from `section` when the page was chosen from another section's panel. */
  onPageChange?: (page: string, section: string) => void;
  /** Called with a company's id when it's chosen in the company menu. */
  onCompanyChange?: (company: string) => void;
  /** Adds an Add company row at the foot of the company menu, which calls this. Default none: no row. */
  onAddCompany?: () => void;
  /** The page. */
  children: ReactNode;
};

/** The floating aside's place: its distance in pixels from the window's right and bottom edges. */
export type AppShellAsidePosition = { right: number; bottom: number };

const railWidth = 72;
const minPanelWidth = 220;
const maxPanelWidth = 380;
const minAsideWidth = 280;
const maxAsideWidth = 560;
/** The undocked panel is the docked panel's width less this, its 8px inset, so its right edge lands where the docked panel's would. */
const flyoutInset = 8;
/** How long the pointer rests on a rail item before its panel floats: short, so the panel doesn't feel late, but long enough that crossing the rail doesn't open each one. */
const flyoutOpenDelay = 80;
/** How long the undocked panel stays after the pointer leaves the rail and panel, so it survives a diagonal move. */
const flyoutCloseDelay = 200;

const clampWidth = (width: number) => Math.round(Math.min(maxPanelWidth, Math.max(minPanelWidth, width)));
const clampAside = (width: number) => Math.round(Math.min(maxAsideWidth, Math.max(minAsideWidth, width)));

/** Where the docking panel's overlay is, relative to the shell: at the floating panel's place, then the docked slot's. */
type MorphRect = { top: number; left: number; width: number; height: number };
type Morph = {
  id: string;
  from: MorphRect;
  to: MorphRect;
  /** `from`: at the floating panel's place, for one frame. `to`: growing into the docked slot. `grown`: there, holding until the page has loaded, then fading out over the docked panel. */
  phase: 'from' | 'to' | 'grown';
};
const rectIn = (el: Element, root: Element): MorphRect => {
  const a = el.getBoundingClientRect();
  const b = root.getBoundingClientRect();
  return { top: a.top - b.top, left: a.left - b.left, width: a.width, height: a.height };
};

type SectionPanelProps = {
  section: AppShellSection & { panel: AppShellPanel };
  page?: string;
  width: number | string;
  /** The header button: collapse when docked, dock when floating. */
  toggle: { label: string; icon: IconName; onClick: () => void };
  onChoose: (page: string) => void;
};

/** A section's title, header buttons (filter, the panel's action, collapse or dock), actions and pages. Docked or floating over the page. */
function SectionPanel({ section, page, width, toggle, onChoose }: SectionPanelProps) {
  const { panel, label } = section;
  const [kind, setKind] = useState<string | null>(null);
  const [filterButton, setFilterButton] = useState<HTMLElement | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const items = panel.items.filter((item) => kind === null || item.kind === kind);
  const chosen = panel.filter?.options.find((option) => option.value === kind);
  const filterName = panel.filter && (chosen ? `${panel.filter.label}: ${chosen.label}` : panel.filter.label);
  return (
    <Stack component="nav" aria-label={label} sx={{ width, flexShrink: 0, minHeight: 0, height: '100%' }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5, p: 2, pr: 1 }}>
        <Typography variant="h5" component="h2" noWrap sx={{ flex: 1 }}>
          {label}
        </Typography>
        {panel.filter && (
          <>
            <Tooltip title={filterName}>
              <IconButton
                ref={setFilterButton}
                aria-label={filterName}
                aria-haspopup="menu"
                aria-expanded={filterOpen}
                onClick={() => setFilterOpen(true)}
              >
                <Badge variant="dot" color="secondary" invisible={kind === null}>
                  <Icon name="filter_list" />
                </Badge>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={filterButton}
              open={filterOpen}
              onClose={() => setFilterOpen(false)}
              slotProps={{ list: { 'aria-label': panel.filter.label } }}
            >
              {[{ value: null as string | null, label: 'All' }, ...panel.filter.options].map((option) => (
                <MenuItem
                  key={option.value ?? 'all'}
                  role="menuitemradio"
                  aria-checked={kind === option.value}
                  selected={kind === option.value}
                  onClick={() => {
                    setKind(option.value);
                    setFilterOpen(false);
                  }}
                >
                  <ListItemText primary={option.label} />
                  {kind === option.value && <Icon name="check" sx={{ ml: 2 }} />}
                </MenuItem>
              ))}
            </Menu>
          </>
        )}
        {panel.headerAction && (
          <Tooltip title={panel.headerAction.label}>
            <IconButton aria-label={panel.headerAction.label} onClick={panel.headerAction.onClick}>
              <Icon name={panel.headerAction.icon} />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title={toggle.label}>
          <IconButton aria-label={toggle.label} onClick={toggle.onClick}>
            <Icon name={toggle.icon} />
          </IconButton>
        </Tooltip>
      </Stack>
      {panel.actions && <Box sx={{ mx: 2, mb: 2 }}>{panel.actions}</Box>}
      {/* MUI's dense list: tighter rows for a desktop sidebar, with body2 text. */}
      <List dense sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 1, py: 0 }}>
        {items.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={item.id === page}
              aria-current={item.id === page ? 'page' : undefined}
              onClick={() => onChoose(item.id)}
              {...(item.href ? { component: 'a', href: item.href } : {})}
              sx={{ borderRadius: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Icon name={item.icon} />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                secondary={item.secondary}
                slotProps={{ secondary: { variant: 'caption' } }}
              />
              {item.count !== undefined && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {new Intl.NumberFormat().format(item.count)}
                </Typography>
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      {items.length === 0 && (
        <Typography variant="body2" color="text.secondary" role="status" sx={{ px: 2, pb: 2 }}>
          Nothing here is {chosen?.label.toLowerCase()}.
        </Typography>
      )}
      {panel.colorScheme && <ColorSchemeControl />}
      {panel.footer && <Box sx={{ p: 2 }}>{panel.footer}</Box>}
    </Stack>
  );
}

type SearchDialogProps = {
  open: boolean;
  sections: AppShellSection[];
  /** Fills the screen, on phones. */
  fullScreen: boolean;
  onClose: () => void;
  onChoose: (page: string, section: string) => void;
};

/** Searches the pages of every section, from any page: the same dialog on wide screens and phones. */
function SearchDialog({ open, sections, fullScreen, onClose, onChoose }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const titleId = useId();
  const term = query.trim().toLowerCase();
  const results = term
    ? sections.flatMap((section) =>
        (section.panel?.items ?? [])
          .filter((item) => item.label.toLowerCase().includes(term))
          .map((item) => ({ section, item })),
      )
    : [];
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
      aria-labelledby={titleId}
      slotProps={{
        transition: { onExited: () => setQuery('') },
        // Pinned near the top on wide screens, so it doesn't jump as the results change.
        paper: { sx: { overscrollBehavior: 'contain', ...(!fullScreen && { alignSelf: 'flex-start', mt: 10 }) } },
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, p: 1, pl: 3 }}>
        <Typography id={titleId} variant="h5" component="h2" sx={{ flex: 1 }}>
          Search
        </Typography>
        <IconButton aria-label="Close search" onClick={onClose}>
          <Icon name="close" />
        </IconButton>
      </Stack>
      <Box sx={{ px: 3, pb: 1 }}>
        <TextField
          autoFocus
          fullWidth
          label="Search pages"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Icon name="search" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>
      <Typography role="status" variant="body2" color="text.secondary" sx={{ px: 3, py: 1 }}>
        {!term
          ? 'Find a page in any section.'
          : results.length === 0
            ? `No pages match “${query.trim()}”.`
            : new Intl.PluralRules().select(results.length) === 'one'
              ? '1 page'
              : `${new Intl.NumberFormat().format(results.length)} pages`}
      </Typography>
      <List aria-label="Results" sx={{ minHeight: 0, overflowY: 'auto', px: 1, pt: 0, pb: 2 }}>
        {results.map(({ section, item }) => (
          <ListItem key={`${section.id}:${item.id}`} disablePadding>
            <ListItemButton
              onClick={() => onChoose(item.id, section.id)}
              {...(item.href ? { component: 'a', href: item.href } : {})}
              sx={{ borderRadius: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Icon name={item.icon} />
              </ListItemIcon>
              <ListItemText primary={item.label} secondary={section.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Dialog>
  );
}

// Text only, so the three fit the panel at its narrowest (220px).
const schemes = [
  { value: 'system', label: 'System', icon: 'desktop_windows' },
  { value: 'light', label: 'Light', icon: 'light_mode' },
  { value: 'dark', label: 'Dark', icon: 'dark_mode' },
] as const;

/** System, Light or Dark, through MUI's color scheme: icons with their names in tooltips. */
function ColorSchemeControl() {
  const { mode, setMode } = useColorScheme();
  const labelId = useId();
  return (
    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, p: 2 }}>
      <Typography id={labelId} variant="body2" color="text.secondary">
        Appearance
      </Typography>
      <ToggleButtonGroup
        value={mode ?? 'system'}
        exclusive
        aria-labelledby={labelId}
        onChange={(_, value: (typeof schemes)[number]['value'] | null) => value && setMode(value)}
      >
        {schemes.map((scheme) => (
          <Tooltip key={scheme.value} title={scheme.label}>
            <ToggleButton value={scheme.value} aria-label={scheme.label}>
              <Icon name={scheme.icon} />
            </ToggleButton>
          </Tooltip>
        ))}
      </ToggleButtonGroup>
    </Stack>
  );
}

const hasPanel = (section?: AppShellSection): section is AppShellSection & { panel: AppShellPanel } =>
  Boolean(section?.panel);

/** Jumps past the navigation to the page; shown only while focused. */
const skipLink = (
  <Button
    href="#main"
    variant="contained"
    sx={{
      position: 'fixed',
      top: (t) => t.spacing(1),
      left: (t) => t.spacing(1),
      zIndex: 'tooltip',
      transform: 'translateY(-200%)',
      '&:focus-visible': { transform: 'none' },
    }}
  >
    Skip to Content
  </Button>
);

/** A section's avatar or icon. */
function SectionGlyph({ section }: { section: AppShellSection }) {
  return section.initials !== undefined ? (
    <Avatar
      sx={{ width: 32, height: 32, bgcolor: 'primary.main', color: 'primary.contrastText', typography: 'caption' }}
    >
      {section.initials}
    </Avatar>
  ) : section.missing ? (
    // A section the account doesn't have: one circled plus in the disabled color, quieter than the sections it has.
    <Icon name="add_circle" sx={{ color: 'text.disabled' }} />
  ) : (
    <Icon name={section.icon} />
  );
}

/** The side column as a bottom sheet, on phones. */
function AsideSheet({
  open,
  label,
  onClose,
  children,
}: {
  open: boolean;
  label: string;
  onClose?: () => void;
  children: ReactNode;
}) {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          'aria-label': label,
          sx: {
            height: '80dvh',
            borderRadius: 'calc(2 * var(--mui-shape-borderRadius)) calc(2 * var(--mui-shape-borderRadius)) 0 0',
            // Clear of the home indicator, and scrolling to its end doesn't scroll the page behind.
            pb: 'env(safe-area-inset-bottom)',
            overscrollBehavior: 'contain',
          },
        },
      }}
    >
      {children}
    </Drawer>
  );
}

/**
 * A layer (menu, drawer) that takes a step in the browser's history while it's open, so the browser's
 * Back button or back swipe closes it rather than leaving the page. `hide` steps back out of history
 * first, then runs `then` (a navigation), so the app's own history entry lands after the layer's is gone.
 */
function useBackToClose() {
  const [open, setOpen] = useState(false);
  const pushed = useRef(false);
  const then = useRef<(() => void) | undefined>(undefined);
  // Marks this layer's history entry, so closing a layer opened over it (Back lands on this entry) leaves it open.
  const token = useId();
  useEffect(() => {
    if (!open) return;
    const onPop = (event: PopStateEvent) => {
      if ((event.state as { appShellLayer?: string } | null)?.appShellLayer === token) return;
      pushed.current = false;
      setOpen(false);
      const next = then.current;
      then.current = undefined;
      next?.();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [open, token]);
  const show = () => {
    window.history.pushState({ appShellLayer: token }, '');
    pushed.current = true;
    setOpen(true);
  };
  const hide = (next?: () => void) => {
    if (pushed.current) {
      then.current = next;
      window.history.back();
    } else {
      setOpen(false);
      next?.();
    }
  };
  return [open, show, hide] as const;
}

/** A company's initials: the first letters of its first two words. */
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter((word) => /^\p{L}/u.test(word))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');

/** A company's mark on a white tile, fitted inside with a little room (marks are drawn for white), or its initials without one. */
function CompanyMark({ company, size }: { company: AppShellCompany; size: number }) {
  return company.logo ? (
    <Avatar
      variant="rounded"
      src={company.logo}
      alt=""
      sx={{
        width: size,
        height: size,
        bgcolor: 'common.white',
        borderRadius: 1,
        '& img': { objectFit: 'contain', p: size >= 48 ? 0.75 : 0.5, boxSizing: 'border-box' },
      }}
    />
  ) : (
    // Decorative: the company's name is always beside it or in its control's name.
    <Avatar
      aria-hidden
      variant="rounded"
      sx={{
        width: size,
        height: size,
        bgcolor: 'background.level4',
        color: 'text.primary',
        typography: 'caption',
        borderRadius: 1,
      }}
    >
      {initialsOf(company.name)}
    </Avatar>
  );
}

type CompanyMenuProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  company: AppShellCompany;
  companies: AppShellCompany[];
  /** Opens beside the rail on wide screens, above the button in the phone menu. */
  placement: 'right' | 'top';
  onClose: () => void;
  onChoose: (company: string) => void;
  /** Adds the Add company row at the foot. */
  onAdd?: () => void;
};

/** The companies the person belongs to, each with its mark, the current one checked, and an optional Add company row. */
function CompanyMenu({ anchorEl, open, company, companies, placement, onClose, onChoose, onAdd }: CompanyMenuProps) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={
        placement === 'right' ? { vertical: 'top', horizontal: 'right' } : { vertical: 'top', horizontal: 'left' }
      }
      transformOrigin={
        placement === 'right' ? { vertical: 'top', horizontal: 'left' } : { vertical: 'bottom', horizontal: 'left' }
      }
      slotProps={{
        paper: {
          sx: {
            minWidth: 280,
            maxHeight: '70dvh',
            overscrollBehavior: 'contain',
            ...(placement === 'right' && { ml: 1 }),
          },
        },
        list: { 'aria-label': 'Switch company' },
      }}
    >
      {companies.map((item) => (
        <MenuItem
          key={item.id}
          // One of a set, so the current company is announced as checked, not only shown with a check.
          role="menuitemradio"
          aria-checked={item.id === company.id}
          selected={item.id === company.id}
          onClick={() => onChoose(item.id)}
        >
          <ListItemIcon>
            <CompanyMark company={item} size={32} />
          </ListItemIcon>
          <ListItemText primary={item.name} secondary={item.detail} />
          {item.id === company.id && <Icon name="check" sx={{ ml: 1 }} />}
        </MenuItem>
      ))}
      {onAdd && <Divider />}
      {onAdd && (
        <MenuItem onClick={onAdd}>
          <ListItemIcon>
            <Icon name="add" />
          </ListItemIcon>
          <ListItemText primary="Add company" />
        </MenuItem>
      )}
    </Menu>
  );
}

type PhoneShellProps = Pick<
  AppShellProps,
  | 'company'
  | 'sections'
  | 'section'
  | 'page'
  | 'headerStart'
  | 'headerEnd'
  | 'aside'
  | 'asideOpen'
  | 'asideLabel'
  | 'onAsideClose'
  | 'onSectionChange'
  | 'onPageChange'
  | 'onCompanyChange'
  | 'onAddCompany'
  | 'children'
> & { asideLabel: string; asideOpen: boolean; companies: AppShellCompany[] };

/**
 * The shell below the `md` breakpoint, built for a phone's browser. The page scrolls the document, so the
 * browser's toolbars can shrink, under a sticky header: the menu button, the scope (`headerStart`) and
 * page-wide actions. The menu is one column that drills from the sections to a
 * section's pages, with My account and the company pinned at its foot. Nothing is pinned to the bottom of
 * the page, where Safari keeps its own toolbar.
 */
function PhoneShell({
  company,
  sections,
  section,
  page,
  headerStart,
  headerEnd,
  aside,
  asideOpen,
  asideLabel,
  onAsideClose,
  onSectionChange,
  onPageChange,
  companies,
  onCompanyChange,
  onAddCompany,
  children,
}: PhoneShellProps) {
  const [menuOpen, showMenu, hideMenu] = useBackToClose();
  const [companiesOpen, showCompanies, hideCompanies] = useBackToClose();
  const [searchOpen, showSearch, hideSearch] = useBackToClose();
  const [companyButton, setCompanyButton] = useState<HTMLElement | null>(null);
  // The section whose pages the menu shows; `null` shows the sections.
  const [level, setLevel] = useState<string | null>(null);
  const { measure: measureContent, provide: provideContent } = useContentWidth<HTMLElement>();
  const { measure: measureHeader, height: headerHeight } = useElementHeight<HTMLElement>();

  const current = sections.find((item) => item.id === section);
  const account = sections.find((item) => item.initials !== undefined);
  // Notifications and the like lead the menu; My account is pinned at its foot with the company.
  const menuSections = [
    ...sections.filter((item) => item.placement === 'end' && item.initials === undefined),
    ...sections.filter((item) => item.placement !== 'end'),
  ].filter((item) => !item.hideOnPhone);
  const levelSection = sections.find((item) => item.id === level);
  const news = sections.filter((item) => item.count).map((item) => item.badge ?? `${item.label}, ${item.count}`);
  const menuLabel = ['Open menu', ...news].join(', ');

  // Which way the last drill went, so the new level slides in from that side; `null` when the menu opens.
  const [direction, setDirection] = useState<'in' | 'out' | null>(null);
  const { duration } = useTheme().transitions;
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const drill = (id: string | null) => {
    setDirection(id ? 'in' : 'out');
    setLevel(id);
  };

  const openMenu = () => {
    setDirection(null);
    setLevel(hasPanel(current) ? section : null);
    showMenu();
  };

  // A page's icon, name, second line and count, in a menu row.
  const pageRow = (item: AppShellPanelItem) => (
    <>
      <ListItemIcon sx={{ minWidth: 36 }}>
        <Icon name={item.icon} />
      </ListItemIcon>
      <ListItemText primary={item.label} secondary={item.secondary} />
      {item.count !== undefined && (
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1, fontVariantNumeric: 'tabular-nums' }}>
          {new Intl.NumberFormat().format(item.count)}
        </Typography>
      )}
    </>
  );

  const menuHeader = (heading: string, back?: () => void) => (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 1, p: 1, pl: back ? 1 : 2 }}>
      {back && (
        <IconButton aria-label="All sections" onClick={back}>
          <Icon name="chevron_left" />
        </IconButton>
      )}
      <Typography variant="h5" component="h2" noWrap sx={{ flex: 1 }}>
        {heading}
      </Typography>
      {/* Search sits in the menu's header, as it does in the panel's on wide screens, leaving the top bar to the scope. */}
      <IconButton aria-label="Search" onClick={() => hideMenu(showSearch)}>
        <Icon name="search" />
      </IconButton>
      <IconButton aria-label="Close menu" onClick={() => hideMenu()}>
        <Icon name="close" />
      </IconButton>
    </Stack>
  );

  // My account and the company stay at the foot of the menu on both levels, however long the list above.
  const menuFooter = (
    <Stack sx={{ gap: 1, p: 1, pb: 2, borderTop: 1, borderColor: 'divider' }}>
      {account && account.id !== level && (
        <List disablePadding>
          <ListItem disablePadding>
            <ListItemButton
              selected={account.id === section}
              aria-current={account.id === section ? 'page' : undefined}
              onClick={() => (hasPanel(account) ? drill(account.id) : hideMenu(() => onSectionChange?.(account.id)))}
              sx={{ borderRadius: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 44 }}>
                <SectionGlyph section={account} />
              </ListItemIcon>
              <ListItemText primary={account.label} secondary={account.badge} />
              {hasPanel(account) && <Icon name="chevron_right" color="action" />}
            </ListItemButton>
          </ListItem>
        </List>
      )}
      {/* The same control as the rail's company button, whatever the count: the company's mark and name. */}
      <Button
        ref={setCompanyButton}
        variant="outlined"
        startIcon={<CompanyMark company={company} size={24} />}
        endIcon={<Icon name="unfold_more" />}
        aria-label={`Switch company: ${company.name}`}
        aria-haspopup="menu"
        aria-expanded={companiesOpen}
        onClick={showCompanies}
        sx={{ mx: 1, justifyContent: 'flex-start' }}
      >
        <Box
          component="span"
          sx={{
            flex: 1,
            minWidth: 0,
            textAlign: 'start',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {company.name}
        </Box>
      </Button>
    </Stack>
  );

  const sectionsView = (
    <>
      <List sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 1, py: 0 }}>
        {menuSections.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={item.id === section}
              aria-current={item.id === section ? 'page' : undefined}
              onClick={() => (hasPanel(item) ? drill(item.id) : hideMenu(() => onSectionChange?.(item.id)))}
              sx={{ borderRadius: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <SectionGlyph section={item} />
              </ListItemIcon>
              <ListItemText primary={item.label} secondary={item.missing ? undefined : item.badge} />
              {hasPanel(item) && <Icon name="chevron_right" color="action" />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );

  const pagesView = hasPanel(levelSection) && (
    <>
      <List sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 1, py: 0 }}>
        {levelSection.panel.items.map((item) => {
          const selected = levelSection.id === section && item.id === page;
          return (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={selected}
                aria-current={selected ? 'page' : undefined}
                onClick={() => hideMenu(() => onPageChange?.(item.id, levelSection.id))}
                {...(item.href ? { component: 'a', href: item.href } : {})}
                sx={{ borderRadius: 1 }}
              >
                {pageRow(item)}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      {levelSection.panel.colorScheme && <ColorSchemeControl />}
      {levelSection.panel.footer && <Box sx={{ p: 2 }}>{levelSection.panel.footer}</Box>}
    </>
  );

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.level2' }}>
      {skipLink}
      <AppBar
        ref={measureHeader}
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ top: 0, bgcolor: 'background.level2', borderBottom: 1, borderColor: 'divider' }}
      >
        {/* The page's 16px inset; the icon buttons at either end overhang it by their 8px padding, so their glyphs sit on the content's edge. */}
        <Toolbar disableGutters sx={{ gap: 0.5, px: 2 }}>
          <IconButton aria-label={menuLabel} onClick={openMenu} sx={{ ml: -1 }}>
            <Badge variant="dot" color="secondary" invisible={!news.length}>
              <Icon name="menu" />
            </Badge>
          </IconButton>
          {/* The scope fills the header between the two buttons. The menu opens on the section's pages, and each page names itself. */}
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', ml: 0.5, '& > *': { flex: 1, minWidth: 0 } }}>{headerStart}</Box>
          <Box sx={{ display: 'flex', mr: -1 }}>{headerEnd}</Box>
        </Toolbar>
      </AppBar>
      <Box
        ref={measureContent}
        component="main"
        id="main"
        tabIndex={-1}
        sx={{ p: 2, pb: 'calc(var(--mui-spacing) * 2 + env(safe-area-inset-bottom))', outline: 'none' }}
      >
        {provideContent(<PageScrollProvider value={{ root: null, top: `${headerHeight}px`, edge: headerHeight, inset: 2 }}>{children}</PageScrollProvider>)}
      </Box>
      <Drawer
        open={menuOpen}
        onClose={() => hideMenu()}
        slotProps={{
          paper: {
            'aria-label': 'Menu',
            sx: { width: 'min(320px, calc(100vw - 56px))', height: '100dvh', overscrollBehavior: 'contain' },
          },
        }}
      >
        <Stack
          component="nav"
          aria-label="Menu"
          sx={{ height: '100%', minHeight: 0, pb: 'env(safe-area-inset-bottom)' }}
        >
          {/* The header changes in place; only the list between it and the footer slides. */}
          {levelSection && hasPanel(levelSection)
            ? menuHeader(levelSection.label, () => drill(null))
            : menuHeader('Menu')}
          {/* Drilling in slides the new level in from the right, going back from the left. */}
          <Box ref={setViewport} sx={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <Slide
              key={level ?? 'sections'}
              in
              appear={direction !== null}
              direction={direction === 'out' ? 'right' : 'left'}
              container={viewport}
              timeout={{ enter: duration.standard }}
            >
              <Stack sx={{ flex: 1, minWidth: 0, minHeight: 0 }}>
                {levelSection && hasPanel(levelSection) ? pagesView : sectionsView}
              </Stack>
            </Slide>
          </Box>
          {menuFooter}
        </Stack>
      </Drawer>
      <SearchDialog
        open={searchOpen}
        sections={sections.filter((item) => !item.hideOnPhone)}
        fullScreen
        onClose={() => hideSearch()}
        onChoose={(id, sectionId) => hideSearch(() => onPageChange?.(id, sectionId))}
      />
      <CompanyMenu
        anchorEl={companyButton}
        open={companiesOpen}
        company={company}
        companies={companies}
        placement="top"
        onClose={() => hideCompanies()}
        onChoose={(id) =>
          // Out of the company menu, then out of the menu, then switch.
          hideCompanies(() => hideMenu(() => id !== company.id && onCompanyChange?.(id)))
        }
        onAdd={onAddCompany && (() => hideCompanies(() => hideMenu(onAddCompany)))}
      />
      {aside && (
        <AsideSheet open={asideOpen} label={asideLabel} onClose={onAsideClose}>
          {aside}
        </AsideSheet>
      )}
    </Box>
  );
}

/** The window margin the floating aside never crosses while it's dragged. */
const floatEdge = 8;
/** Where the floating aside sits until it's moved: 16px from the window's right and bottom edges. */
const floatHome: AppShellAsidePosition = { right: 16, bottom: 16 };

const isDragHandle = (target: EventTarget) => {
  const element = target as HTMLElement;
  return (
    Boolean(element.closest?.('[data-drag-handle]')) &&
    !element.closest('button, a, input, textarea, [role="button"], [role="menuitem"]')
  );
};

/**
 * Drags the floating aside. Its content marks the drag area with `data-drag-handle` (its header); a press there, away
 * from its buttons, moves the panel with the pointer, kept 8px inside the window, and where it's let go is kept and
 * handed to `onChange`. A double-click on the handle puts it back in the corner. The position is measured from the
 * window's right and bottom edges, so it stays in its corner as the window resizes, and is clamped again when it does.
 */
function useFloatingDrag(
  initial: AppShellAsidePosition | null | undefined,
  onChange: ((position: AppShellAsidePosition | null) => void) | undefined,
  enabled: boolean,
) {
  // The panel, kept in state (a callback ref) so its size can be watched; the window's size, so a resize clamps again.
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [view, setView] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  const [position, setPosition] = useState<AppShellAsidePosition | null>(initial ?? null);
  const [live, setLive] = useState<AppShellAsidePosition | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const onResize = () => setView({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [enabled]);
  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver(() => setSize({ width: element.offsetWidth, height: element.offsetHeight }));
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  const clamp = (p: AppShellAsidePosition, within = view, box = size): AppShellAsidePosition => ({
    right: Math.round(
      Math.min(Math.max(p.right, floatEdge), Math.max(floatEdge, within.width - box.width - floatEdge)),
    ),
    bottom: Math.round(
      Math.min(Math.max(p.bottom, floatEdge), Math.max(floatEdge, within.height - box.height - floatEdge)),
    ),
  });

  const current = live ?? (position ? clamp(position) : floatHome);
  const settle = (next: AppShellAsidePosition | null) => {
    setPosition(next);
    onChange?.(next);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || !isDragHandle(event.target)) return;
    event.preventDefault();
    const start = { x: event.clientX, y: event.clientY, ...current };
    const box = { width: event.currentTarget.clientWidth, height: event.currentTarget.clientHeight };
    let last: AppShellAsidePosition | null = null;
    const move = (e: globalThis.PointerEvent) => {
      last = clamp(
        { right: start.right - (e.clientX - start.x), bottom: start.bottom - (e.clientY - start.y) },
        { width: window.innerWidth, height: window.innerHeight },
        box,
      );
      setLive(last);
    };
    const end = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      setLive(null);
      if (last) settle(last);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  const onDoubleClick = (event: MouseEvent) => {
    if (isDragHandle(event.target)) settle(null);
  };

  return { ref: setElement, position: current, dragging: live !== null, handlers: { onPointerDown, onDoubleClick } };
}

type ResizeEdgeProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  /** Which side of the line the page is on: the 24px hit area sits mostly over the page's padding, not the column's rows. */
  page: 'left' | 'right';
  onResize: (width: number) => void;
  /** The width for a pointer at `clientX` while the edge is dragged. */
  widthAt: (clientX: number) => number | undefined;
};

/**
 * A column's resize edge: a 1px line the pointer drags, and a focusable `separator` the arrow keys move by 8px (Home
 * and End to its limits). Hovered, focused or dragged, it takes the primary color, softened at both ends to halfway
 * toward the divider, so it reads as a handle without a hard-edged bar.
 */
function ResizeEdge({ label, value, min, max, page, onResize, widthAt }: ResizeEdgeProps) {
  const onKey = (event: KeyboardEvent) => {
    const toward = page === 'right' ? 1 : -1;
    const step = { ArrowLeft: -8 * toward, ArrowRight: 8 * toward }[event.key];
    if (step) {
      event.preventDefault();
      onResize(value + step);
    } else if (event.key === 'Home') {
      event.preventDefault();
      onResize(min);
    } else if (event.key === 'End') {
      event.preventDefault();
      onResize(max);
    }
  };
  const onMove = (event: PointerEvent) => {
    const width = widthAt(event.clientX);
    if (width !== undefined && event.currentTarget.hasPointerCapture(event.pointerId)) onResize(width);
  };
  return (
    <Box
      role="separator"
      aria-label={label}
      aria-orientation="vertical"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onKeyDown={onKey}
      onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
      onPointerMove={onMove}
      sx={{
        position: 'relative',
        width: '1px',
        flexShrink: 0,
        bgcolor: 'divider',
        cursor: 'col-resize',
        touchAction: 'none',
        outline: 'none',
        '&::after': {
          content: '""',
          position: 'absolute',
          insetBlock: 0,
          zIndex: 1,
          ...(page === 'right' ? { left: -4, right: -19 } : { left: -19, right: -4 }),
        },
        '&:hover, &:focus-visible, &:active': {
          backgroundImage:
            'linear-gradient(to bottom, color-mix(in srgb, var(--mui-palette-primary-main) 50%, var(--mui-palette-divider)), var(--mui-palette-primary-main) 30%, var(--mui-palette-primary-main) 70%, color-mix(in srgb, var(--mui-palette-primary-main) 50%, var(--mui-palette-divider)))',
        },
      }}
    />
  );
}

/**
 * The frame every Enertiv page sits in. On wide screens: a rail of top-level sections down the left,
 * with the company switcher at the top and any `end` sections (Notifications, My account) at the
 * bottom; a section panel listing the current section's pages, with an optional filter, which
 * resizes and undocks; a header for the scope and page-wide actions; the page in `main`; and an
 * optional side column for the assistant. Undocked, the panel floats inside the frame for whichever
 * rail item is hovered, so another section's pages are one move away. A Search button beside the
 * panel's toggle, on every page, opens one search dialog that finds a page in any section. Below the
 * `md` breakpoint it switches to a layout for a phone's browser: the document scrolls under a sticky
 * header that holds the scope, and the menu button opens a one-column
 * menu that slides between the sections and a section's pages, with My account and the company
 * pinned at its foot, and the side column opens as a bottom sheet. It holds no routes: it
 * reports choices through its callbacks, and items with an `href` render as links.
 *
 * @summary The app frame: section rail, dockable section panel, header and main area; a drill-down menu on phones.
 * @import import { AppShell } from 'src/components/AppShell';
 */
export function AppShell({
  company,
  companies = [company],
  sections,
  section,
  page,
  headerStart,
  headerEnd,
  aside,
  asideOpen = false,
  asideLabel = 'Side panel',
  onAsideClose,
  asideDocked = true,
  defaultAsideWidth = 344,
  onAsideWidthChange,
  defaultAsidePosition = null,
  onAsidePositionChange,
  hideHeader = false,
  loading = false,
  defaultPanelOpen = true,
  onPanelOpenChange,
  defaultPanelWidth = 256,
  onPanelWidthChange,
  onSectionChange,
  onPageChange,
  onCompanyChange,
  onAddCompany,
  children,
}: AppShellProps) {
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)', { noSsr: true });
  const [panelOpen, setPanelOpen] = useState(defaultPanelOpen);
  const [panelWidth, setPanelWidth] = useState(() => clampWidth(defaultPanelWidth));
  const [asideWidth, setAsideWidth] = useState(() => clampAside(defaultAsideWidth));
  // The section whose panel floats over the page while the panel is undocked.
  const [flyout, setFlyout] = useState<string | null>(null);
  // Whether the floating panel was opened from the rail item (click or Enter) rather than hover, so it
  // stays until dismissed: the way to it, and to Dock navigation, without hover (keyboard and touch).
  const [flyoutPinned, setFlyoutPinned] = useState(false);
  // Docking from the floating panel: the floating panel stays as an overlay that grows from where it floated into the
  // docked slot while the slot opens and pushes the page over, and fades only once the page behind it has loaded.
  const [morph, setMorph] = useState<Morph | null>(null);
  const { measure: measureContent, provide: provideContent, element: contentElement } = useContentWidth<HTMLElement>();
  const asideFloats = Boolean(aside && asideOpen && wide && !asideDocked);
  const {
    ref: floatRef,
    position: floatPosition,
    dragging,
    handlers: dragHandlers,
  } = useFloatingDrag(defaultAsidePosition, onAsidePositionChange, asideFloats);
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const panelRef = useRef<HTMLDivElement>(null);
  const [companyAnchor, setCompanyAnchor] = useState<HTMLElement | null>(null);
  const [searchOpen, showSearch, hideSearch] = useBackToClose();

  useEffect(
    () => () => {
      clearTimeout(openTimer.current);
      clearTimeout(closeTimer.current);
    },
    [],
  );

  const current = sections.find((item) => item.id === section);
  const docked = panelOpen;
  const flyoutSection = sections.find((item) => item.id === flyout);
  const flyoutWidth = panelWidth - flyoutInset;

  const closeFlyout = () => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
    setFlyout(null);
    setFlyoutPinned(false);
  };
  const togglePanel = (open: boolean) => {
    // Docking from the floating panel, it grows from where it floated into the docked slot; docking another section's
    // panel goes to that section, so the panel that docks is the one that was showing.
    const from = flyout;
    const root = rootRef.current;
    const frame = frameRef.current;
    const floatingPanelEl = flyoutRef.current;
    if (open && from && root && frame && floatingPanelEl && !reduceMotion) {
      const slot = rectIn(frame, root);
      // The slot sits inside the frame's 1px border.
      setMorph({
        id: from,
        from: rectIn(floatingPanelEl, root),
        to: { top: slot.top + 1, left: slot.left + 1, width: panelWidth, height: slot.height - 2 },
        phase: 'from',
      });
    } else {
      setMorph(null);
    }
    closeFlyout();
    setPanelOpen(open);
    onPanelOpenChange?.(open);
    if (open && from && from !== section) onSectionChange?.(from);
  };
  const morphDuration = theme.transitions.duration.standard;
  const fadeDuration = theme.transitions.duration.shorter;
  // The overlay paints once at the floating panel's place, then grows. Timers mirror the transitions, so a lost
  // `transitionend` (a hidden tab) can't strand it.
  useLayoutEffect(() => {
    if (morph?.phase !== 'from') return;
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => setMorph((m) => (m?.phase === 'from' ? { ...m, phase: 'to' } : m))),
    );
    return () => cancelAnimationFrame(frame);
  }, [morph?.phase]);
  useEffect(() => {
    if (morph?.phase !== 'to') return;
    const timer = setTimeout(() => setMorph((m) => (m?.phase === 'to' ? { ...m, phase: 'grown' } : m)), morphDuration);
    return () => clearTimeout(timer);
  }, [morph?.phase, morphDuration]);
  // Grown and the page loaded, the overlay fades out over the docked panel, then goes.
  const fading = morph?.phase === 'grown' && !loading;
  useEffect(() => {
    if (!fading) return;
    const timer = setTimeout(() => setMorph((m) => (m?.phase === 'grown' ? null : m)), fadeDuration);
    return () => clearTimeout(timer);
  }, [fading, fadeDuration]);

  const resize = (width: number) => {
    const next = clampWidth(width);
    setPanelWidth(next);
    onPanelWidthChange?.(next);
  };
  const resizeAside = (width: number) => {
    const next = clampAside(width);
    setAsideWidth(next);
    onAsideWidthChange?.(next);
  };
  // Undocked, rail items open their section's panel on hover instead of a tooltip; a Missing section has no panel.
  const flies = !panelOpen;
  const previews = (item: AppShellSection) => flies && hasPanel(item) && !item.missing;
  const openFlyout = (item: AppShellSection) => {
    if (flyoutPinned) return;
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
    if (!previews(item)) {
      setFlyout(null);
      return;
    }
    // A short rest before the first panel opens; once one is open, the next follows the pointer at once.
    openTimer.current = setTimeout(() => setFlyout(item.id), flyout ? 0 : flyoutOpenDelay);
  };
  const keepFlyout = () => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
  };
  const leaveFlyout = () => {
    if (flyoutPinned) return;
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setFlyout(null), flyoutCloseDelay);
  };
  // Escape, or a click outside, closes the pinned panel; Escape hands focus back to the rail item.
  const dismissFlyout = (refocus: boolean) => {
    closeFlyout();
    if (refocus) railRef.current?.querySelector<HTMLElement>('[aria-current="page"]')?.focus();
  };
  const chooseSection = (id: string) => {
    // Undocked, the current section's rail item opens (or closes) its panel instead of reloading the section.
    if (!panelOpen && id === section && hasPanel(current)) {
      clearTimeout(openTimer.current);
      clearTimeout(closeTimer.current);
      if (flyoutPinned && flyout === id) closeFlyout();
      else {
        setFlyout(id);
        setFlyoutPinned(true);
      }
      return;
    }
    closeFlyout();
    onSectionChange?.(id);
  };
  const choosePage = (id: string, sectionId: string) => {
    closeFlyout();
    onPageChange?.(id, sectionId);
  };

  // A pinned panel takes focus, so keyboard users land in it.
  useEffect(() => {
    if (flyoutPinned) flyoutRef.current?.querySelector<HTMLElement>('button, a[href]')?.focus();
  }, [flyoutPinned, flyout]);

  const railButton = { width: 48, height: 48, flex: 'none', justifyContent: 'center', borderRadius: 1, p: 0 } as const;

  const railItem = (item: AppShellSection) => {
    // A Missing section's tooltip is its name; its accessible name adds that it opens the upgrade page.
    const name = item.missing
      ? `${item.label}. Opens the upgrade page`
      : item.badge
        ? `${item.label}, ${item.badge}`
        : item.label;
    const glyph = <SectionGlyph section={item} />;
    return (
      <ListItem key={item.id} disablePadding>
        <Tooltip title={previews(item) ? '' : item.missing ? item.label : name} placement="right">
          <ListItemButton
            aria-label={name}
            aria-current={item.id === section ? 'page' : undefined}
            selected={item.id === section}
            onClick={() => chooseSection(item.id)}
            onPointerEnter={flies ? () => openFlyout(item) : undefined}
            {...(item.href ? { component: 'a', href: item.href } : {})}
            sx={{
              ...railButton,
              // The item whose panel is floating keeps its hover color while the pointer is over the panel.
              ...(item.id === flyout && item.id !== section && { bgcolor: 'action.hover' }),
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, color: item.id === section ? 'text.primary' : 'text.secondary' }}>
              {item.missing ? (
                glyph
              ) : item.count ? (
                <Badge badgeContent={item.count} color="secondary" max={99}>
                  {glyph}
                </Badge>
              ) : (
                <Badge variant="dot" color="secondary" invisible={!item.badge}>
                  {glyph}
                </Badge>
              )}
            </ListItemIcon>
          </ListItemButton>
        </Tooltip>
      </ListItem>
    );
  };

  // Floats inside the frame, 8px in from its edges (its 1px border included), so the corners are
  // concentric: the frame's 16px is the panel's theme radius (8px) plus the gap. Elevation 2 puts it on
  // level3, a step below the menu surface, with the lowest shadow that still lifts it off the page.
  const floatingPanel = hasPanel(flyoutSection) && (
    <Paper
      elevation={2}
      onPointerEnter={keepFlyout}
      onPointerLeave={leaveFlyout}
      ref={flyoutRef}
      onKeyDown={(event) => event.key === 'Escape' && dismissFlyout(flyoutPinned)}
      sx={{
        position: 'absolute',
        top: (t) => t.spacing(2),
        bottom: (t) => t.spacing(2),
        left: (t) => `calc(${railWidth}px + ${t.spacing(1)})`,
        zIndex: 'drawer',
        display: 'flex',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <SectionPanel
        key={flyoutSection.id}
        section={flyoutSection}
        page={flyoutSection.id === section ? page : undefined}
        width={flyoutWidth}
        toggle={{ label: 'Dock navigation', icon: 'left_panel_open', onClick: () => togglePanel(true) }}
        onChoose={(id) => choosePage(id, flyoutSection.id)}
      />
    </Paper>
  );

  // The docking panel's overlay: the floating panel carried on from where it floated into the docked slot. Purely
  // visual (the docked panel under it is the live one), so it takes no pointer events and is hidden from readers.
  const morphSection = sections.find((item) => item.id === morph?.id);
  const morphPanel = morph && hasPanel(morphSection) && (
    <Paper
      // Elevation 2 is the floating panel's (level3, shadowed), 0 flat: changing it on one element lets the shadow
      // transition with the rest, and the background goes to the docked panel's level1.
      elevation={morph.phase === 'from' ? 2 : 0}
      aria-hidden
      sx={(t) => {
        const at = morph.phase === 'from' ? morph.from : morph.to;
        const corner = 'calc(2 * var(--mui-shape-borderRadius) - 1px)';
        return {
          // Settled, two classes, to outrank the flat Paper's level2 (as the theme's Card does).
          ...(morph.phase !== 'from' && { '&.MuiPaper-root': { bgcolor: 'background.level1' } }),
          position: 'absolute',
          zIndex: 'drawer',
          display: 'flex',
          overflow: 'hidden',
          pointerEvents: 'none',
          top: at.top,
          left: at.left,
          width: at.width,
          height: at.height,
          // The frame's inner corners on the left, square on the right where the page continues.
          borderRadius: morph.phase === 'from' ? 1 : `${corner} 0 0 ${corner}`,
          opacity: fading ? 0 : 1,
          transition:
            t.transitions.create(
              ['top', 'left', 'width', 'height', 'background-color', 'box-shadow', 'border-radius'],
              {
                duration: morphDuration,
                easing: t.transitions.easing.easeInOut,
              },
            ) + `, opacity ${fadeDuration}ms ${t.transitions.easing.easeOut}`,
        };
      }}
    >
      <SectionPanel
        key={morphSection.id}
        section={morphSection}
        page={morphSection.id === section ? page : undefined}
        width="100%"
        toggle={{ label: 'Collapse navigation', icon: 'left_panel_close', onClick: () => {} }}
        onChoose={() => {}}
      />
    </Paper>
  );

  const rail = (
    <Stack
      ref={railRef}
      component="nav"
      aria-label="Main"
      onPointerLeave={flies ? leaveFlyout : undefined}
      sx={{ width: railWidth, flexShrink: 0, alignItems: 'center', py: 2, gap: 2 }}
    >
      <Tooltip title={company.name} placement="right">
        <IconButton
          aria-label={`Switch company: ${company.name}`}
          aria-haspopup="menu"
          aria-expanded={Boolean(companyAnchor)}
          onClick={(event) => setCompanyAnchor(event.currentTarget)}
          onPointerEnter={flies && !flyoutPinned ? closeFlyout : undefined}
          sx={{
            width: 48,
            height: 48,
            p: 0,
            ...(!company.logo && {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              typography: 'subtitle2',
              '&:hover': { bgcolor: 'primary.dark' },
            }),
          }}
        >
          {company.logo ? <CompanyMark company={company} size={48} /> : initialsOf(company.name)}
        </IconButton>
      </Tooltip>
      <List
        disablePadding
        sx={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}
      >
        {sections.filter((item) => item.placement !== 'end').map(railItem)}
      </List>
      <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* The app-wide Search, in the rail's foot above Notifications, so it's one move away from any page. */}
        <ListItem disablePadding>
          <Tooltip title="Search" placement="right">
            <ListItemButton
              aria-label="Search"
              aria-haspopup="dialog"
              aria-expanded={searchOpen}
              onClick={() => {
                closeFlyout();
                showSearch();
              }}
              onPointerEnter={flies && !flyoutPinned ? closeFlyout : undefined}
              sx={railButton}
            >
              <ListItemIcon sx={{ minWidth: 0, color: 'text.secondary' }}>
                <Icon name="search" />
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>
        </ListItem>
        {sections.filter((item) => item.placement === 'end').map(railItem)}
      </List>
    </Stack>
  );

  if (!wide) {
    return (
      <PhoneShell
        {...{
          company,
          sections,
          section,
          page,
          headerStart,
          headerEnd,
          aside,
          asideOpen,
          asideLabel,
          onAsideClose,
          onSectionChange,
          onPageChange,
          companies,
          onCompanyChange,
          onAddCompany,
        }}
      >
        {children}
      </PhoneShell>
    );
  }

  const asideBesidePage = Boolean(aside && asideOpen && asideDocked);

  return (
    // On wide screens the frame fills the window and only `main` scrolls.
    <Box
      ref={rootRef}
      sx={{
        position: 'relative',
        display: 'flex',
        height: '100dvh',
        overflow: 'hidden',
        bgcolor: 'background.level0',
        p: 1,
        pl: 0,
      }}
    >
      {skipLink}
      {rail}
      <Box
        ref={frameRef}
        sx={{
          display: 'flex',
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          bgcolor: 'background.level2',
          // The frame rounds at the card radius, so the panel's rows, 8px in, keep concentric corners.
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        {docked && hasPanel(current) && (
          <>
            {/* Docking from the floating panel, the slot opens from nothing to the panel's width, pushing the page over
                while the overlay grows into it; the panel inside keeps its full width, so nothing reflows. */}
            <Box
              ref={panelRef}
              sx={{
                bgcolor: 'background.level1',
                display: 'flex',
                minHeight: 0,
                overflow: 'hidden',
                flexShrink: 0,
                width: morph?.phase === 'from' ? 0 : panelWidth,
                transition: morph
                  ? theme.transitions.create('width', {
                      duration: morphDuration,
                      easing: theme.transitions.easing.easeInOut,
                    })
                  : 'none',
              }}
            >
              <SectionPanel
                key={current.id}
                section={current}
                page={page}
                width={panelWidth}
                toggle={{ label: 'Collapse navigation', icon: 'left_panel_close', onClick: () => togglePanel(false) }}
                onChoose={(id) => choosePage(id, current.id)}
              />
            </Box>
            <ResizeEdge
              label="Resize navigation"
              value={panelWidth}
              min={minPanelWidth}
              max={maxPanelWidth}
              page="right"
              onResize={resize}
              widthAt={(x) => {
                const left = panelRef.current?.getBoundingClientRect().left;
                return left === undefined ? undefined : x - left;
              }}
            />
          </>
        )}
        <Stack sx={{ flex: 1, minWidth: 0 }}>
          {!hideHeader && (
            // No line under the header: it sits on the frame's surface, and the page's own content starts below it.
            <AppBar position="static" color="transparent" elevation={0}>
              {/* The page's 24px gutter on the sides and top, so the scope sits in line with the page's title. */}
              <Toolbar
                disableGutters
                sx={{ gap: 1, px: 3, pt: 3, pb: 0.5, minHeight: { md: 0 }, alignItems: 'stretch' }}
              >
                {/* Dock navigation lives in the panel and Search in the rail, so the header's room goes to the scope. */}
                <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>{headerStart}</Box>
                {headerEnd}
              </Toolbar>
            </AppBar>
          )}
          <Box
            ref={measureContent}
            component="main"
            id="main"
            tabIndex={-1}
            sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 3, outline: 'none' }}
          >
            {provideContent(<PageScrollProvider value={{ root: contentElement, top: theme.spacing(-3), edge: 0, inset: 3 }}>{children}</PageScrollProvider>)}
          </Box>
        </Stack>
        {asideBesidePage && (
          <>
            <ResizeEdge
              label={`Resize ${asideLabel}`}
              value={asideWidth}
              min={minAsideWidth}
              max={maxAsideWidth}
              page="left"
              onResize={resizeAside}
              widthAt={(x) => {
                const right = frameRef.current?.getBoundingClientRect().right;
                return right === undefined ? undefined : right - 1 - x;
              }}
            />
            <Box
              component="aside"
              aria-label={asideLabel}
              sx={{ width: asideWidth, flexShrink: 0, minHeight: 0, display: 'flex', flexDirection: 'column', bgcolor: 'background.level1' }}
            >
              {aside}
            </Box>
          </>
        )}
      </Box>
      {morphPanel}
      {flies &&
        floatingPanel &&
        // Pinned, a click outside closes it. Mounted only then, so the click that pins it doesn't count.
        (flyoutPinned ? (
          <ClickAwayListener onClickAway={() => dismissFlyout(false)}>{floatingPanel}</ClickAwayListener>
        ) : (
          floatingPanel
        ))}
      <SearchDialog
        open={searchOpen}
        sections={sections}
        fullScreen={false}
        onClose={() => hideSearch()}
        onChoose={(id, sectionId) => hideSearch(() => choosePage(id, sectionId))}
      />
      <CompanyMenu
        anchorEl={companyAnchor}
        open={Boolean(companyAnchor)}
        company={company}
        companies={companies}
        placement="right"
        onClose={() => setCompanyAnchor(null)}
        onChoose={(id) => {
          setCompanyAnchor(null);
          if (id !== company.id) onCompanyChange?.(id);
        }}
        onAdd={
          onAddCompany &&
          (() => {
            setCompanyAnchor(null);
            onAddCompany();
          })
        }
      />
      {asideFloats && (
        // Undocked, the aside floats over the page at the bottom right, at its column's width and a
        // contained height, above the page and the floating panel. Its content's drag handle (its header) moves it.
        <Paper
          ref={floatRef}
          component="aside"
          elevation={0}
          aria-label={asideLabel}
          {...dragHandlers}
          sx={{
            // Two classes, to outrank the elevation's surface (as the theme's Card does): the docked column's level1.
            '&.MuiPaper-root': { bgcolor: 'background.level1' },
            position: 'fixed',
            right: floatPosition.right,
            bottom: floatPosition.bottom,
            width: asideWidth,
            maxWidth: 'calc(100vw - 32px)',
            height: 'min(640px, calc(100dvh - 32px))',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 'modal',
            // A floating layer: its own edge and a shadow, raised further while it's dragged.
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            boxShadow: dragging ? 16 : 8,
            overflow: 'hidden',
            userSelect: dragging ? 'none' : undefined,
            '& [data-drag-handle]': { cursor: dragging ? 'grabbing' : 'grab' },
          }}
        >
          {aside}
        </Paper>
      )}
    </Box>
  );
}
