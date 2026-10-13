import { useState } from 'react';
import { useFixtureInput } from 'react-cosmos/client';
import { CardMenu } from './CardMenu';

function Playground() {
  const [items] = useFixtureInput('item count', 3);
  const [destructiveLast] = useFixtureInput('destructive last item', true);
  const [disabledFirst] = useFixtureInput('disabled first item', false);
  const [last, setLast] = useState<string | null>(null);

  return (
    <article className="card" style={{ width: 320 }}>
      <header className="card-head">
        <h3>Card title</h3>
        <div className="card-actions">
          <CardMenu
            label="Card actions"
            items={Array.from({ length: Math.max(1, items) }, (_, index) => ({
              id: `item-${index}`,
              label: `Action ${index + 1}`,
              onSelect: () => setLast(`Action ${index + 1}`),
              destructive: destructiveLast && index === items - 1,
              disabled: disabledFirst && index === 0,
            }))}
          />
        </div>
      </header>
      <div className="card-body">
        <p className="ui-description">{last ? `Last selected: ${last}` : 'Open the menu to pick an action.'}</p>
      </div>
    </article>
  );
}

export default Playground;
