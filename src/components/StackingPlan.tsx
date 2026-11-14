import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, type Theme } from '@mui/material/styles';
import { TruncatedText } from './TruncatedText';
import { useSlotColor } from './TypeChip';

/** One space on a floor: a tenant space (leased or vacant) or a common area. */
export type StackingSpace = {
  /** Unique within the plan. */
  id: string;
  /** The space's name, shown first: `Suite 1201`, `Lobby`. */
  name: string;
  /** Floor area in sq ft, which sizes the space on its row. Default: none, “No area on record”, and the space takes a third of the row's smallest sized space. */
  area?: number;
  /** The tenant's name, which marks the space leased. Default: none, and a tenant space reads “Vacant”. */
  tenant?: string;
  /** `'tenant'` for a leasable space, `'common'` for a common area, which is never leased or vacant. Default `'tenant'`. */
  kind?: 'tenant' | 'common';
  /** What a common area is, shown in place of a tenant: `Lobby`, `Mechanical`. Default: none. */
  type?: string;
};

/** One row of the plan, from the roof down. */
export type StackingFloor = {
  /** Unique within the plan: `RF`, `F12`. */
  key: string;
  /** The row's label at the left: `Roof`, `12`. */
  label: string;
  /** The floor's spaces, in the order they're drawn left to right. */
  spaces: StackingSpace[];
};

export type StackingPlanCardProps = {
  /** The building's name: the card's title, and part of the plan's accessible name. */
  name: string;
  /** The floors, top down. `null` when the building has no floors or spaces on record, and the card says so under its title. */
  floors: StackingFloor[] | null;
  /** Opens a space's record. Default: none, and the spaces aren't controls. */
  onOpen?: (space: StackingSpace) => void;
};

const whole = new Intl.NumberFormat();

/** What a space says under its name: its tenant, “Vacant”, or its type for a common area. */
export const occupantOf = (space: StackingSpace) => (space.kind === 'common' ? (space.type ?? 'Common area') : (space.tenant ?? 'Vacant'));

/** The leased tint: the first series slot at MUI's `action.selectedOpacity`, as `TypeChip` tints its square, read from the scheme on screen. */
function useLeasedTint(): (theme: Theme) => string {
  const color = useSlotColor(0);
  return (theme) => alpha(color, theme.palette.action.selectedOpacity);
}

/** A legend swatch: a small outlined rectangle, tinted for the leased state, beside its label. */
function Swatch({ tint, label }: { tint?: (theme: Theme) => string; label: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Box aria-hidden sx={{ width: 16, height: 12, flex: 'none', borderRadius: 0.5, border: 1, borderColor: 'border.level2', bgcolor: tint }} />
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
    </Stack>
  );
}

/**
 * One building's stacking plan: its floors from the roof down, each a row of its spaces sized by floor area,
 * every space naming itself, its occupant (the tenant, “Vacant”, or its type for a common area) and its area.
 * The header counts the floors that hold tenant spaces and the spaces leased. A common area has no area on
 * record, so it takes a third of its row's smallest sized space and says so. With `onOpen`, each space is a
 * button that opens its record.
 *
 * Leased and vacant are a positive and its negative, so they don't take two colors (Rules → Charts): a leased
 * space is tinted with the first `chart.series` slot at `action.selectedOpacity`, as `TypeChip` tints its square,
 * and a vacant space or common area is the bare card surface. Every space has the same `border.level2` outline
 * and the theme radius, and the spaces sit 4px apart, so no edge is drawn twice. The words carry the state, so
 * nothing rests on the tint (Rules → Accessibility), and the legend names both.
 *
 * @summary A building's floors as rows of spaces sized by area, leased spaces tinted, each naming its occupant.
 * @import import { StackingPlanCard } from 'src/components/StackingPlan';
 */
export function StackingPlanCard({ name, floors, onOpen }: StackingPlanCardProps) {
  const tint = useLeasedTint();
  const tenantSpaces = floors?.flatMap((floor) => floor.spaces.filter((space) => space.kind !== 'common')) ?? [];
  const leased = tenantSpaces.filter((space) => space.tenant).length;
  const tenantFloors = floors?.filter((floor) => floor.spaces.some((space) => space.kind !== 'common')).length ?? 0;
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardHeader
        title={<TruncatedText>{name}</TruncatedText>}
        subheader={
          floors
            ? `${whole.format(tenantFloors)} ${tenantFloors === 1 ? 'floor' : 'floors'} · ${whole.format(leased)} of ${whole.format(tenantSpaces.length)} spaces leased`
            : 'No floors or spaces recorded.'
        }
      />
      {floors && (
        <CardContent sx={{ pt: 0 }}>
          <Stack component="figure" aria-label={`${name} stacking plan`} spacing={0.5} sx={{ m: 0 }}>
            {floors.map((floor) => {
              const sized = floor.spaces.filter((space) => space.area);
              // A common area has no area on record: beside sized spaces it takes a third of the smallest, so it never
              // crowds them; on a row with no sized space the spaces share the row evenly.
              const unsized = sized.length ? Math.min(...sized.map((space) => space.area ?? 0)) / 3 : 1;
              return (
                <Stack key={floor.key} direction="row" spacing={1} sx={{ alignItems: 'stretch' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', width: (theme) => theme.spacing(7), flex: 'none', alignSelf: 'center' }}>
                    {floor.label}
                  </Typography>
                  <Box component="ul" aria-label={floor.label} sx={{ display: 'flex', gap: 0.5, flex: 1, minWidth: 0, listStyle: 'none', m: 0, p: 0 }}>
                    {floor.spaces.map((space) => {
                      const occupant = occupantOf(space);
                      const content = (
                        <>
                          <Typography variant="caption" component="span" sx={{ display: 'block', color: 'text.secondary' }}>
                            <TruncatedText>{space.name}</TruncatedText>
                          </Typography>
                          <Typography variant="body2" component="span" sx={{ display: 'block', color: space.tenant ? 'text.primary' : 'text.secondary' }}>
                            <TruncatedText>{occupant}</TruncatedText>
                          </Typography>
                          <Typography variant="caption" component="span" sx={{ display: 'block', color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                            <TruncatedText>{space.area ? `${whole.format(space.area)} sq ft` : 'No area on record'}</TruncatedText>
                          </Typography>
                        </>
                      );
                      // One outline per space, the theme radius, and the leased tint; a vacant space or common area keeps the card surface.
                      const box = {
                        width: '100%',
                        height: '100%',
                        display: 'block',
                        textAlign: 'start',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        border: 1,
                        borderColor: 'border.level2',
                        bgcolor: space.tenant ? tint : undefined,
                      } as const;
                      return (
                        <Box component="li" key={space.id} sx={{ flexGrow: space.area ?? unsized, flexBasis: 0, minWidth: 0 }}>
                          {onOpen ? (
                            <ButtonBase focusRipple onClick={() => onOpen(space)} aria-label={`${space.name}, ${occupant}: open its record`} sx={box}>
                              {content}
                            </ButtonBase>
                          ) : (
                            <Box sx={box}>{content}</Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Stack>
              );
            })}
          </Stack>
          <Stack direction="row" spacing={2} useFlexGap sx={{ mt: 2, flexWrap: 'wrap' }}>
            <Swatch tint={tint} label="Leased" />
            <Swatch label="Vacant or Common Area" />
          </Stack>
        </CardContent>
      )}
    </Card>
  );
}
