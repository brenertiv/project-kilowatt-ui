import { Field } from '@base-ui/react/field';
import { Input } from '@base-ui/react/input';
import { useFixtureInput, useFixtureSelect } from 'react-cosmos/client';

function Playground() {
  const [label] = useFixtureInput('label', 'Site name');
  const [value, setValue] = useFixtureInput('value', '120 Broadway');
  const [placeholder] = useFixtureInput('placeholder', 'Enter a site');
  const [description] = useFixtureInput('description', 'Used on tickets and meter rollups.');
  const [state] = useFixtureSelect('state', { options: [...(['default', 'invalid', 'disabled'] as const)] });
  const [error] = useFixtureInput('error message', 'Site name is required.');

  return (
    <Field.Root className="ui-field" name="site" invalid={state === 'invalid'} disabled={state === 'disabled'}>
      <Field.Label className="ui-label">{label}</Field.Label>
      <Input className="ui-input" value={value} placeholder={placeholder} onValueChange={setValue} />
      {state === 'invalid' ? (
        <Field.Error className="ui-description ui-field-error" match>
          {error}
        </Field.Error>
      ) : (
        <Field.Description className="ui-description">{description}</Field.Description>
      )}
    </Field.Root>
  );
}

export default {
  Playground,
  Empty: (
    <Field.Root className="ui-field" name="empty">
      <Field.Label className="ui-label">Site name</Field.Label>
      <Input className="ui-input" placeholder="Enter a site" />
    </Field.Root>
  ),
  Invalid: (
    <Field.Root className="ui-field" name="invalid" invalid>
      <Field.Label className="ui-label">Site name</Field.Label>
      <Input className="ui-input" defaultValue="" />
      <Field.Error className="ui-description ui-field-error" match>
        Site name is required.
      </Field.Error>
    </Field.Root>
  ),
  Disabled: (
    <Field.Root className="ui-field" name="disabled" disabled>
      <Field.Label className="ui-label">Site name</Field.Label>
      <Input className="ui-input" defaultValue="120 Broadway" />
      <Field.Description className="ui-description">Managed by the portfolio owner.</Field.Description>
    </Field.Root>
  ),
};
