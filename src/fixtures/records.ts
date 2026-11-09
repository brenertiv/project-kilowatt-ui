import type { RecordDrawerRecord } from '../components/RecordDrawer';

/**
 * A synthetic property's record, for the `RecordDrawer` and `AppShell` stories: three groups of fields with their
 * provenance (one surveyed, so editing it warns first; one the person can't edit) and a short history.
 */
export const sampleRecord: RecordDrawerRecord = {
  id: 'prop-harbor-point',
  name: 'Harbor Point',
  kind: 'Property',
  groups: [
    {
      id: 'details',
      label: 'Building details',
      editable: true,
      fields: [
        { id: 'name', label: 'Name', value: 'Harbor Point', display: 'Harbor Point', provenance: 'Recorded at setup, Feb 3, 2025', input: { kind: 'text' } },
        {
          id: 'use',
          label: 'Primary use',
          value: 'office',
          display: 'Office',
          provenance: 'Recorded at setup, Feb 3, 2025',
          input: {
            kind: 'select',
            options: [
              { value: 'office', label: 'Office' },
              { value: 'multifamily', label: 'Multifamily' },
              { value: 'retail', label: 'Retail' },
            ],
          },
        },
        { id: 'built', label: 'Year built', value: 1987, display: '1987', provenance: 'Recorded at setup, Feb 3, 2025', input: { kind: 'number', min: 1800 }, confirm: true },
      ],
    },
    {
      id: 'size',
      label: 'Size',
      editable: true,
      editWarning: {
        title: 'Overwrite the surveyed value?',
        text: 'The survey recorded the size. Your edit replaces it, and the record will show who changed it and when in place of the survey date.',
        confirmLabel: 'Overwrite',
      },
      fields: [
        { id: 'area', label: 'Gross floor area', value: 184500, display: '184,500 sq ft', provenance: 'Surveyed Mar 4, 2025', input: { kind: 'number', unit: 'sq ft', min: 0 } },
        { id: 'floors', label: 'Floors', value: 12, display: '12', provenance: 'Surveyed Mar 4, 2025', input: { kind: 'number', min: 1 } },
      ],
    },
    {
      id: 'billing',
      label: 'Billing',
      editable: false,
      cannotEditReason: 'Only an admin can edit billing.',
      fields: [{ id: 'account', label: 'Account manager', value: 'Avery Lin', display: 'Avery Lin', provenance: 'From the billing system', input: { kind: 'text' } }],
    },
  ],
  activity: [
    { at: Date.UTC(2025, 9, 2, 15, 14), by: 'Avery Lin', text: 'Changed Floors from 11 to 12.' },
    { at: Date.UTC(2025, 2, 4, 10, 0), by: 'Field survey', text: 'Recorded the size.' },
  ],
};
