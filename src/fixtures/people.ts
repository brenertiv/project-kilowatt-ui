/**
 * Sample people for the People section's tables, shaped like prototype 04's team members (`src/data/people.ts` there).
 * Every name, firm and email is invented; emails sit on `.example` domains.
 */

export type MemberRole = 'admin' | 'billing' | 'operator';
export const memberRoleLabels: Record<MemberRole, string> = { admin: 'Admin', billing: 'Billing', operator: 'Operator' };

export type AppAccess = 'web' | 'survey-app';
export const appAccessLabels: Record<AppAccess, string> = { web: 'Web App', 'survey-app': 'Survey App Only' };

export type MemberStatus = 'active' | 'invited' | 'never-signed-in' | 'deactivated';
export const memberStatusLabels: Record<MemberStatus, string> = {
  active: 'Active',
  invited: 'Invited',
  'never-signed-in': 'Never Signed In',
  deactivated: 'Deactivated',
};

export type Member = {
  id: string;
  name: string;
  email: string;
  title: string;
  /** The firm the member works for: the owner, or a third-party management company. */
  firm: string;
  /** The team the member is in, one per firm. */
  team: string;
  role: MemberRole;
  appAccess: AppAccess;
  /** How many properties the member can open. */
  properties: number;
  status: MemberStatus;
  /** Absent for a member who has never signed in. */
  lastActive?: Date;
};

const day = (iso: string) => new Date(`${iso}T12:00:00`);

/** The owner in the sample portfolio; its own staff sit in its site team. */
export const owner = 'Meridian Property Trust';

export const members: Member[] = [
  { id: 'm-01', name: 'Priya Shah', email: 'priya.shah@meridianproperty.example', title: 'VP Operations', firm: owner, team: 'Meridian Site Team', role: 'admin', appAccess: 'web', properties: 12, status: 'active', lastActive: day('2026-11-21') },
  { id: 'm-02', name: 'Maya Chen', email: 'maya.chen@meridianproperty.example', title: 'Sustainability Lead', firm: owner, team: 'Meridian Site Team', role: 'admin', appAccess: 'web', properties: 12, status: 'active', lastActive: day('2026-11-20') },
  { id: 'm-03', name: 'Nadia Ferreira', email: 'nadia.ferreira@meridianproperty.example', title: 'Accounts Payable Lead', firm: owner, team: 'Meridian Site Team', role: 'billing', appAccess: 'web', properties: 12, status: 'active', lastActive: day('2026-11-18') },
  { id: 'm-04', name: 'Henrik Solberg', email: 'henrik.solberg@meridianproperty.example', title: 'Director of Engineering', firm: owner, team: 'Meridian Site Team', role: 'admin', appAccess: 'web', properties: 12, status: 'active', lastActive: day('2026-11-12') },
  { id: 'm-05', name: 'Amara Okonkwo', email: 'amara.okonkwo@meridianproperty.example', title: 'Portfolio Analyst', firm: owner, team: 'Meridian Site Team', role: 'operator', appAccess: 'web', properties: 7, status: 'invited' },
  { id: 'm-06', name: 'Jordan Whitlock', email: 'jordan.whitlock@harborline.example', title: 'Property Manager', firm: 'Harborline Management', team: 'Harborline Management', role: 'operator', appAccess: 'web', properties: 5, status: 'active', lastActive: day('2026-11-21') },
  { id: 'm-07', name: 'Selin Marchetti', email: 'selin.marchetti@harborline.example', title: 'Assistant Property Manager', firm: 'Harborline Management', team: 'Harborline Management', role: 'operator', appAccess: 'web', properties: 5, status: 'active', lastActive: day('2026-11-19') },
  { id: 'm-08', name: 'Kofi Brennan', email: 'kofi.brennan@harborline.example', title: 'Chief Engineer', firm: 'Harborline Management', team: 'Harborline Management', role: 'operator', appAccess: 'survey-app', properties: 2, status: 'active', lastActive: day('2026-11-14') },
  { id: 'm-09', name: 'Odette Lindqvist', email: 'odette.lindqvist@harborline.example', title: 'Tenant Coordinator', firm: 'Harborline Management', team: 'Harborline Management', role: 'operator', appAccess: 'web', properties: 3, status: 'never-signed-in' },
  { id: 'm-10', name: 'Mateo Quintero', email: 'mateo.quintero@northgatepartners.example', title: 'Property Manager', firm: 'Northgate Partners', team: 'Northgate Partners', role: 'operator', appAccess: 'web', properties: 4, status: 'active', lastActive: day('2026-11-20') },
  { id: 'm-11', name: 'Ingrid Haverford', email: 'ingrid.haverford@northgatepartners.example', title: 'Building Engineer', firm: 'Northgate Partners', team: 'Northgate Partners', role: 'operator', appAccess: 'survey-app', properties: 1, status: 'active', lastActive: day('2026-11-09') },
  { id: 'm-12', name: 'Ravi Nakashima', email: 'ravi.nakashima@northgatepartners.example', title: 'Assistant Property Manager', firm: 'Northgate Partners', team: 'Northgate Partners', role: 'operator', appAccess: 'web', properties: 4, status: 'deactivated', lastActive: day('2026-08-03') },
  { id: 'm-13', name: 'Paloma Castellano', email: 'paloma.castellano@lakeshoreasset.example', title: 'Property Manager', firm: 'Lakeshore Asset Services', team: 'Lakeshore Asset Services', role: 'operator', appAccess: 'web', properties: 3, status: 'active', lastActive: day('2026-11-17') },
  { id: 'm-14', name: 'Desmond Ashdown', email: 'desmond.ashdown@lakeshoreasset.example', title: 'Chief Engineer', firm: 'Lakeshore Asset Services', team: 'Lakeshore Asset Services', role: 'operator', appAccess: 'survey-app', properties: 3, status: 'invited' },
];

export type Team = {
  id: string;
  name: string;
  firm: string;
  /** A third-party management company's team, as against the owner's own. */
  thirdParty: boolean;
  defaultRole: MemberRole;
  properties: number;
};

/** One team per firm, as in prototype 04: people plus a scope plus a default role. */
export const teams: Team[] = [
  { id: 't-01', name: 'Meridian Site Team', firm: owner, thirdParty: false, defaultRole: 'operator', properties: 12 },
  { id: 't-02', name: 'Harborline Management', firm: 'Harborline Management', thirdParty: true, defaultRole: 'operator', properties: 5 },
  { id: 't-03', name: 'Northgate Partners', firm: 'Northgate Partners', thirdParty: true, defaultRole: 'operator', properties: 4 },
  { id: 't-04', name: 'Lakeshore Asset Services', firm: 'Lakeshore Asset Services', thirdParty: true, defaultRole: 'operator', properties: 3 },
];
