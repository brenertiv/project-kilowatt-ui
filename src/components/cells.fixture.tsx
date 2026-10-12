import { sparklines } from '../workbench/sampleData';
import { useFixtureInput, useFixtureSelect } from '../workbench/inputs';
import { ChipCell, DateCell, DeltaCell, NumericCell, SparklineCell, StatusCell } from './cells';

function Playground() {
  const [tone] = useFixtureSelect('status tone', { options: ['positive', 'warning', 'negative', 'neutral'] as const });
  const [delta] = useFixtureInput('delta', 0.056);
  const [upIsGood] = useFixtureInput('up is good', true);
  const [value] = useFixtureInput('numeric value', 12853);
  const [unit] = useFixtureSelect('unit', { options: ['count', 'kW', 'kWh', 'USD', 'percent'] as const });
  const [trend] = useFixtureSelect('sparkline', { options: ['rising', 'falling', 'flat', 'noisy', 'short'] as const });

  return (
    <div className="table-wrap">
      <table className="ui-table">
        <tbody>
          <tr>
            <th scope="row">Status</th>
            <td>
              <StatusCell tone={tone}>{tone}</StatusCell>
            </td>
          </tr>
          <tr>
            <th scope="row">Delta</th>
            <td>
              <DeltaCell value={delta} upIsGood={upIsGood} />
            </td>
          </tr>
          <tr>
            <th scope="row">Numeric</th>
            <td>
              <NumericCell value={value} unit={unit} />
            </td>
          </tr>
          <tr>
            <th scope="row">Chip</th>
            <td>
              <ChipCell>Energy Star</ChipCell>
            </td>
          </tr>
          <tr>
            <th scope="row">Date</th>
            <td>
              <DateCell iso="2026-09-14" />
            </td>
          </tr>
          <tr>
            <th scope="row">Sparkline</th>
            <td>
              <SparklineCell points={sparklines[trend]} label={`${trend} trend`} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function MissingValues() {
  return (
    <div className="demo-row">
      <NumericCell value={null} />
      <DeltaCell value={undefined} />
      <DateCell iso={null} />
      <DeltaCell value={0} />
    </div>
  );
}

export default {
  Playground,
  'Missing values': MissingValues,
};
