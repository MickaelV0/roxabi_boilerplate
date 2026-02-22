export const PROJECT_ID = process.env.PROJECT_ID ?? 'PVT_kwHODEqYK84BOId3'
export const GITHUB_REPO = process.env.GITHUB_REPO ?? 'MickaelV0/roxabi_boilerplate'
export const STATUS_FIELD_ID = process.env.STATUS_FIELD_ID ?? 'PVTSSF_lAHODEqYK84BOId3zg87HNM'
export const SIZE_FIELD_ID = process.env.SIZE_FIELD_ID ?? 'PVTSSF_lAHODEqYK84BOId3zg87HYo'
export const PRIORITY_FIELD_ID = process.env.PRIORITY_FIELD_ID ?? 'PVTSSF_lAHODEqYK84BOId3zg87HYs'

export const STATUS_OPTIONS: Record<string, string> = {
  Backlog: 'df6ee93b',
  Analysis: 'bec91bb0',
  Specs: 'ad9a9195',
  'In Progress': '331d27a4',
  Review: 'ee30a001',
  Done: 'bfdc35bd',
}

export const SIZE_OPTIONS: Record<string, string> = {
  XS: 'dfcde6df',
  S: '4390f522',
  M: 'e2c52fb1',
  L: 'f8ea3803',
  XL: '228a917d',
}

export const PRIORITY_OPTIONS: Record<string, string> = {
  'P0 - Urgent': 'ed739db3',
  'P1 - High': '742ac87b',
  'P2 - Medium': '723e7784',
  'P3 - Low': '796f973f',
}

export const FIELD_MAP: Record<string, { fieldId: string; options: Record<string, string> }> = {
  status: { fieldId: STATUS_FIELD_ID, options: STATUS_OPTIONS },
  size: { fieldId: SIZE_FIELD_ID, options: SIZE_OPTIONS },
  priority: { fieldId: PRIORITY_FIELD_ID, options: PRIORITY_OPTIONS },
}

export const QUERY = `
query($projectId: ID!, $cursor: String) {
  node(id: $projectId) {
    ... on ProjectV2 {
      items(first: 100, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          content {
            ... on Issue {
              number
              title
              state
              url
              subIssues(first: 20) { nodes { number state title } }
              parent { number state }
              blockedBy(first: 20) { nodes { number state } }
              blocking(first: 20) { nodes { number state } }
            }
          }
          fieldValues(first: 10) {
            nodes {
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field { ... on ProjectV2SingleSelectField { name } }
              }
            }
          }
        }
      }
    }
  }
}`

export const ITEM_ID_QUERY = `
query($owner: String!, $repo: String!, $number: Int!) {
  repository(owner: $owner, name: $repo) {
    issue(number: $number) {
      projectItems(first: 10) {
        nodes { id project { id } }
      }
    }
  }
}`

export const UPDATE_FIELD_MUTATION = `
mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
  updateProjectV2ItemFieldValue(input: {
    projectId: $projectId, itemId: $itemId, fieldId: $fieldId,
    value: {singleSelectOptionId: $optionId}
  }) { projectV2Item { id } }
}`
