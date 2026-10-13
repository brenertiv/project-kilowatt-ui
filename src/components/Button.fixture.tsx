import { Button } from '@base-ui/react/button';
import { PlusIcon } from '../icons';
import { useFixtureInput, useFixtureSelect } from 'react-cosmos/client';

const variantClass = { solid: 'ui-btn ui-btn-solid', outline: 'ui-btn', ghost: 'ui-btn ui-btn-ghost' } as const;

function Playground() {
  const [variant] = useFixtureSelect('variant', { options: [...(['solid', 'outline', 'ghost'] as const)] });
  const [label] = useFixtureInput('label', 'Dispatch ticket');
  const [disabled] = useFixtureInput('disabled', false);
  const [icon] = useFixtureInput('leading icon', false);
  return (
    <Button className={variantClass[variant]} disabled={disabled}>
      {icon ? <PlusIcon /> : null}
      {label}
    </Button>
  );
}

function AllStates() {
  return (
    <div className="demo-stack">
      {(['solid', 'outline', 'ghost'] as const).map((variant) => (
        <div key={variant} className="demo-row">
          <Button className={variantClass[variant]}>{variant}</Button>
          <Button className={variantClass[variant]}>
            <PlusIcon />
            With icon
          </Button>
          <Button className={variantClass[variant]} disabled>
            Disabled
          </Button>
        </div>
      ))}
    </div>
  );
}

export default {
  Playground,
  'All states': AllStates,
};
