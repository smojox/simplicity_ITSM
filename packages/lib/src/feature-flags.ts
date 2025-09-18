import type { Organization } from '@simplicity/types'

export type ITSMFeature =
  | 'incidentManagement'
  | 'problemManagement'
  | 'changeManagement'
  | 'requestFulfillment'
  | 'serviceCatalog'
  | 'knowledgeBase'
  | 'assetManagement'
  | 'slaManagement'

export const PLAN_FEATURES: Record<string, ITSMFeature[]> = {
  free: ['incidentManagement'],
  pro: [
    'incidentManagement',
    'problemManagement',
    'requestFulfillment',
    'knowledgeBase',
    'slaManagement'
  ],
  enterprise: [
    'incidentManagement',
    'problemManagement',
    'changeManagement',
    'requestFulfillment',
    'serviceCatalog',
    'knowledgeBase',
    'assetManagement',
    'slaManagement'
  ]
}

export function hasFeature(org: Organization, feature: ITSMFeature): boolean {
  // Check if feature is explicitly enabled in org settings
  if (org.settings?.features?.[feature] === true) {
    return true
  }

  // Check if feature is available for the organization's plan
  const planFeatures = PLAN_FEATURES[org.plan] || []
  return planFeatures.includes(feature)
}

export function createFeatureGuard(feature: ITSMFeature) {
  return (org: Organization): boolean => {
    return hasFeature(org, feature)
  }
}

export function getAvailableFeatures(org: Organization): ITSMFeature[] {
  const planFeatures = PLAN_FEATURES[org.plan] || []
  const enabledFeatures = Object.entries(org.settings?.features || {})
    .filter(([, enabled]) => enabled)
    .map(([feature]) => feature as ITSMFeature)

  // Return union of plan features and explicitly enabled features
  return [...new Set([...planFeatures, ...enabledFeatures])]
}

export function canUpgradeFeature(org: Organization, feature: ITSMFeature): boolean {
  // Check if feature is available in a higher plan
  const currentPlanFeatures = PLAN_FEATURES[org.plan] || []

  if (currentPlanFeatures.includes(feature)) {
    return false // Already available
  }

  // Check if feature exists in any higher plan
  const plans = ['pro', 'enterprise']
  const currentPlanIndex = plans.indexOf(org.plan)

  for (let i = currentPlanIndex + 1; i < plans.length; i++) {
    if (PLAN_FEATURES[plans[i]].includes(feature)) {
      return true
    }
  }

  return false
}