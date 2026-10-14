import { TreemapDemo } from './chartDemos';

export default function TreemapFixture() {
  return (
    <div className="card" style={{ height: 420, display: 'flex', flexDirection: 'column' }}>
      <div className="card-body" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <TreemapDemo />
      </div>
    </div>
  );
}
