import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Icon, type IconName } from '../icons';

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
};

/** What every section works in: the whole portfolio, one group, or one property. */
export type Scope =
  | { level: 'portfolio' }
  | { level: 'group'; id: string }
  /** `groupId` is the group the property was chosen through, shown as its parent in the path. */
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
};

const levelIcon = { portfolio: 'account_tree', group: 'folder_open', property: 'apartment' } satisfies Record<Scope['level'], IconName>;

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
          bgcolor: 'background.level2',
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
 *
 * @summary The global scope as split-button breadcrumbs, with a dialog to search and browse groups and properties.
 * @import import { ScopePicker } from 'src/components/ScopePicker';
 */
export function ScopePicker({ groups, properties, value, onChange, recent = [], locked }: ScopePickerProps) {
  // The level the dialog opens at, or null while it's closed.
  const [step, setStep] = useState<DialogStep | null>(null);
  const theme = useTheme();
  const phone = !useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });

  const groupById = new Map(groups.map((group) => [group.id, group]));
  const propertyById = new Map(properties.map((property) => [property.id, property]));

  const choose = (scope: Scope) => {
    setStep(null);
    if (!sameScope(scope, value)) onChange(scope);
  };

  if (locked) {
    const name =
      value.level === 'portfolio'
        ? 'All properties'
        : ((value.level === 'group' ? groupById.get(value.id) : propertyById.get(value.id))?.name ?? '');
    return <LockedCrumb type={locked.type} name={name} reason={locked.reason} />;
  }

  if (properties.length === 1) {
    return (
      <Crumb surface="background.level4" label={`Property ${properties[0].name}`}>
        <Box sx={{ p: 1, pl: { xs: 1.5, sm: 1 } }}>
          <CrumbContent lead={<PropertyAvatar property={properties[0]} />}>
            <CrumbLabel type="Property" name={properties[0].name} />
          </CrumbContent>
        </Box>
      </Crumb>
    );
  }

  const property = value.level === 'property' ? propertyById.get(value.id) : undefined;
  // The portfolio crumb: the group in scope, or the group a property was chosen through; else all properties.
  const group = value.level === 'group' ? groupById.get(value.id) : value.level === 'property' && value.groupId ? groupById.get(value.groupId) : undefined;
  const groupScope: Scope = group ? { level: 'group', id: group.id } : { level: 'portfolio' };
  const portfolioIsCurrent = value.level !== 'property';
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
    <Box sx={{ flexShrink: 0, bgcolor: 'background.level2', borderRadius: 1 }}>
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
    // A step above the header's surface (level1), with the faintest border to frame it.
    <Crumb surface="background.level2" label={`Portfolio ${group ? group.name : 'All properties'}`}>
      <CrumbButton
        lead={<CrumbIcon name={group ? levelIcon.group : levelIcon.portfolio} />}
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
    <Crumb surface="background.level4" label={`Property ${property.name}`}>
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
      <ScopeDialog
        open={step !== null}
        step={step ?? 'groups'}
        fullScreen={phone}
        groups={groups}
        properties={properties}
        value={value}
        recent={recent}
        onClose={() => setStep(null)}
        onChoose={choose}
      />
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
  onClose: () => void;
  onChoose: (scope: Scope) => void;
};

/** Change scope: search, recent scopes, then Portfolios and Properties side by side, or one at a time on phones, starting at `step`. */
function ScopeDialog({ open, step, fullScreen, groups, properties, value, recent, onClose, onChoose }: ScopeDialogProps) {
  const [query, setQuery] = useState('');
  // The portfolio browsed in the Portfolios column: a group, or null for all properties.
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  // On phones, whether the Properties column shows in place of the Portfolios column.
  const [showProperties, setShowProperties] = useState(false);
  const titleId = useId();

  const groupById = new Map(groups.map((group) => [group.id, group]));
  const propertyById = new Map(properties.map((property) => [property.id, property]));
  const openGroup = openGroupId ? groupById.get(openGroupId) : undefined;
  const columnProperties = openGroup ? properties.filter((property) => openGroup.propertyIds.includes(property.id)) : properties;
  const isCurrent = (scope: Scope) => sameScope(scope, value);

  // Open on the current scope (its group open, its property marked), at the chevron's level.
  const reset = () => {
    setQuery('');
    const groupId = value.level === 'group' ? value.id : value.level === 'property' ? value.groupId : undefined;
    setOpenGroupId(groupId ?? null);
    setShowProperties(step === 'properties');
  };

  const term = query.trim().toLowerCase();
  const groupResults = term ? groups.filter((group) => group.name.toLowerCase().includes(term)) : [];
  // A property in several groups is one result per group, each showing its path.
  const propertyResults = term
    ? properties
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
      const name = scope.level === 'group' ? groupById.get(scope.id)?.name : propertyById.get(scope.id)?.name;
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

  /**
   * A portfolio row. The name selects that portfolio (all properties or one group) as the scope; the
   * chevron, the row's secondary action, opens it to browse its properties. A plain list row, as the
   * Properties column's and the results' are: the rows touch, as list items do (Rules → Accessibility),
   * the browsed portfolio takes the selected fill and the current scope its check.
   */
  const portfolioRow = (scope: Scope, name: string, count: number, groupId: string | null) => (
    <ListItem
      key={groupId ?? 'all'}
      disablePadding
      secondaryAction={
        <IconButton edge="end" aria-label={`Browse ${groupId ? name : 'all properties'}`} onClick={() => browse(groupId)}>
          <Icon name="chevron_right" />
        </IconButton>
      }
    >
      <ListItemButton selected={openGroupId === groupId} onClick={() => onChoose(scope)} sx={{ borderRadius: 1 }}>
        <ListItemIcon sx={{ minWidth: 36 }}>
          <Icon name={groupId ? levelIcon.group : levelIcon.portfolio} />
        </ListItemIcon>
        <ListItemText primary={name} secondary={countProperties(count)} />
        {check(scope)}
      </ListItemButton>
    </ListItem>
  );

  const groupsColumn = (
    // The same inset as the Properties column's list; on wide screens, clear of the line before it.
    <List aria-label="Portfolios" sx={{ p: 1, pr: fullScreen ? 1 : 2 }}>
      {portfolioRow({ level: 'portfolio' }, 'All properties', properties.length, null)}
      {groups.map((group) => portfolioRow({ level: 'group', id: group.id }, group.name, group.propertyIds.length, group.id))}
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
          {openGroup ? `${openGroup.name} · ${countProperties(columnProperties.length)}` : `All ${countProperties(properties.length)}`}
        </Typography>
      </Stack>
      <List aria-label={openGroup ? openGroup.name : 'All properties'} sx={{ p: 1 }}>
        {columnProperties.length === 0 && (
          <Typography variant="body2" color="textSecondary" sx={{ px: 2, py: 1 }}>
            {openGroup?.name} has no properties.
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
      aria-labelledby={titleId}
      slotProps={{
        transition: { onEnter: reset },
        // Pinned near the top on wide screens, so it doesn't jump as the results change. Its height is capped to the
        // viewport below that margin and MUI's own 32px below it, with a floor so a short list doesn't collapse the
        // columns, which scroll inside it.
        paper: {
          sx: {
            overscrollBehavior: 'contain',
            ...(!fullScreen && {
              alignSelf: 'flex-start',
              mt: 10,
              maxHeight: (theme) => `calc(100dvh - ${theme.spacing(14)})`,
              minHeight: (theme) => `min(${theme.spacing(60)}, calc(100dvh - ${theme.spacing(14)}))`,
            }),
          },
        },
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, p: 1, pl: 3 }}>
        <Typography id={titleId} variant="h5" component="h2" sx={{ flex: 1 }}>
          Change scope
        </Typography>
        <IconButton aria-label="Close" onClick={onClose}>
          <Icon name="close" />
        </IconButton>
      </Stack>
      {/* pt leaves room for the search field's floating label, which the scroll area would clip. */}
      <Stack sx={{ px: 3, pt: 1, pb: 3, gap: 2, minHeight: 0, overflowY: 'auto' }}>
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
        {term ? (
          <Box>
            <Typography role="status" variant="body2" color="textSecondary" sx={{ px: 2, pb: 1 }}>
              {resultCount === 0 ? `No group or property matches “${query.trim()}”.` : new Intl.PluralRules().select(resultCount) === 'one' ? '1 result' : `${new Intl.NumberFormat().format(resultCount)} results`}
            </Typography>
            <List aria-label="Results" sx={{ p: 0 }}>
              {groupResults.map((group) => (
                <ListItem key={`group:${group.id}`} disablePadding>
                  <ListItemButton selected={isCurrent({ level: 'group', id: group.id })} onClick={() => onChoose({ level: 'group', id: group.id })} sx={{ borderRadius: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Icon name={levelIcon.group} />
                    </ListItemIcon>
                    <ListItemText primary={group.name} secondary={countProperties(group.propertyIds.length)} />
                    {check({ level: 'group', id: group.id })}
                  </ListItemButton>
                </ListItem>
              ))}
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
    </Dialog>
  );
}
