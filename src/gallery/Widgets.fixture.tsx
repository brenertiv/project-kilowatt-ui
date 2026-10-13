import { useFixtureInput } from 'react-cosmos/client';
import {
  ChartDemo,
  DndDemo,
  GridDemo,
  MapDemo,
  MetricCardDemo,
  OverviewPanelDemo,
  TableDemo,
  TourDemo,
} from './stackDemos';

function MetricCard() {
  const [label] = useFixtureInput('label', 'Total tickets');
  const [value] = useFixtureInput('value', 12853);
  const [delta] = useFixtureInput('delta', 0.056);
  const [focusIndex] = useFixtureInput('highlighted bar', 4);
  return (
    <div style={{ width: 320 }}>
      <MetricCardDemo label={label} value={value} delta={delta} focusIndex={focusIndex} />
    </div>
  );
}

function OverviewPanel() {
  const [closed] = useFixtureInput('closed share %', 64);
  return (
    <div className="card" style={{ width: 420, height: 480, display: 'flex', flexDirection: 'column' }}>
      <div className="card-body" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <OverviewPanelDemo closedShare={Math.max(0, Math.min(100, closed)) / 100} />
      </div>
    </div>
  );
}

function Sized({ children, height = 320 }: { children: React.ReactNode; height?: number }) {
  return (
    <div className="card" style={{ height, display: 'flex', flexDirection: 'column' }}>
      <div className="card-body" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

export default {
  'Metric card': MetricCard,
  'Tickets table': TableDemo,
  'Demand chart': () => (
    <Sized>
      <ChartDemo />
    </Sized>
  ),
  'Overview panel': OverviewPanel,
  'Portfolio map': () => (
    <Sized height={360}>
      <MapDemo />
    </Sized>
  ),
  'Dashboard grid': () => (
    <Sized height={360}>
      <GridDemo />
    </Sized>
  ),
  'Queue reorder': DndDemo,
  'Product tour': TourDemo,
};
