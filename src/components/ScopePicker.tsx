import { useEffect, useId, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Icon, type IconName } from '../icons';
import { HeaderLabel } from './HeaderLabel';
import { emptyFilter, filterSet, hasCriteria, isFilterActive, matchesCriteria, suggestName, type ScopeFilter } from './scopeFilterModel';

export type { ScopeFilter } from './scopeFilterModel';

/** A group of properties within the Company's portfolio, such as a region or a fund. */
export type ScopeGroup = {
  /** Identifies the group in a `Scope`. */
  id: string;
  /** The group's name. */
  name: string;
  /** The properties in the group. A property may sit in more than one group. */
  propertyIds: string[];
};

/** A property the user can choose as the scope. */
export type ScopeProperty = {
  /** Identifies the property in a `Scope`. */
  id: string;
  /** The property's name. */
  name: string;
  /** The city, shown under the name and searched. */
  city?: string;
  /** The street address, searched. */
  address?: string;
  /** A photo of the building, shown in its crumb. Without one, the crumb shows the property icon. */
  image?: string;
  /** The state, which the filter narrows by. */
  state?: string;
  /** The property type, which the filter narrows by. */
  type?: string;
  /** The floor area in ft², which the filter narrows by. */
  area?: number;
};

/** What every section works in: the whole portfolio, one group, one of the user's saved portfolios, or one property. */
export type Scope =
  | { level: 'portfolio' }
  | { level: 'group'; id: string }
  /** A portfolio the user saved from the filter. */
  | { level: 'saved'; id: string }
  /** `groupId` is the group or saved portfolio the property was chosen through, shown as its parent in the path. */
  | { level: 'property'; id: string; groupId?: string };

export type ScopePickerProps = {
  /** The Company's groups the user can access, in order. */
  groups: ScopeGroup[];
  /** The properties the user can access, in order. With one, the picker names it and opens nothing. */
  properties: ScopeProperty[];
  /** The current scope. */
  value: Scope;
  /** Called with the scope the user chose. */
  onChange: (scope: Scope) => void;
  /** The user's recent scopes, newest first, shown above the columns. Default none. */
  recent?: Scope[];
  /**
   * Fixes the scope, for an item that keeps its own properties (a report, a plan): one crumb naming `value`, with a
   * lock in place of the level's icon and no chevron or close button. `type` is the line over the name ("Report
   * scope"); `reason` says why it's fixed, in the crumb's tooltip. Default none: the scope can change.
   */
  locked?: { type: string; reason: string };
  /** The user's saved portfolios, newest first, listed under Your portfolios at the top of the Portfolios column. Each is a fixed set of properties, shaped as a group. Default none. */
  portfolios?: ScopeGroup[];
  /** The filter the dialog browses with (`emptyFilter` from `src/components/scopeFilterModel` when nothing is set). Default none. */
  filter?: ScopeFilter;
  /** Called with the changed filter. With it, the dialog shows its Filter button. Default none: no filter. */
  onFilterChange?: (filter: ScopeFilter) => void;
  /** Saves a set of properties as a new portfolio and returns its id. Default none: the filter can't be saved. */
  onSavePortfolio?: (name: string, propertyIds: string[]) => string;
  /** Called with a saved portfolio's new name or properties. Default none. */
  onUpdatePortfolio?: (id: string, patch: { name?: string; propertyIds?: string[] }) => void;
  /** Called with a saved portfolio's id after its deletion is confirmed. Move the scope up if it was in that portfolio. Default none. */
  onDeletePortfolio?: (id: string) => void;
};

const levelIcon = { portfolio: 'account_tree', group: 'folder_open', saved: 'folder_special', property: 'apartment' } satisfies Record<Scope['level'], IconName>;

function sameScope(a: Scope, b: Scope) {
  return a.level === b.level && (a.level === 'portfolio' || (b.level !== 'portfolio' && a.id === b.id));
}

function countProperties(count: number) {
  const formatted = new Intl.NumberFormat().format(count);
  return new Intl.PluralRules().select(count) === 'one' ? `${formatted} property` : `${formatted} properties`;
}

/**
 * A crumb's corner radius (16px), concentric with the theme-radius photo 8px inside it (Rules →
 * Concentric corners). The crumb and both its halves use it, since the halves touch its edge.
 */
const crumbRadius = 2;

/** The crumb frame: the faintest border, at the crumb radius. Crumbs and the dialog's portfolio rows share it. */
const crumbFrame = { border: 1, borderColor: 'border.level0', borderRadius: crumbRadius } as const;

/**
 * A crumb: a surface with the faintest border, split flush into the level's button and one icon
 * button, each the crumb's full height, so either half fills on hover.
 */
function Crumb({ surface, label, children }: { surface: string; label: string; children: ReactNode }) {
  return (
    <Stack
      direction="row"
      role="group"
      aria-label={label}
      sx={{ ...crumbFrame, alignItems: 'stretch', minWidth: 0, bgcolor: surface }}
    >
      {children}
    </Stack>
  );
}

/**
 * A crumb button's content: the 32px leading slot, 8px from every edge, then the label. Below `sm` the
 * leading slot (the level's icon or the property's photo) gives its room to the name.
 */
function CrumbContent({ lead, children }: { lead: ReactNode; children: ReactNode }) {
  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 1, minWidth: 0 }}>
      <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexShrink: 0 }}>{lead}</Box>
      {children}
    </Stack>
  );
}

/** Whether an element's text is cut off, kept up to date as it resizes (as `TruncatedText` measures). */
function useTruncated(ref: RefObject<HTMLElement | null>, text: string) {
  const [truncated, setTruncated] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setTruncated(element.scrollWidth > element.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, text]);
  return truncated;
}

type CrumbButtonProps = {
  lead: ReactNode;
  type: string;
  name: string;
  /** What the button does, in its tooltip: "Change portfolio", "Set West Region as the scope". */
  action: string;
  current: boolean;
  onClick: () => void;
};

/**
 * A crumb's name button. Its name truncates with an ellipsis as the header narrows, down to a floor of
 * about six characters, and while it's cut off the tooltip leads with the full name.
 */
function CrumbButton({ lead, type, name, action, current, onClick }: CrumbButtonProps) {
  const nameRef = useRef<HTMLSpanElement>(null);
  const truncated = useTruncated(nameRef, name);
  return (
    <Tooltip describeChild title={truncated ? `${name}. ${action}` : action}>
      <Button
        color="inherit"
        aria-current={current ? 'location' : undefined}
        onClick={onClick}
        // Below `sm` the leading slot is gone, so the name takes the chevron half's 12px from the edge.
        sx={{ p: 1, pl: { xs: 1.5, sm: 1 }, minWidth: 0, maxWidth: '32ch', borderRadius: crumbRadius }}
      >
        <CrumbContent lead={lead}>
          <CrumbLabel type={type} name={name} nameRef={nameRef} />
        </CrumbContent>
      </Button>
    </Tooltip>
  );
}

/**
 * The line between crumbs: a vertical `Divider` as tall as a crumb's leading slot, leaning like a
 * slash so it still reads as a path. A step stronger than `divider` so it holds against the crumbs'
 * fills. Breadcrumbs hides its separators from screen readers.
 */
const crumbSeparator = <Divider orientation="vertical" sx={{ height: 32, borderColor: 'border.level2', transform: 'rotate(11deg)' }} />;

/** A crumb's leading slot, 32px like the property's photo, so every crumb is the same height. */
function CrumbIcon({ name }: { name: IconName }) {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', width: 32, height: 32 }}>
      <Icon name={name} />
    </Box>
  );
}

/** A crumb's two lines: the level's type, small, over its name. Both truncate, never below about six characters. */
function CrumbLabel({ type, name, nameRef }: { type: string; name: string; nameRef?: RefObject<HTMLSpanElement | null> }) {
  return (
    // Line height `normal` with a 4px gap, so the two lines read as one label with room between them.
    <Stack sx={{ alignItems: 'flex-start', gap: 0.5, minWidth: '6ch', textAlign: 'left', lineHeight: 'normal' }}>
      <Typography component="span" variant="caption" color="textSecondary" noWrap sx={{ maxWidth: '100%', lineHeight: 'inherit' }}>
        {type}
      </Typography>
      <Typography ref={nameRef} component="span" variant="body2" color="textPrimary" noWrap sx={{ maxWidth: '100%', lineHeight: 'inherit' }}>
        {name}
      </Typography>
    </Stack>
  );
}

/** A property's photo, or its icon when it has none. */
function PropertyAvatar({ property }: { property: ScopeProperty }) {
  return (
    <Avatar variant="rounded" src={property.image} alt="" sx={{ width: 32, height: 32, bgcolor: 'background.level0', color: 'text.secondary' }}>
      <Icon name={levelIcon.property} />
    </Avatar>
  );
}

/**
 * The locked state: one crumb drawn as the portfolio crumb is, with a lock where the level's icon goes and
 * nothing to open. It's a status, not a control, but focusable, so the keyboard reaches the tooltip's reason.
 */
function LockedCrumb({ type, name, reason }: { type: string; name: string; reason: string }) {
  return (
    // `describeChild`: the reason describes the crumb; its name stays the scope.
    <Tooltip title={reason} describeChild>
      <Stack
        direction="row"
        role="group"
        tabIndex={0}
        aria-label={`${type} ${name}, locked`}
        sx={{
          ...crumbFrame,
          alignItems: 'center',
          minWidth: 0,
          width: 'fit-content',
          maxWidth: '100%',
          p: 1,
          pr: 2,
          pl: { xs: 1.5, sm: 1 },
          bgcolor: 'background.level3',
          // Not a ButtonBase, so it draws the theme's focus ring itself (`focus-ring`).
          '&:focus-visible': { outline: '2px solid', outlineColor: 'control.focus', outlineOffset: 2 },
        }}
      >
        <CrumbContent lead={<Box sx={{ color: 'text.secondary', display: 'flex' }}><CrumbIcon name="lock" /></Box>}>
          <CrumbLabel type={type} name={name} />
        </CrumbContent>
      </Stack>
    </Tooltip>
  );
}

/**
 * The scope control for AppShell's `headerStart`: at most two crumbs, the portfolio (all properties or
 * one group) and, at property scope, the property. Each crumb is a split button: its name sets that
 * level as the scope, and its chevron opens the Change scope dialog at that level, on the groups or on
 * the portfolio's properties. One close button after the active crumb goes up a level: from a property
 * to its portfolio, from a group to all properties. A single-property account shows the property and
 * opens nothing, and `locked` fixes the scope for an item that keeps its own: one crumb with a lock.
 * Below `md` the crumbs are one button naming the current level, for AppShell's phone header, and the
 * close button's job is the dialog's first row.
 *
 * @summary The global scope as split-button breadcrumbs, with a dialog to search and browse groups and properties.
 * @import import { ScopePicker } from 'src/components/ScopePicker';
 */
export function ScopePicker({ groups, properties, value, onChange, recent = [], locked, portfolios = [], filter, onFilterChange, onSavePortfolio, onUpdatePortfolio, onDeletePortfolio }: ScopePickerProps) {
  // The level the dialog opens at, or null while it's closed.
  const [step, setStep] = useState<DialogStep | null>(null);
  const theme = useTheme();
  const phone = !useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });

  const groupById = new Map(groups.map((group) => [group.id, group]));
  const savedById = new Map(portfolios.map((portfolio) => [portfolio.id, portfolio]));
  const propertyById = new Map(properties.map((property) => [property.id, property]));

  const choose = (scope: Scope) => {
    setStep(null);
    if (!sameScope(scope, value)) onChange(scope);
  };

  if (locked) {
    const name =
      value.level === 'portfolio'
        ? 'All properties'
        : ((value.level === 'group' ? groupById.get(value.id) : value.level === 'saved' ? savedById.get(value.id) : propertyById.get(value.id))?.name ?? '');
    return <LockedCrumb type={locked.type} name={name} reason={locked.reason} />;
  }

  if (properties.length === 1) {
    return (
      <Crumb surface="background.level5" label={`Property ${properties[0].name}`}>
        <Box sx={{ p: 1, pl: { xs: 1.5, sm: 1 } }}>
          <CrumbContent lead={<PropertyAvatar property={properties[0]} />}>
            <CrumbLabel type="Property" name={properties[0].name} />
          </CrumbContent>
        </Box>
      </Crumb>
    );
  }

  const property = value.level === 'property' ? propertyById.get(value.id) : undefined;
  // The portfolio crumb: the group or saved portfolio in scope, or the one a property was chosen through; else all properties.
  const parentId = value.level === 'group' || value.level === 'saved' ? value.id : value.level === 'property' ? value.groupId : undefined;
  const savedParent = parentId && value.level !== 'group' ? savedById.get(parentId) : undefined;
  const group = savedParent ?? (parentId && value.level !== 'saved' ? groupById.get(parentId) : undefined);
  const groupScope: Scope = savedParent ? { level: 'saved', id: savedParent.id } : group ? { level: 'group', id: group.id } : { level: 'portfolio' };
  const portfolioIsCurrent = value.level !== 'property';
  const portfolioIcon = savedParent ? levelIcon.saved : group ? levelIcon.group : levelIcon.portfolio;
  // Up a level, from the active crumb: a property to its portfolio, a group to all properties.
  const up: { scope: Scope; label: string } | undefined = property
    ? { scope: groupScope, label: group ? `Back to ${group.name}` : 'Back to all properties' }
    : group
      ? { scope: { level: 'portfolio' }, label: 'Back to all properties' }
      : undefined;

  const chevron = (level: DialogStep, label: string) => (
    <IconButton
      aria-label={label}
      aria-haspopup="dialog"
      aria-expanded={step === level}
      onClick={() => setStep(level)}
      sx={{ px: 1.5, borderRadius: crumbRadius }}
    >
      <Icon name="expand_all" />
    </IconButton>
  );

  // Icon only: its accessible name says where it goes. The fill (the portfolio crumb's surface) sits on a
  // wrapper, so the button's own hover color still shows on top of it.
  const upButton = up && (
    <Box sx={{ flexShrink: 0, bgcolor: 'background.level3', borderRadius: 1 }}>
      <IconButton aria-label={up.label} onClick={() => choose(up.scope)}>
        <Icon name="close_small" />
      </IconButton>
    </Box>
  );
  // The active crumb carries the close button in its own breadcrumb item, so the item's floor counts it.
  const withUp = (crumb: ReactNode) => (
    <Stack direction="row" data-scope-up="" sx={{ alignItems: 'center', gap: 0.5, minWidth: 0, '& > [role=group]': { flex: '1 1 auto' } }}>
      {crumb}
      {upButton}
    </Stack>
  );

  const portfolioCrumb = (
    // A step above the header's surface (level2), with the faintest border to frame it.
    <Crumb surface="background.level3" label={`Portfolio ${group ? group.name : 'All properties'}`}>
      <CrumbButton
        lead={<CrumbIcon name={portfolioIcon} />}
        type="Portfolio"
        name={group ? group.name : 'All properties'}
        action={portfolioIsCurrent ? 'Change portfolio' : `Set ${group?.name ?? 'all properties'} as the scope`}
        current={portfolioIsCurrent}
        onClick={() => (portfolioIsCurrent ? setStep('groups') : choose(groupScope))}
      />
      {chevron('groups', 'Change portfolio')}
    </Crumb>
  );
  const propertyCrumb = property && (
    // The highest surface, so the property in scope stands out from its portfolio.
    <Crumb surface="background.level5" label={`Property ${property.name}`}>
      <CrumbButton
        lead={<PropertyAvatar property={property} />}
        type="Property"
        name={property.name}
        action="Change property"
        current
        onClick={() => setStep('properties')}
      />
      {chevron('properties', 'Change property')}
    </Crumb>
  );

  // What the phone's button and the dialog's compact header name: the current level, its type, and at property scope
  // the portfolio it was chosen through.
  const here = property
    ? { type: 'Property', name: property.name, icon: levelIcon.property, lead: <PropertyAvatar property={property} />, parent: group?.name }
    : { type: 'Portfolio', name: group ? group.name : 'All properties', icon: portfolioIcon, lead: <CrumbIcon name={portfolioIcon} />, parent: undefined };

  const dialog = (
    <ScopeDialog
      open={step !== null}
      step={step ?? 'groups'}
      fullScreen={phone}
      groups={groups}
      properties={properties}
      value={value}
      recent={recent}
      portfolios={portfolios}
      filter={filter}
      onFilterChange={onFilterChange}
      onSavePortfolio={onSavePortfolio}
      onUpdatePortfolio={onUpdatePortfolio}
      onDeletePortfolio={onDeletePortfolio}
      here={phone ? { icon: here.icon, name: here.name, detail: here.parent ? `${here.type} in ${here.parent}` : here.type } : undefined}
      up={phone ? up : undefined}
      onClose={() => setStep(null)}
      onChoose={choose}
    />
  );

  // On phones the scope is one button in the header naming the current level, which opens Change scope at that level.
  // No path of crumbs and no close button: going up a level is the dialog's first row.
  if (phone) {
    return (
      <>
        <Button
          color="inherit"
          aria-label={`${here.type} ${here.name}${here.parent ? `, in ${here.parent}` : ''}. Change scope`}
          aria-haspopup="dialog"
          aria-expanded={step !== null}
          onClick={() => setStep(property ? 'properties' : 'groups')}
          endIcon={<Icon name="expand_all" />}
          // The crumb's frame without its fill, across the header's middle, the chevron at its end.
          sx={{ ...crumbFrame, flex: 1, justifyContent: 'space-between', p: 1, pl: { xs: 1.5, sm: 1 }, pr: 1.5, minWidth: 0, maxWidth: '100%', '& .MuiButton-endIcon': { ml: 1.5 } }}
        >
          <CrumbContent lead={here.lead}>
            <CrumbLabel type={here.type} name={here.name} />
          </CrumbContent>
        </Button>
        {dialog}
      </>
    );
  }

  return (
    <>
      {/* One line that shrinks rather than wraps; the portfolio crumb gives way before the property's. */}
      <Breadcrumbs
        aria-label="Scope"
        separator={crumbSeparator}
        sx={(theme) => ({
          minWidth: 0,
          // In the names' style, so the floor's `ch` matches them.
          ...theme.typography.body2,
          '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' },
          // Each crumb's floor: about six characters of its name, plus its fixed parts (border, padding,
          // leading slot and gap, chevron), and the close button where the item has it, so a name never
          // disappears. Below `sm` the leading slot is gone.
          '& .MuiBreadcrumbs-li': {
            minWidth: `calc(6ch + ${theme.spacing(13.25)})`,
            [theme.breakpoints.down('sm')]: { minWidth: `calc(6ch + ${theme.spacing(8.75)})` },
          },
          '& .MuiBreadcrumbs-li:has([data-scope-up])': {
            minWidth: `calc(6ch + ${theme.spacing(18.75)})`,
            [theme.breakpoints.down('sm')]: { minWidth: `calc(6ch + ${theme.spacing(14.25)})` },
          },
          '& .MuiBreadcrumbs-li:first-of-type': { flexShrink: 3 },
          '& .MuiBreadcrumbs-separator': { flexShrink: 0 },
        })}
      >
        {propertyCrumb ? portfolioCrumb : upButton ? withUp(portfolioCrumb) : portfolioCrumb}
        {propertyCrumb && withUp(propertyCrumb)}
      </Breadcrumbs>
      {dialog}
    </>
  );
}

/** Where the dialog opens: on the groups (the portfolio's chevron) or on a portfolio's properties (the property's). */
type DialogStep = 'groups' | 'properties';

type ScopeDialogProps = {
  open: boolean;
  step: DialogStep;
  fullScreen: boolean;
  groups: ScopeGroup[];
  properties: ScopeProperty[];
  value: Scope;
  recent: Scope[];
  portfolios: ScopeGroup[];
  filter?: ScopeFilter;
  onFilterChange?: (filter: ScopeFilter) => void;
  onSavePortfolio?: (name: string, propertyIds: string[]) => string;
  onUpdatePortfolio?: (id: string, patch: { name?: string; propertyIds?: string[] }) => void;
  onDeletePortfolio?: (id: string) => void;
  /** On phones, the current scope the dialog's compact header names. */
  here?: { icon: IconName; name: string; detail: string };
  /** On phones, the level above the current scope, the compact header's Back row. */
  up?: { scope: Scope; label: string };
  onClose: () => void;
  onChoose: (scope: Scope) => void;
};

type Location = { kind: 'State' | 'City'; value: string };
type SortKey = 'name' | 'city' | 'type' | 'area';

const collator = new Intl.Collator(undefined, { numeric: true });
const sortValue = (property: ScopeProperty, key: SortKey) => (key === 'area' ? property.area : property[key]);

function plural(count: number, noun: string) {
  const formatted = new Intl.NumberFormat().format(count);
  return new Intl.PluralRules().select(count) === 'one' ? `${formatted} ${noun}` : `${formatted} ${noun.replace(/y$/, 'ie')}s`;
}

/** A whole number of ft² from a field, or open when the field is empty or not a number. */
const parseArea = (text: string) => {
  const value = Number(text.replace(/[^\d.]/g, ''));
  return text.trim() === '' || Number.isNaN(value) ? undefined : Math.round(value);
};

type ScopeFilterViewProps = {
  /** The properties the user can access, in portfolio order. */
  properties: ScopeProperty[];
  value: ScopeFilter;
  onChange: (filter: ScopeFilter) => void;
  /** Phone width: the table drops its Location and Type columns, and each row names them under the property. */
  compact: boolean;
};

/**
 * The filter view of the Change scope dialog: criteria (location, type, floor area) over a table of the properties
 * the user can access, with a checkbox per row to pick properties by hand. The dialog around it draws the title and
 * the actions. A filter inside the dialog, worded as one ("Filtered to"), never as the scope.
 */
function ScopeFilterView({ properties, value, onChange, compact }: ScopeFilterViewProps) {
  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);
  const captionId = useId();

  const locations = useMemo<Location[]>(() => {
    const states = [...new Set(properties.map((p) => p.state).filter((s): s is string => Boolean(s)))].sort(collator.compare);
    const cities = [...new Set(properties.map((p) => p.city).filter((c): c is string => Boolean(c)))].sort(collator.compare);
    return [...states.map((s) => ({ kind: 'State' as const, value: s })), ...cities.map((c) => ({ kind: 'City' as const, value: c }))];
  }, [properties]);
  const types = useMemo(() => [...new Set(properties.map((p) => p.type).filter((t): t is string => Boolean(t)))].sort(collator.compare), [properties]);

  const shown = properties.filter((property) => matchesCriteria(property, value));
  const rows = sort
    ? [...shown].sort((a, b) => {
        const x = sortValue(a, sort.key);
        const y = sortValue(b, sort.key);
        // A missing value sorts last either way.
        if (x === undefined || y === undefined) return x === y ? 0 : x === undefined ? 1 : -1;
        const order = typeof x === 'number' && typeof y === 'number' ? x - y : collator.compare(String(x), String(y));
        return sort.direction === 'asc' ? order : -order;
      })
    : shown;

  const picked = new Set(value.selected);
  const shownPicked = shown.filter((p) => picked.has(p.id)).length;
  const toggle = (id: string) => onChange({ ...value, selected: picked.has(id) ? value.selected.filter((s) => s !== id) : [...value.selected, id] });
  const toggleShown = () => {
    const shownIds = new Set(shown.map((p) => p.id));
    onChange({
      ...value,
      selected: shownPicked === shown.length ? value.selected.filter((id) => !shownIds.has(id)) : [...value.selected, ...shown.filter((p) => !picked.has(p.id)).map((p) => p.id)],
    });
  };
  // Ascending, descending, then off.
  const sortBy = (key: SortKey) =>
    setSort((current) => (current?.key !== key ? { key, direction: 'asc' } : current.direction === 'asc' ? { key, direction: 'desc' } : null));
  const header = (key: SortKey, label: string, align?: 'right') => (
    <TableCell align={align} sortDirection={sort?.key === key ? sort.direction : false}>
      <TableSortLabel active={sort?.key === key} direction={sort?.key === key ? sort.direction : 'asc'} onClick={() => sortBy(key)}>
        <HeaderLabel inButton>{label}</HeaderLabel>
      </TableSortLabel>
    </TableCell>
  );

  const locationValue = locations.filter((l) => (l.kind === 'State' ? value.states : value.cities).includes(l.value));

  return (
    <Stack sx={{ gap: 2, minHeight: 0, flex: 1 }}>
      {/* The criteria, one row of medium fields on wide screens (Rules → Component size: one size per group); below `md`
          Location and Type take a row each and the two area bounds share one, so the table keeps its room on phones. */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'minmax(0, 1fr) minmax(0, 1fr)', md: 'minmax(0, 2fr) minmax(0, 1.25fr) minmax(0, 1fr) minmax(0, 1fr)' } }}>
        <Autocomplete
          multiple
          limitTags={2}
          options={locations}
          groupBy={(l) => l.kind}
          getOptionLabel={(l) => l.value}
          isOptionEqualToValue={(a, b) => a.kind === b.kind && a.value === b.value}
          value={locationValue}
          onChange={(_, next) => onChange({ ...value, states: next.filter((l) => l.kind === 'State').map((l) => l.value), cities: next.filter((l) => l.kind === 'City').map((l) => l.value) })}
          noOptionsText="No state or city matches. Check the spelling."
          renderInput={(params) => <TextField {...params} label="Location" />}
          sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}
        />
        <TextField
          select
          label="Type"
          value={value.types}
          onChange={(event) => {
            const next = event.target.value as unknown as string[] | string;
            onChange({ ...value, types: typeof next === 'string' ? next.split(',') : next });
          }}
          slotProps={{ select: { multiple: true, renderValue: (selected) => (selected as string[]).join(', ') } }}
          sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}
        >
          {types.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </TextField>
        <AreaField label="Area from" value={value.minArea} onChange={(minArea) => onChange({ ...value, minArea })} />
        <AreaField label="Area to" value={value.maxArea} onChange={(maxArea) => onChange({ ...value, maxArea })} />
      </Box>

      {/* What the table includes, worded as a filter, not a scope. */}
      <Typography id={captionId} role="status" variant="body2" color="textSecondary">
        {hasCriteria(value) ? `Filtered to ${new Intl.NumberFormat().format(shown.length)} of ${plural(properties.length, 'property')}` : plural(properties.length, 'property')}
      </Typography>

      <TableContainer tabIndex={0} aria-labelledby={captionId} sx={{ minHeight: 0, flex: 1, overflow: 'auto' }}>
        {/* The sticky header takes the dialog's surface, as Table's page says a sticky table off a card does. */}
        <Table
          stickyHeader
          aria-labelledby={captionId}
          sx={(theme) => ({
            '& .MuiTableCell-stickyHeader': {
              backgroundColor: (theme.vars ?? theme).palette.background.level5,
              ...theme.applyStyles('dark', { backgroundColor: (theme.vars ?? theme).palette.background.level2 }),
            },
          })}
        >
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={shown.length > 0 && shownPicked === shown.length}
                  indeterminate={shownPicked > 0 && shownPicked < shown.length}
                  disabled={shown.length === 0}
                  onChange={toggleShown}
                  slotProps={{ input: { 'aria-label': 'Pick every property shown' } }}
                />
              </TableCell>
              {header('name', 'Property')}
              {!compact && header('city', 'Location')}
              {!compact && header('type', 'Type')}
              {header('area', 'Area (ft²)', 'right')}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={compact ? 3 : 5}>
                  <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body2" color="textSecondary">
                      No property matches these criteria.
                    </Typography>
                    <Button onClick={() => onChange({ ...emptyFilter, selected: value.selected })}>Clear criteria</Button>
                  </Stack>
                </TableCell>
              </TableRow>
            )}
            {rows.map((property) => {
              const checked = picked.has(property.id);
              const labelId = `${captionId}-${property.id}`;
              return (
                // MUI's selectable table rows: the whole row toggles its checkbox.
                <TableRow key={property.id} hover role="checkbox" aria-checked={checked} tabIndex={-1} selected={checked} onClick={() => toggle(property.id)} sx={{ cursor: 'pointer' }}>
                  <TableCell padding="checkbox">
                    <Checkbox checked={checked} slotProps={{ input: { 'aria-labelledby': labelId } }} />
                  </TableCell>
                  <TableCell>
                    <Typography id={labelId} variant="body2">
                      {property.name}
                    </Typography>
                    {compact && (
                      <Typography variant="caption" color="textSecondary">
                        {[property.city, property.type].filter(Boolean).join(' · ')}
                      </Typography>
                    )}
                  </TableCell>
                  {!compact && <TableCell>{property.city}</TableCell>}
                  {!compact && <TableCell>{property.type}</TableCell>}
                  {/* A missing area is a dash, never 0 (Table → Content). */}
                  <TableCell align="right">{property.area === undefined ? '–' : new Intl.NumberFormat().format(property.area)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

/** One floor-area bound: a number field in ft², empty for no bound. */
function AreaField({ label, value, onChange }: { label: string; value?: number; onChange: (value?: number) => void }) {
  const [text, setText] = useState(value === undefined ? '' : String(value));
  const shown = parseArea(text) === value ? text : value === undefined ? '' : String(value);
  return (
    <TextField
      label={label}
      value={shown}
      onChange={(event) => {
        setText(event.target.value);
        onChange(parseArea(event.target.value));
      }}
      slotProps={{ htmlInput: { inputMode: 'numeric' }, input: { endAdornment: <InputAdornment position="end">ft²</InputAdornment> } }}
    />
  );
}

/** What the filter's footer says it holds: the picked properties, or what the criteria keep. */
function filterSummary(properties: ScopeProperty[], filter: ScopeFilter) {
  if (filter.selected.length > 0) {
    const set = filterSet(properties, filter);
    const outside = set.filter((p) => !matchesCriteria(p, filter)).length;
    return outside > 0 ? `${new Intl.NumberFormat().format(set.length)} picked · ${new Intl.NumberFormat().format(outside)} outside these criteria` : `${new Intl.NumberFormat().format(set.length)} picked`;
  }
  return hasCriteria(filter) ? `${plural(filterSet(properties, filter).length, 'property')} match` : 'Pick properties or set criteria';
}

type NameDialogProps = {
  open: boolean;
  title: string;
  /** The name the field opens with, selected so typing replaces it. */
  initial: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: (name: string) => void;
};

/** Names a portfolio: Save as portfolio, with the suggested name, and Rename. Enter or the button confirms; an empty name can't be saved. */
function NameDialog({ open, title, initial, confirmLabel, onCancel, onConfirm }: NameDialogProps) {
  const [name, setName] = useState(initial);
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      fullWidth
      maxWidth="xs"
      aria-labelledby={titleId}
      // Focus and select the name once the dialog is in, so typing replaces it; the dialog's own focus handling would
      // otherwise leave focus on the paper when it opens over Change scope.
      slotProps={{ transition: { onEnter: () => setName(initial), onEntered: () => inputRef.current?.focus() } }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim()) onConfirm(name.trim());
        }}
      >
        <DialogTitle id={titleId}>{title}</DialogTitle>
        {/* pt leaves room for the field's floating label, which DialogContent would clip. */}
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onFocus={(event) => event.target.select()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={!name.trim()}>
            {confirmLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

/** A count against the filter: "4 of 10 properties" while it narrows, else "10 properties". */
function countAgainst(propertyIds: string[], allowed: Set<string> | null) {
  if (!allowed) return countProperties(propertyIds.length);
  return `${new Intl.NumberFormat().format(propertyIds.filter((id) => allowed.has(id)).length)} of ${countProperties(propertyIds.length)}`;
}

/**
 * Change scope: search with the Filter button beside it, recent scopes, then Portfolios and Properties side by side, or
 * one at a time on phones, starting at `step`. Filter opens a table of the properties to narrow by criteria or pick by
 * hand; while a filter is on, the columns and results show only its properties (a portfolio with none of them stays,
 * disabled), a line under the search says so, and the result can be saved as a portfolio.
 */
function ScopeDialog({ open, step, fullScreen, groups, properties, value, recent, portfolios, filter, onFilterChange, onSavePortfolio, onUpdatePortfolio, onDeletePortfolio, here, up, onClose, onChoose }: ScopeDialogProps) {
  const [query, setQuery] = useState('');
  // The portfolio browsed in the Portfolios column: a group or saved portfolio, or null for all properties.
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  // On phones, whether the Properties column shows in place of the Portfolios column.
  const [showProperties, setShowProperties] = useState(false);
  // The filter view, and the saved portfolio it's editing (on a draft of its own) when it is.
  const [filtering, setFiltering] = useState(false);
  const [editing, setEditing] = useState<{ portfolio: ScopeGroup; draft: ScopeFilter } | null>(null);
  const [naming, setNaming] = useState<{ title: string; initial: string; confirmLabel: string; confirm: (name: string) => void } | null>(null);
  const [deleting, setDeleting] = useState<ScopeGroup | null>(null);
  const [menu, setMenu] = useState<{ anchor: HTMLElement; portfolio: ScopeGroup } | null>(null);
  const titleId = useId();

  const groupById = new Map([...groups, ...portfolios].map((group) => [group.id, group]));
  const savedIds = new Set(portfolios.map((portfolio) => portfolio.id));
  const propertyById = new Map(properties.map((property) => [property.id, property]));
  const openGroup = openGroupId ? groupById.get(openGroupId) : undefined;
  const isCurrent = (scope: Scope) => sameScope(scope, value);
  const scopeOf = (group: ScopeGroup): Scope => (savedIds.has(group.id) ? { level: 'saved', id: group.id } : { level: 'group', id: group.id });

  // The filter the dialog browses with, and the properties it keeps (null while it's off).
  const live = filter ?? emptyFilter;
  const filterSetIds = onFilterChange && isFilterActive(live) ? filterSet(properties, live).map((property) => property.id) : null;
  const allowed = filterSetIds ? new Set(filterSetIds) : null;
  const kept = (property: ScopeProperty) => !allowed || allowed.has(property.id);
  const noneKept = (group: { propertyIds: string[] }) => Boolean(allowed) && !group.propertyIds.some((id) => allowed!.has(id));
  const columnProperties = (openGroup ? properties.filter((property) => openGroup.propertyIds.includes(property.id)) : properties).filter(kept);

  // Open on the current scope (its group open, its property marked), at the chevron's level, browsing.
  const reset = () => {
    setQuery('');
    const groupId = value.level === 'group' || value.level === 'saved' ? value.id : value.level === 'property' ? value.groupId : undefined;
    setOpenGroupId(groupId && groupById.has(groupId) ? groupId : null);
    setShowProperties(step === 'properties');
    setFiltering(false);
    setEditing(null);
  };

  const term = query.trim().toLowerCase();
  const groupResults = term ? [...portfolios, ...groups].filter((group) => group.name.toLowerCase().includes(term)) : [];
  // A property in several groups is one result per group, each showing its path.
  const propertyResults = term
    ? properties
        .filter(kept)
        .filter((property) => [property.name, property.address, property.city].some((text) => text?.toLowerCase().includes(term)))
        .flatMap((property): { property: ScopeProperty; group?: ScopeGroup }[] => {
          const memberOf = groups.filter((group) => group.propertyIds.includes(property.id));
          return memberOf.length ? memberOf.map((group) => ({ property, group })) : [{ property }];
        })
    : [];
  const resultCount = groupResults.length + propertyResults.length;

  const recentRows = recent
    .map((scope) => {
      if (scope.level === 'portfolio') return { scope, name: 'Portfolio' };
      const name = scope.level === 'property' ? propertyById.get(scope.id)?.name : groupById.get(scope.id)?.name;
      return name ? { scope, name } : null;
    })
    .filter((row) => row !== null)
    .slice(0, 5);

  // Browsing a portfolio shows its properties and never changes scope.
  const browse = (groupId: string | null) => {
    setOpenGroupId(groupId);
    setShowProperties(true);
  };

  const check = (scope: Scope) => isCurrent(scope) && <Icon name="check" />;

  // Save the filter's set as a new portfolio under the name the user confirms; the filter clears, since the portfolio replaces it.
  const takenNames = [...groups, ...portfolios].map((group) => group.name);
  const startSave = (propertyIds: string[]) => {
    if (!onSavePortfolio) return;
    const set = properties.filter((property) => propertyIds.includes(property.id));
    setNaming({
      title: 'Save as portfolio',
      initial: suggestName(set, live, properties, takenNames),
      confirmLabel: 'Save',
      confirm: (name) => {
        const id = onSavePortfolio(name, propertyIds);
        onFilterChange?.(emptyFilter);
        setNaming(null);
        setFiltering(false);
        setOpenGroupId(id);
        setShowProperties(false);
      },
    });
  };
  const startEdit = (portfolio: ScopeGroup) => {
    setEditing({ portfolio, draft: { ...emptyFilter, selected: portfolio.propertyIds } });
    setFiltering(true);
  };
  const leaveFilter = () => {
    setFiltering(false);
    setEditing(null);
  };

  /**
   * A portfolio row. The name selects that portfolio (all properties, one group or a saved portfolio) as the scope;
   * the chevron, the row's secondary action, opens it to browse its properties. A plain list row, as the
   * Properties column's and the results' are: the rows touch, as list items do (Rules → Accessibility), the browsed
   * portfolio takes the selected fill and the current scope its check. While a filter is on, its count is what the
   * filter keeps of it, and a portfolio the filter keeps none of is disabled, not hidden. A saved portfolio adds
   * a More actions button before its chevron.
   */
  const portfolioRow = (scope: Scope, name: string, propertyIds: string[], groupId: string | null, saved?: ScopeGroup) => {
    const disabled = groupId !== null && noneKept({ propertyIds });
    return (
      <ListItem
        key={groupId ?? 'all'}
        disablePadding
        // Two secondary actions need the room of two icon buttons beside the row's text.
        sx={saved ? { '& > .MuiListItemButton-root': { pr: 12 } } : undefined}
        secondaryAction={
          <Stack direction="row">
            {saved && (
              <IconButton aria-label={`More actions for ${name}`} aria-haspopup="menu" onClick={(event) => setMenu({ anchor: event.currentTarget, portfolio: saved })}>
                <Icon name="more_horiz" />
              </IconButton>
            )}
            <IconButton edge="end" disabled={disabled} aria-label={`Browse ${groupId ? name : 'all properties'}`} onClick={() => browse(groupId)}>
              <Icon name="chevron_right" />
            </IconButton>
          </Stack>
        }
      >
        <ListItemButton selected={openGroupId === groupId} disabled={disabled} onClick={() => onChoose(scope)} sx={{ borderRadius: 1 }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <Icon name={saved ? levelIcon.saved : groupId ? levelIcon.group : levelIcon.portfolio} />
          </ListItemIcon>
          <ListItemText primary={name} secondary={countAgainst(propertyIds, allowed)} />
          {check(scope)}
        </ListItemButton>
      </ListItem>
    );
  };

  const groupsColumn = (
    // The same inset as the Properties column's list; on wide screens, clear of the line before it.
    <List aria-label="Portfolios" sx={{ p: 1, pr: fullScreen ? 1 : 2 }}>
      {portfolioRow(
        { level: 'portfolio' },
        'All properties',
        properties.map((property) => property.id),
        null,
      )}
      {portfolios.length > 0 && <ListSubheader disableSticky>Your portfolios</ListSubheader>}
      {portfolios.map((portfolio) => portfolioRow({ level: 'saved', id: portfolio.id }, portfolio.name, portfolio.propertyIds, portfolio.id, portfolio))}
      {portfolios.length > 0 && groups.length > 0 && <ListSubheader disableSticky>Company portfolios</ListSubheader>}
      {groups.map((group) => portfolioRow({ level: 'group', id: group.id }, group.name, group.propertyIds, group.id))}
    </List>
  );

  const propertiesColumn = (
    <Stack sx={{ minWidth: 0 }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, px: 2, pt: 1, minHeight: 48 }}>
        {fullScreen && (
          <IconButton aria-label="Back to portfolios" onClick={() => setShowProperties(false)} sx={{ ml: -1 }}>
            <Icon name="chevron_left" />
          </IconButton>
        )}
        <Typography variant="body2" color="textSecondary" sx={{ flex: 1, minWidth: 0 }}>
          {openGroup ? `${openGroup.name} · ${countAgainst(openGroup.propertyIds, allowed)}` : allowed ? `All properties · ${countAgainst(properties.map((property) => property.id), allowed)}` : `All ${countProperties(properties.length)}`}
        </Typography>
      </Stack>
      <List aria-label={openGroup ? openGroup.name : 'All properties'} sx={{ p: 1 }}>
        {columnProperties.length === 0 && (
          <Typography variant="body2" color="textSecondary" sx={{ px: 2, py: 1 }}>
            {allowed ? `None of ${openGroup ? `${openGroup.name}’s properties` : 'the properties'} match the filter.` : `${openGroup?.name} has no properties.`}
          </Typography>
        )}
        {columnProperties.map((property) => {
          const scope: Scope = { level: 'property', id: property.id, ...(openGroup && { groupId: openGroup.id }) };
          return (
            <ListItem key={property.id} disablePadding>
              <ListItemButton selected={isCurrent(scope)} onClick={() => onChoose(scope)} sx={{ borderRadius: 1 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Icon name={levelIcon.property} />
                </ListItemIcon>
                <ListItemText primary={property.name} secondary={property.city} />
                {check(scope)}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Stack>
  );

  // While a filter is on, a line under the search says so in a filter's words, with the ways to save it, change it or clear it.
  const filterLine = filterSetIds && (
    <Stack direction="row" sx={{ alignItems: 'center', columnGap: 1, flexWrap: 'wrap' }}>
      <Icon name="filter_list" color="action" />
      <Typography role="status" variant="body2" sx={{ mr: 'auto' }}>
        Filtered to {new Intl.NumberFormat().format(filterSetIds.length)} of {countProperties(properties.length)}
      </Typography>
      <Stack direction="row" sx={{ flexWrap: 'wrap' }}>
        {onSavePortfolio && (
          <Button onClick={() => startSave(filterSetIds)} disabled={filterSetIds.length === 0}>
            Save as Portfolio
          </Button>
        )}
        <Button onClick={() => setFiltering(true)}>Edit</Button>
        <Button onClick={() => onFilterChange?.(emptyFilter)}>Clear Filter</Button>
      </Stack>
    </Stack>
  );

  const browseView = (
    <>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, p: 1, pl: 3 }}>
        <Typography id={titleId} variant="h5" component="h2" sx={{ flex: 1 }}>
          Change scope
        </Typography>
        <IconButton aria-label="Close" onClick={onClose}>
          <Icon name="close" />
        </IconButton>
      </Stack>
      {/* On phones a compact header names the current scope, with its check as the columns mark it, and the level above
          it as the first row, which goes up as the desktop crumb's close button does. */}
      {here && (
        <List aria-label="Current scope" sx={{ px: 1, py: 0 }}>
          <ListItem sx={{ px: 2 }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Icon name={here.icon} />
            </ListItemIcon>
            <ListItemText primary={here.name} secondary={here.detail} />
            <Icon name="check" />
          </ListItem>
          {up && (
            <ListItem disablePadding>
              <ListItemButton onClick={() => onChoose(up.scope)} sx={{ borderRadius: 1 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Icon name="arrow_upward" />
                </ListItemIcon>
                <ListItemText primary={up.label} />
              </ListItemButton>
            </ListItem>
          )}
        </List>
      )}
      {/* pt leaves room for the search field's floating label, which the scroll area would clip. */}
      <Stack sx={{ px: 3, pt: 1, pb: 3, gap: 2, minHeight: 0, overflowY: 'auto' }}>
        <Stack direction="row" sx={{ gap: 1 }}>
          <TextField
            autoFocus
            fullWidth
            label="Search by name, address or city"
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
          {onFilterChange && (
            // As tall as the search field beside it, so the two read as one row.
            <Button variant="outlined" startIcon={<Icon name="filter_list" />} aria-haspopup="dialog" onClick={() => setFiltering(true)} sx={{ flexShrink: 0, alignSelf: 'stretch' }}>
              {filterSetIds ? `Filter · ${new Intl.NumberFormat().format(filterSetIds.length)}` : 'Filter'}
            </Button>
          )}
        </Stack>
        {filterLine}
        {term ? (
          <Box>
            <Typography role="status" variant="body2" color="textSecondary" sx={{ px: 2, pb: 1 }}>
              {resultCount === 0 ? `No group or property matches “${query.trim()}”.` : new Intl.PluralRules().select(resultCount) === 'one' ? '1 result' : `${new Intl.NumberFormat().format(resultCount)} results`}
            </Typography>
            <List aria-label="Results" sx={{ p: 0 }}>
              {groupResults.map((group) => {
                const scope = scopeOf(group);
                return (
                  <ListItem key={`group:${group.id}`} disablePadding>
                    <ListItemButton selected={isCurrent(scope)} disabled={noneKept(group)} onClick={() => onChoose(scope)} sx={{ borderRadius: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Icon name={levelIcon[scope.level]} />
                      </ListItemIcon>
                      <ListItemText primary={group.name} secondary={countAgainst(group.propertyIds, allowed)} />
                      {check(scope)}
                    </ListItemButton>
                  </ListItem>
                );
              })}
              {propertyResults.map(({ property, group }) => {
                const scope: Scope = { level: 'property', id: property.id, ...(group && { groupId: group.id }) };
                return (
                  <ListItem key={`property:${property.id}:${group?.id ?? ''}`} disablePadding>
                    <ListItemButton selected={isCurrent(scope)} onClick={() => onChoose(scope)} sx={{ borderRadius: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Icon name={levelIcon.property} />
                      </ListItemIcon>
                      <ListItemText primary={property.name} secondary={[group?.name, property.address ?? property.city].filter(Boolean).join(' · ')} />
                      {check(scope)}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ) : (
          <>
            {recentRows.length > 0 && (
              <Stack direction="row" component="section" aria-label="Recent" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="textSecondary">
                  Recent
                </Typography>
                {recentRows.map(({ scope, name }) => (
                  <Chip
                    key={`${scope.level}:${scope.level === 'portfolio' ? '' : scope.id}`}
                    variant="outlined"
                    icon={<Icon name={levelIcon[scope.level]} />}
                    label={name}
                    onClick={() => onChoose(scope)}
                  />
                ))}
              </Stack>
            )}
            {fullScreen ? (
              showProperties ? (
                propertiesColumn
              ) : (
                groupsColumn
              )
            ) : (
              // No outer frame: the portfolio rows carry their own, so only the line between the columns stays.
              <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 3fr)' }}>
                <Box sx={{ borderRight: 1, borderColor: 'divider' }}>{groupsColumn}</Box>
                {propertiesColumn}
              </Box>
            )}
          </>
        )}
      </Stack>
    </>
  );

  // The filter view edits the live filter, or a saved portfolio's draft while editing one.
  const filterValue = editing ? editing.draft : live;
  const setFilterValue = (next: ScopeFilter) => (editing ? setEditing({ ...editing, draft: next }) : onFilterChange?.(next));
  const filterResult = filterSet(properties, filterValue).map((property) => property.id);
  const filterView = (
    <>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, p: 1 }}>
        <IconButton aria-label={editing ? 'Cancel and go back' : 'Back to browsing'} onClick={leaveFilter}>
          <Icon name="arrow_back" />
        </IconButton>
        <Typography id={titleId} variant="h5" component="h2" sx={{ flex: 1, minWidth: 0 }} noWrap>
          {editing ? `Edit ${editing.portfolio.name}` : 'Filter properties'}
        </Typography>
        <IconButton aria-label="Close" onClick={onClose}>
          <Icon name="close" />
        </IconButton>
      </Stack>
      {/* pt leaves room for the fields' floating labels. */}
      <Stack sx={{ px: 3, pt: 1, minHeight: 0, flex: 1 }}>
        <ScopeFilterView properties={properties} value={filterValue} onChange={setFilterValue} compact={fullScreen} />
      </Stack>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, px: 3, py: 2, flexWrap: 'wrap', borderTop: 1, borderColor: 'divider' }}>
        {/* On phones the count takes its own line, above the buttons. */}
        <Typography variant="body2" color="textSecondary" sx={{ mr: 'auto', flexBasis: { xs: '100%', sm: 'auto' }, fontVariantNumeric: 'tabular-nums' }}>
          {filterSummary(properties, filterValue)}
        </Typography>
        <Stack direction="row" sx={{ ml: 'auto', gap: 1 }}>
          {editing ? (
            <>
              <Button onClick={leaveFilter}>Cancel</Button>
              <Button
                variant="contained"
                disabled={filterResult.length === 0}
                onClick={() => {
                  onUpdatePortfolio?.(editing.portfolio.id, { propertyIds: filterResult });
                  setOpenGroupId(editing.portfolio.id);
                  leaveFilter();
                }}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => onFilterChange?.(emptyFilter)} disabled={!isFilterActive(live)}>
                Clear
              </Button>
              {onSavePortfolio && (
                <Button onClick={() => startSave(filterResult)} disabled={!isFilterActive(live) || filterResult.length === 0}>
                  Save as Portfolio
                </Button>
              )}
              <Button variant="contained" onClick={leaveFilter}>
                Done
              </Button>
            </>
          )}
        </Stack>
      </Stack>
    </>
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth={filtering ? 'lg' : 'md'}
        fullScreen={fullScreen}
        aria-labelledby={titleId}
        slotProps={{
          transition: { onEnter: reset },
          // Pinned near the top on wide screens, so it doesn't jump as the results change. Its height is capped to the
          // viewport below that margin and MUI's own 32px below it, with a floor so a short list doesn't collapse the
          // columns, which scroll inside it. The filter view takes the whole height, so its table has room.
          paper: {
            sx: {
              overscrollBehavior: 'contain',
              ...(!fullScreen && {
                alignSelf: 'flex-start',
                mt: 10,
                maxHeight: (theme) => `calc(100dvh - ${theme.spacing(14)})`,
                minHeight: (theme) => `min(${theme.spacing(60)}, calc(100dvh - ${theme.spacing(14)}))`,
                ...(filtering && { height: (theme) => `calc(100dvh - ${theme.spacing(14)})` }),
              }),
            },
          },
        }}
      >
        {filtering ? filterView : browseView}
      </Dialog>
      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        <MenuItem
          onClick={() => {
            if (menu) startEdit(menu.portfolio);
            setMenu(null);
          }}
        >
          <ListItemIcon>
            <Icon name="edit" />
          </ListItemIcon>
          Edit properties
        </MenuItem>
        <MenuItem
          onClick={() => {
            const portfolio = menu?.portfolio;
            setMenu(null);
            if (portfolio)
              setNaming({
                title: 'Rename portfolio',
                initial: portfolio.name,
                confirmLabel: 'Rename',
                confirm: (name) => {
                  onUpdatePortfolio?.(portfolio.id, { name });
                  setNaming(null);
                },
              });
          }}
        >
          <ListItemIcon>
            <Icon name="edit_square" />
          </ListItemIcon>
          Rename
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleting(menu?.portfolio ?? null);
            setMenu(null);
          }}
        >
          <ListItemIcon>
            <Icon name="delete" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>
      <NameDialog
        open={Boolean(naming)}
        title={naming?.title ?? ''}
        initial={naming?.initial ?? ''}
        confirmLabel={naming?.confirmLabel ?? 'Save'}
        onCancel={() => setNaming(null)}
        onConfirm={(name) => naming?.confirm(name)}
      />
      <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)} maxWidth="xs" fullWidth aria-labelledby={`${titleId}-delete`}>
        <DialogTitle id={`${titleId}-delete`}>Delete {deleting?.name}?</DialogTitle>
        <DialogContent>
          <DialogContentText>It leaves Your portfolios. Its properties stay where they are.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleting(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (deleting) onDeletePortfolio?.(deleting.id);
              if (deleting && openGroupId === deleting.id) setOpenGroupId(null);
              setDeleting(null);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
