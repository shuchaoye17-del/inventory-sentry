import type {
  AnalysisThresholds,
  InventoryIssue,
  RiskLevel,
} from './types';

export const DEFAULT_THRESHOLDS: AnalysisThresholds = {
  largeChangePercent: 0.8,
  largeChangeAbsolute: 10,
  massZeroCount: 20,
  massZeroPercent: 0.2,
  massMissingCount: 20,
  massMissingPercent: 0.1,
  massNewCount: 20,
  massNewPercent: 0.1,
};

export function highestRisk(issues: InventoryIssue[]): RiskLevel {
  if (issues.some((issue) => issue.level === 'red')) return 'red';
  if (issues.some((issue) => issue.level === 'yellow')) return 'yellow';
  return 'green';
}
