import type {
  ActionPriority,
  ActionStatus,
  AlertType,
  AlertTypeCategory,
  LocationType,
  UtilityBillType,
} from '../../api/types';

/**
 * Reference tables as the API serves them. These are product vocabulary,
 * not customer data, so the values are the real ones.
 */

export const actionStatuses: ActionStatus[] = [
  { id: 1, name: 'Open', description: 'Not yet started', sort_order: 1, default_filter: true },
  {
    id: 2,
    name: 'In Progress',
    description: 'One or more tasks have been completed',
    sort_order: 2,
    default_filter: true,
  },
  { id: 6, name: 'On Hold', description: 'Currently paused', sort_order: 3, default_filter: true },
  {
    id: 7,
    name: 'Requires Attention',
    description: 'Issues preventing the action from progressing to completion',
    sort_order: 4,
    default_filter: true,
  },
  { id: 3, name: 'Completed', description: 'All tasks have been completed', sort_order: 5, default_filter: false },
  {
    id: 4,
    name: 'Expired',
    description: 'Not all tasks have been completed in the allotted time',
    sort_order: -1,
    default_filter: false,
  },
  { id: 5, name: 'Cancelled', description: 'User cancelled action', sort_order: -1, default_filter: false },
];

export const actionPriorities: ActionPriority[] = [
  { id: 1, name: 'Lowest', description: 'No priority', sort_order: 1 },
  { id: 2, name: 'Low', description: 'Can be delayed', sort_order: 2 },
  { id: 3, name: 'Medium', description: 'Should not be delayed but could if necessary', sort_order: 3 },
  { id: 4, name: 'High', description: 'Cannot be delayed', sort_order: 4 },
];

export const alertTypeCategories: AlertTypeCategory[] = [
  {
    id: 1,
    name: 'Meter Setup',
    description: 'Required meters, associations, and configurations exist so metrics can be captured.',
  },
  {
    id: 2,
    name: 'Meter Data Quality',
    description: 'Meter readings cover the requested time periods without gaps, overlaps, or other quality issues.',
  },
  {
    id: 3,
    name: 'Property Eligibility',
    description: 'Property types, uses, and benchmarking prerequisites are configured to allow scoring.',
  },
  {
    id: 4,
    name: 'Use Details',
    description:
      'Validates detailed operational inputs, required combinations, relationships between use detail fields, and operational metrics that appear out of range.',
  },
];

/** A representative subset of the alert type table. */
export const alertTypes: AlertType[] = [
  {
    id: 1,
    name: 'Property has no energy meters.',
    display_name: 'Property has no energy meters.',
    description: null,
    alert_type_category: 1,
  },
  {
    id: 2,
    name: 'Property has no water meters.',
    display_name: 'Property has no water meters.',
    description: null,
    alert_type_category: 1,
  },
  {
    id: 4,
    name: 'There is not 12 full months of meter data.',
    display_name: 'There is not 12 full months of meter data.',
    description: null,
    alert_type_category: 2,
  },
  {
    id: 8,
    name: 'Meter(s) with gaps in meter entries.',
    display_name: 'Meter(s) with gaps in meter entries.',
    description: null,
    alert_type_category: 2,
  },
  {
    id: 9,
    name: 'Meter(s) with overlaps in meter entries.',
    display_name: 'Meter(s) with overlaps in meter entries.',
    description: null,
    alert_type_category: 2,
  },
  { id: 20, name: 'Target not set.', display_name: 'Target not set.', description: null, alert_type_category: 3 },
  {
    id: 25,
    name: 'One or more bills cover more than 65 days.',
    display_name: 'One or more bills cover more than 65 days.',
    description: null,
    alert_type_category: 3,
  },
  {
    id: 37,
    name: '{Use Details} is too small.',
    display_name: 'Use Details is too small.',
    description: null,
    alert_type_category: 4,
  },
  {
    id: 77,
    name: 'Meter Consumption has a short cycle length',
    display_name: 'Meter Consumption has a short cycle length',
    description: null,
    alert_type_category: 2,
  },
];

export const utilityBillTypes: UtilityBillType[] = [
  { id: 1, name: 'Electricity', description: null },
  { id: 2, name: 'Natural Gas', description: null },
  { id: 3, name: 'Water', description: null },
  { id: 4, name: 'Steam', description: null },
];

export const locationTypes: LocationType[] = [
  { id: 56, name: 'Office', description: null },
  { id: 12, name: 'Multifamily', description: null },
  { id: 31, name: 'Retail', description: null },
  { id: 7, name: 'Unit', description: null },
];

export const lookups = {
  action_status: actionStatuses,
  action_priority: actionPriorities,
  alert_type: alertTypes,
  alert_type_category: alertTypeCategories,
  utility_bill_type: utilityBillTypes,
  location_type: locationTypes,
};
