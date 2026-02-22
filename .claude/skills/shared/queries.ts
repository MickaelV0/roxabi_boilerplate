/**
 * All GraphQL query and mutation strings — single source of truth.
 */

/** Full issue query with dependencies, sub-issues, and URL (issues dashboard + CLI). */
export const ISSUES_QUERY = `
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
              subIssues(first: 50) { nodes { number state title } }
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

/** Lightweight query for triage — includes item id and body, no deps. */
export const TRIAGE_QUERY = `
query($projectId: ID!, $cursor: String) {
  node(id: $projectId) {
    ... on ProjectV2 {
      items(first: 100, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          content {
            ... on Issue { number title body state }
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

/** Get project item ID for an issue. */
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

/** Get parent issue number. */
export const PARENT_QUERY = `
query($owner: String!, $repo: String!, $number: Int!) {
  repository(owner: $owner, name: $repo) {
    issue(number: $number) { parent { number } }
  }
}`

export const UPDATE_FIELD_MUTATION = `
mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
  updateProjectV2ItemFieldValue(input: {
    projectId: $projectId, itemId: $itemId, fieldId: $fieldId,
    value: {singleSelectOptionId: $optionId}
  }) { projectV2Item { id } }
}`

export const ADD_TO_PROJECT_MUTATION = `
mutation($projectId: ID!, $contentId: ID!) {
  addProjectV2Item(input: { projectId: $projectId, contentId: $contentId }) {
    item { id }
  }
}`

export const ADD_BLOCKED_BY_MUTATION = `
mutation($issueId: ID!, $blockingId: ID!) {
  addBlockedBy(input: { issueId: $issueId, blockingIssueId: $blockingId }) {
    issue { number } blockingIssue { number }
  }
}`

export const REMOVE_BLOCKED_BY_MUTATION = `
mutation($issueId: ID!, $blockingId: ID!) {
  removeBlockedBy(input: { issueId: $issueId, blockingIssueId: $blockingId }) {
    issue { number } blockingIssue { number }
  }
}`

export const ADD_SUB_ISSUE_MUTATION = `
mutation($parentId: ID!, $childId: ID!) {
  addSubIssue(input: { issueId: $parentId, subIssueId: $childId }) {
    issue { number } subIssue { number }
  }
}`

export const REMOVE_SUB_ISSUE_MUTATION = `
mutation($parentId: ID!, $childId: ID!) {
  removeSubIssue(input: { issueId: $parentId, subIssueId: $childId }) {
    issue { number } subIssue { number }
  }
}`
