import type { ReactNode } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Stack from '@mui/material/Stack';
import { SegmentedBar } from './SegmentedBar';
import { SourceFigure, type FigureSource } from './SourceFigure';
import { TruncatedText } from './TruncatedText';

export type VacancyCardProps = {
  /** The card's title, and the figure's dialog title. Default `'Vacancy'`. */
  title?: string;
  /** The floor area of every space in scope, in sq ft. `0` when nothing is on record. */
  area: number;
  /** The floor area of the spaces with a tenant, in sq ft. */
  leasedArea: number;
  /** How many spaces are in scope. */
  spaces: number;
  /** How many of them have a tenant. */
  leasedSpaces: number;
  /** Where the figure comes from, for the figure's dialog (`SourceFigure`). */
  source: FigureSource;
  /** The card header's action, such as an options button. Default: none. */
  action?: ReactNode;
};

const whole = new Intl.NumberFormat();
const percent = new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 0 });

/**
 * The share of the floor area in scope that is vacant, as a metric card (Card → Metric): the headline figure at
 * the card's foot, set by `SourceFigure` so it opens its calculation and sources, with what would have been its
 * caption (the vacant area and spaces, out of the whole) as the dialog's note. Under the figure, the floor area
 * as Leased and Vacant in one `SegmentedBar`. The two are a positive and its negative, so they don't take two
 * colors (Rules → Charts): both take the first `chart.series` slot, Vacant in its darker shade, and the words
 * carry the state (Rules → Accessibility). With no area on record the figure is “—”, its note says nothing is
 * on record, and there is no bar.
 *
 * @summary A metric card of the share of floor area vacant, with leased and vacant area in one bar.
 * @import import { VacancyCard } from 'src/components/VacancyFigure';
 */
export function VacancyCard({ title = 'Vacancy', area, leasedArea, spaces, leasedSpaces, source, action }: VacancyCardProps) {
  const vacant = area - leasedArea;
  return (
    <Card variant="outlined" sx={{ minHeight: (theme) => theme.spacing(20), display: 'flex', flexDirection: 'column' }}>
      <CardHeader title={<TruncatedText>{title}</TruncatedText>} action={action} />
      <CardContent sx={{ pt: 0, mt: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Stack sx={{ gap: 3 }}>
          <SourceFigure
            title={title}
            value={area > 0 ? percent.format(vacant / area) : '—'}
            unit={area > 0 ? 'vacant' : undefined}
            note={
              area > 0
                ? `${whole.format(vacant)} of ${whole.format(area)} sq ft vacant; ${whole.format(spaces - leasedSpaces)} of ${whole.format(spaces)} spaces`
                : 'No floors or tenants are on record, so there is no vacancy to show.'
            }
            source={source}
          />
          {area > 0 && (
            <SegmentedBar
              segments={[
                { label: 'Leased', value: leasedArea, slot: 0 },
                { label: 'Vacant', value: vacant, slot: 0, shade: 'dark' },
              ]}
              unit="sq ft"
              label="Floor Area by Lease"
            />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
