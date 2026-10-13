import { useFixtureSelect } from 'react-cosmos/client';
import { portfolio } from '../fixtures/data';
import { BuildingDetail } from './BuildingDetail';

const names = portfolio.buildings.map((building) => building.name);

function Playground() {
  const [name] = useFixtureSelect('building', { options: names });
  const building = portfolio.buildings.find((candidate) => candidate.name === name)!;
  return <BuildingDetail id={building.id} />;
}

export default {
  Playground,
  'Missing building': <BuildingDetail id="00000000-0000-4000-8000-000000000000" />,
};
