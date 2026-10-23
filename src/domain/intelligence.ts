import type { PortalData, ProjectGroup, PortfolioInsight } from './types';
import { analytics, descendants } from './analytics';
import { isDelayed } from './metrics';
export function groupedWorkOrders(data: PortalData): ProjectGroup[] {
 return data.projects.filter(p => !p.managed.parentId).map(parent => {
  const scope = descendants(data.projects, parent.id);
  return { id: parent.id, parent, children: scope.filter(p => p.id !== parent.id),
   workOrders: scope.filter(p => p.external.workOrder).map(p => p.external), analytics: analytics(data, parent.id) };
 });
}
export function attentionItems(data: PortalData, asOf: string): PortfolioInsight[] {
 return data.projects.filter(p => !['Completed', 'Upcoming'].includes(p.managed.status)).flatMap(p => {
  const items: PortfolioInsight[] = [];
  const add = (kind: PortfolioInsight['kind'], message: string, severity: PortfolioInsight['severity'] = 'attention') =>
   items.push({ id: `${p.id}:${kind}`, projectId: p.id, kind, message, severity });
  if (isDelayed(p, asOf)) add('delay', `Review the delivery plan for ${p.managed.name}.`, 'risk');
  const forecast = analytics(data, p.id).forecast;
  if (forecast > p.managed.cap) add('cap', `Forecast exceeds the cap by ${forecast - p.managed.cap} hours.`);
  if (p.narrative.risk) add('risk', p.narrative.risk, p.managed.status === 'Delayed' ? 'risk' : 'attention');
  if (p.narrative.decision) add('decision', p.narrative.decision);
  return items;
 });
}
