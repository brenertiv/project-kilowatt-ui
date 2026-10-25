import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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
};

/** A section's panel: its pages, with search. */
export type AppShellPanel = {
  /** The pages, in order. */
  items: AppShellPanelItem[];
  /** Controls between the search field and the list, such as a New button. Left out of the phone menu, so put the same action in the page too. */
  actions?: ReactNode;
  /** Content under the list, such as the company name. */
  footer?: ReactNode;
  /** Shows the Light, Dark and System appearance control under the list, as My account does. Default `false`. */
  colorScheme?: boolean;
};

/** A top-level section of the app, shown as an icon in the rail. */
export type AppShellSection = {
  /** Identifies the section in `section` and `onSectionChange`. */
  id: string;
  /** The section's name: its tooltip, its panel's heading and the panel's landmark label. */
  label: string;
  /** Where the section lives, if it has a URL: the rail item renders as a link. */
  href?: string;
  /** A short note read with the label, such as "Upgrade available" or "10 unread". It puts a dot on the icon, or `count` when there is one. */
  badge?: string;
  /** A number on the icon in place of the dot, such as unread notifications. Give `badge` the words for it. */
  count?: number;
  /** Where the section sits in the rail: with the other sections, or at the bottom, as Notifications and My account do. Default `'start'`. */
  placement?: 'start' | 'end';
  /** The section's pages. Leave it out for a section with no pages of its own: it has no panel. */
  panel?: AppShellPanel;
  /** Leaves the section out of the phone menu, for one that's rarely used on a phone, such as an upgrade page. Default `false`. */
  hideOnPhone?: boolean;
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
};

export type AppShellProps = {
  /** The company the person is in: the rail's first button on wide screens, and the company button at the foot of the phone menu. */
  company: AppShellCompany;
  /** Every company the person belongs to, the current one included. With two or more, the company button opens a menu to switch. */
  companies?: AppShellCompany[];
  /** The top-level sections, in rail order, each with its panel. */
  sections: AppShellSection[];
  /** The id of the current section. */
  section: string;
  /** The id of the current page in the current section's panel. */
  page?: string;
  /** Header content at the start, after the panel toggle: the scope button. On phones it moves to the top of the page, under the header. */
  headerStart?: ReactNode;
  /** Header content at the end: actions such as Ask Enertiv. On phones there's room for an icon button, not a labelled one. */
  headerEnd?: ReactNode;
  /** A side column at the end, such as the assistant. Shown while `asideOpen`; below the `lg` breakpoint it opens as a bottom sheet. */
  aside?: ReactNode;
  /** Whether `aside` is shown. Default `false`. */
  asideOpen?: boolean;
  /** The accessible name of `aside`, such as "Ask Enertiv". Default `'Side panel'`. */
  asideLabel?: string;
  /** Called when the bottom sheet's scrim or Escape closes `aside`. */
  onAsideClose?: () => void;
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
  /** The page. */
  children: ReactNode;
};

const railWidth = 72;
const minPanelWidth = 220;
const maxPanelWidth = 380;
const asideWidth = 344;
/** How long the undocked panel stays after the pointer leaves the rail and panel, so it survives a diagonal move. */
const flyoutCloseDelay = 200;

const clampWidth = (width: number) => Math.round(Math.min(maxPanelWidth, Math.max(minPanelWidth, width)));

type SectionPanelProps = {
  section: AppShellSection & { panel: AppShellPanel };
  page?: string;
  width: number | string;
  /** The header button: collapse when docked or in the drawer, dock when floating. */
  toggle: { label: string; icon: IconName; onClick: () => void };
  onChoose: (page: string) => void;
};

/** A section's title, search, actions and pages. Docked, floating over the page, or in the drawer. */
function SectionPanel({ section, page, width, toggle, onChoose }: SectionPanelProps) {
  const [query, setQuery] = useState('');
  const { panel, label } = section;
  const items = panel.items.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <Stack component="nav" aria-label={label} sx={{ width, flexShrink: 0, minHeight: 0, height: '100%' }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, p: 2, pr: 1 }}>
        <Typography variant="h5" component="h2" noWrap>
          {label}
        </Typography>
        <Tooltip title={toggle.label}>
          <IconButton aria-label={toggle.label} onClick={toggle.onClick}>
            <Icon name={toggle.icon} />
          </IconButton>
        </Tooltip>
      </Stack>
      <TextField
        label={`Search ${label}`}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        sx={{ mx: 2, mb: 2 }}
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
          No pages match “{query.trim()}”.
        </Typography>
      )}
      {panel.colorScheme && <ColorSchemeControl />}
      {panel.footer && <Box sx={{ p: 2 }}>{panel.footer}</Box>}
    </Stack>
  );
}

// Text only, so the three fit the panel at its narrowest (220px).
const schemes = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const;

/** Light, Dark or System, through MUI's color scheme. */
function ColorSchemeControl() {
  const { mode, setMode } = useColorScheme();
  const labelId = useId();
  return (
    <Stack sx={{ gap: 1, p: 2 }}>
      <Typography id={labelId} variant="caption" color="text.secondary">
        Appearance
      </Typography>
      <ToggleButtonGroup
        value={mode ?? 'system'}
        exclusive
        fullWidth
        aria-labelledby={labelId}
        onChange={(_, value: (typeof schemes)[number]['value'] | null) => value && setMode(value)}
      >
        {schemes.map((scheme) => (
          <ToggleButton key={scheme.value} value={scheme.value} sx={{ minWidth: 0 }}>
            {scheme.label}
          </ToggleButton>
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
  ) : (
    <Icon name={section.icon} />
  );
}

/** The side column as a bottom sheet, below the `lg` breakpoint. */
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

type CompanyMenuProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  company: AppShellCompany;
  companies: AppShellCompany[];
  /** Opens beside the rail on wide screens, above the button in the phone menu. */
  placement: 'right' | 'top';
  onClose: () => void;
  onChoose: (company: string) => void;
};

/** The companies the person belongs to, with the current one checked. */
function CompanyMenu({ anchorEl, open, company, companies, placement, onClose, onChoose }: CompanyMenuProps) {
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
        paper: { sx: { minWidth: 240, maxHeight: '70dvh', overscrollBehavior: 'contain' } },
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
            <Icon name="apartment" />
          </ListItemIcon>
          <ListItemText primary={item.name} secondary={item.detail} />
          {item.id === company.id && <Icon name="check" sx={{ ml: 1 }} />}
        </MenuItem>
      ))}
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
  | 'children'
> & { asideLabel: string; asideOpen: boolean; companies: AppShellCompany[] };

/**
 * The shell below the `md` breakpoint, built for a phone's browser. The page scrolls the document, so the
 * browser's toolbars can shrink, under a sticky header: the menu button, the page's title (a menu of the
 * section's pages) and page-wide actions. The menu is one column that drills from the sections to a
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
  children,
}: PhoneShellProps) {
  const [menuOpen, showMenu, hideMenu] = useBackToClose();
  const [companiesOpen, showCompanies, hideCompanies] = useBackToClose();
  const [companyButton, setCompanyButton] = useState<HTMLElement | null>(null);
  const [pagesOpen, showPages, hidePages] = useBackToClose();
  // The section whose pages the menu shows; `null` shows the sections.
  const [level, setLevel] = useState<string | null>(null);
  const [titleButton, setTitleButton] = useState<HTMLElement | null>(null);

  const current = sections.find((item) => item.id === section);
  const account = sections.find((item) => item.initials !== undefined);
  // Notifications and the like lead the menu; My account is pinned at its foot with the company.
  const menuSections = [
    ...sections.filter((item) => item.placement === 'end' && item.initials === undefined),
    ...sections.filter((item) => item.placement !== 'end'),
  ].filter((item) => !item.hideOnPhone);
  const levelSection = sections.find((item) => item.id === level);
  const title = current?.panel?.items.find((item) => item.id === page)?.label ?? current?.label ?? '';
  const news = sections.filter((item) => item.count).map((item) => item.badge ?? `${item.label}, ${item.count}`);
  const menuLabel = ['Open menu', ...news].join(', ');
  const switchable = companies.length > 1;

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
      {switchable ? (
        <Button
          ref={setCompanyButton}
          variant="outlined"
          startIcon={<Icon name="apartment" />}
          endIcon={<Icon name="unfold_more" />}
          aria-label={`${company.name}, switch company`}
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
      ) : (
        <Typography variant="body2" color="text.secondary" noWrap sx={{ px: 2 }}>
          {company.name}
        </Typography>
      )}
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
              <ListItemText primary={item.label} secondary={item.badge} />
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
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.level1' }}>
      {skipLink}
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ top: 0, bgcolor: 'background.level1', borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar sx={{ gap: 0.5, px: 1 }}>
          <IconButton aria-label={menuLabel} onClick={openMenu}>
            <Badge variant="dot" color="secondary" invisible={!news.length}>
              <Icon name="menu" />
            </Badge>
          </IconButton>
          {hasPanel(current) ? (
            <Button
              ref={setTitleButton}
              color="inherit"
              endIcon={<Icon name="expand_more" />}
              aria-haspopup="menu"
              aria-expanded={pagesOpen}
              onClick={showPages}
              sx={{ minWidth: 0, typography: 'subtitle1' }}
            >
              <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {title}
              </Box>
            </Button>
          ) : (
            <Typography variant="subtitle1" component="p" noWrap sx={{ px: 1 }}>
              {title}
            </Typography>
          )}
          <Box sx={{ flex: 1 }} />
          {headerEnd}
        </Toolbar>
      </AppBar>
      <Box
        component="main"
        id="main"
        tabIndex={-1}
        sx={{ p: 2, pb: 'calc(var(--mui-spacing) * 2 + env(safe-area-inset-bottom))', outline: 'none' }}
      >
        {headerStart && <Box sx={{ mb: 2 }}>{headerStart}</Box>}
        {children}
      </Box>
      {hasPanel(current) && (
        <Menu
          anchorEl={titleButton}
          open={pagesOpen}
          onClose={() => hidePages()}
          slotProps={{
            paper: { sx: { maxHeight: '70dvh', overscrollBehavior: 'contain' } },
            list: { 'aria-label': current.label },
          }}
        >
          {current.panel.items.map((item) => (
            <MenuItem
              key={item.id}
              selected={item.id === page}
              aria-current={item.id === page ? 'page' : undefined}
              onClick={() => hidePages(() => onPageChange?.(item.id, current.id))}
            >
              {pageRow(item)}
            </MenuItem>
          ))}
        </Menu>
      )}
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
      {switchable && (
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
        />
      )}
      {aside && (
        <AsideSheet open={asideOpen} label={asideLabel} onClose={onAsideClose}>
          {aside}
        </AsideSheet>
      )}
    </Box>
  );
}

/**
 * The frame every Enertiv page sits in. On wide screens: a rail of top-level sections down the left,
 * with the company switcher at the top and any `end` sections (Notifications, My account) at the
 * bottom; a section panel listing the current section's pages, with search, which resizes and undocks;
 * a header for the scope and page-wide actions; the page in `main`; and an optional side column for
 * the assistant. Undocked, the panel floats inside the frame for whichever rail item is hovered, so
 * another section's pages are one move away. Below the `md` breakpoint it switches to a layout for a
 * phone's browser: the document scrolls under a sticky header whose page title is a menu of the
 * section's pages, and the menu button opens a one-column menu that slides between the sections and a
 * section's pages, with My account and the company pinned at its foot. Below `lg` the side column
 * opens as a bottom sheet. It holds no routes: it reports choices through its callbacks, and items
 * with an `href` render as links.
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
  defaultPanelOpen = true,
  onPanelOpenChange,
  defaultPanelWidth = 256,
  onPanelWidthChange,
  onSectionChange,
  onPageChange,
  onCompanyChange,
  children,
}: AppShellProps) {
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const asideBeside = useMediaQuery(theme.breakpoints.up('lg'), { noSsr: true });
  const [panelOpen, setPanelOpen] = useState(defaultPanelOpen);
  const [panelWidth, setPanelWidth] = useState(() => clampWidth(defaultPanelWidth));
  // The section whose panel floats over the page while the panel is undocked.
  const [flyout, setFlyout] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const panelRef = useRef<HTMLDivElement>(null);
  const [companyAnchor, setCompanyAnchor] = useState<HTMLElement | null>(null);
  const switchable = companies.length > 1;

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const current = sections.find((item) => item.id === section);
  const docked = panelOpen;
  const flyoutSection = sections.find((item) => item.id === flyout);

  const togglePanel = (open: boolean) => {
    setFlyout(null);
    setPanelOpen(open);
    onPanelOpenChange?.(open);
  };
  const resize = (width: number) => {
    const next = clampWidth(width);
    setPanelWidth(next);
    onPanelWidthChange?.(next);
  };
  const openFlyout = (id: string) => {
    clearTimeout(closeTimer.current);
    setFlyout(hasPanel(sections.find((item) => item.id === id)) ? id : null);
  };
  const keepFlyout = () => clearTimeout(closeTimer.current);
  const leaveFlyout = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setFlyout(null), flyoutCloseDelay);
  };
  const chooseSection = (id: string) => {
    setFlyout(null);
    onSectionChange?.(id);
  };
  const choosePage = (id: string, sectionId: string) => {
    setFlyout(null);
    onPageChange?.(id, sectionId);
  };

  // Undocked, rail items open their section's panel on hover instead of a tooltip.
  const flies = !panelOpen;

  const railItem = (item: AppShellSection) => {
    const name = item.badge ? `${item.label}, ${item.badge}` : item.label;
    const flying = flies && hasPanel(item);
    const glyph =
      item.initials !== undefined ? (
        <Avatar
          sx={{ width: 32, height: 32, bgcolor: 'primary.main', color: 'primary.contrastText', typography: 'caption' }}
        >
          {item.initials}
        </Avatar>
      ) : (
        <Icon name={item.icon} />
      );
    return (
      <ListItem key={item.id} disablePadding>
        <Tooltip title={flying ? '' : name} placement="right">
          <ListItemButton
            aria-label={name}
            aria-current={item.id === section ? 'page' : undefined}
            selected={item.id === section}
            onClick={() => chooseSection(item.id)}
            onPointerEnter={flies ? () => openFlyout(item.id) : undefined}
            {...(item.href ? { component: 'a', href: item.href } : {})}
            sx={{
              width: 48,
              height: 48,
              flex: 'none',
              justifyContent: 'center',
              borderRadius: 1,
              p: 0,
              // The item whose panel is floating keeps its hover color while the pointer is over the panel.
              ...(item.id === flyout && item.id !== section && { bgcolor: 'action.hover' }),
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, color: item.id === section ? 'text.primary' : 'text.secondary' }}>
              {item.count ? (
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

  const rail = (
    <Stack
      component="nav"
      aria-label="Main"
      onPointerLeave={flies ? leaveFlyout : undefined}
      sx={{ width: railWidth, flexShrink: 0, alignItems: 'center', py: 2, gap: 2 }}
    >
      <Tooltip title={company.name} placement="right">
        <IconButton
          aria-label={`Switch company: ${company.name}`}
          aria-haspopup={switchable ? 'menu' : undefined}
          aria-expanded={switchable ? Boolean(companyAnchor) : undefined}
          onClick={switchable ? (event) => setCompanyAnchor(event.currentTarget) : undefined}
          sx={{
            width: 48,
            height: 48,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          <Icon name="bolt" />
        </IconButton>
      </Tooltip>
      <List
        disablePadding
        sx={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}
      >
        {sections.filter((item) => item.placement !== 'end').map(railItem)}
      </List>
      <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {sections.filter((item) => item.placement === 'end').map(railItem)}
      </List>
    </Stack>
  );

  const onSeparatorKey = (event: KeyboardEvent) => {
    const step = { ArrowLeft: -8, ArrowRight: 8 }[event.key];
    if (step) {
      event.preventDefault();
      resize(panelWidth + step);
    } else if (event.key === 'Home') {
      event.preventDefault();
      resize(minPanelWidth);
    } else if (event.key === 'End') {
      event.preventDefault();
      resize(maxPanelWidth);
    }
  };
  const onSeparatorMove = (event: PointerEvent) => {
    const left = panelRef.current?.getBoundingClientRect().left;
    if (left !== undefined && event.currentTarget.hasPointerCapture(event.pointerId)) resize(event.clientX - left);
  };

  const separator = (
    <Box
      role="separator"
      aria-label="Resize navigation"
      aria-orientation="vertical"
      aria-valuenow={panelWidth}
      aria-valuemin={minPanelWidth}
      aria-valuemax={maxPanelWidth}
      tabIndex={0}
      onKeyDown={onSeparatorKey}
      onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
      onPointerMove={onSeparatorMove}
      sx={{
        position: 'relative',
        width: '1px',
        flexShrink: 0,
        bgcolor: 'divider',
        cursor: 'col-resize',
        touchAction: 'none',
        outline: 'none',
        // A 24px hit area around the 1px line, mostly over the page's padding rather than the panel's rows.
        '&::after': { content: '""', position: 'absolute', insetBlock: 0, left: -4, right: -19, zIndex: 1 },
        // Hovered, focused or dragged, the line takes the primary color, softened at both ends to halfway
        // toward the divider, so it reads as a handle without a hard-edged bar.
        '&:hover, &:focus-visible, &:active': {
          backgroundImage:
            'linear-gradient(to bottom, color-mix(in srgb, var(--mui-palette-primary-main) 50%, var(--mui-palette-divider)), var(--mui-palette-primary-main) 30%, var(--mui-palette-primary-main) 70%, color-mix(in srgb, var(--mui-palette-primary-main) 50%, var(--mui-palette-divider)))',
        },
      }}
    />
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
        }}
      >
        {children}
      </PhoneShell>
    );
  }

  return (
    // On wide screens the frame fills the window and only `main` scrolls.
    <Box
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
        sx={{
          display: 'flex',
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          bgcolor: 'background.level1',
          // The frame rounds at the card radius, so the panel's rows, 8px in, keep concentric corners.
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        {docked && hasPanel(current) && (
          <>
            <Box ref={panelRef} sx={{ display: 'flex', minHeight: 0 }}>
              <SectionPanel
                key={current.id}
                section={current}
                page={page}
                width={panelWidth}
                toggle={{ label: 'Collapse navigation', icon: 'left_panel_close', onClick: () => togglePanel(false) }}
                onChoose={(id) => choosePage(id, current.id)}
              />
            </Box>
            {separator}
          </>
        )}
        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Toolbar sx={{ gap: 1, px: 3 }}>
              {hasPanel(current) && !panelOpen && (
                <Tooltip title="Dock navigation">
                  <IconButton aria-label="Dock navigation" onClick={() => togglePanel(true)}>
                    <Icon name="left_panel_open" />
                  </IconButton>
                </Tooltip>
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>{headerStart}</Box>
              {headerEnd}
            </Toolbar>
          </AppBar>
          <Box
            component="main"
            id="main"
            tabIndex={-1}
            sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 4, outline: 'none' }}
          >
            {children}
          </Box>
        </Stack>
        {aside && asideOpen && asideBeside && (
          <Box
            component="aside"
            aria-label={asideLabel}
            sx={{ width: asideWidth, flexShrink: 0, minHeight: 0, borderLeft: 1, borderColor: 'divider' }}
          >
            {aside}
          </Box>
        )}
      </Box>
      {flies && hasPanel(flyoutSection) && (
        // Floats inside the frame, 8px in from its edges (its 1px border included), so the corners are
        // concentric: the frame's 16px is the panel's theme radius (8px) plus the gap. Elevation 2 puts it on
        // level2, a step below the menu surface, with the lowest shadow that still lifts it off the page.
        <Paper
          elevation={2}
          onPointerEnter={keepFlyout}
          onPointerLeave={leaveFlyout}
          onKeyDown={(event) => event.key === 'Escape' && setFlyout(null)}
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
            // 8px narrower than the docked panel, so its right edge lands where the docked panel's would.
            width={panelWidth - 8}
            toggle={{ label: 'Dock navigation', icon: 'left_panel_open', onClick: () => togglePanel(true) }}
            onChoose={(id) => choosePage(id, flyoutSection.id)}
          />
        </Paper>
      )}
      {switchable && (
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
        />
      )}
      {aside && !asideBeside && (
        <AsideSheet open={asideOpen} label={asideLabel} onClose={onAsideClose}>
          {aside}
        </AsideSheet>
      )}
    </Box>
  );
}
