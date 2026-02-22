import { FIELD_MAP, GITHUB_REPO, ITEM_ID_QUERY, PROJECT_ID, UPDATE_FIELD_MUTATION } from './config'

async function getItemId(issueNumber: number): Promise<string> {
  const [owner, repo] = GITHUB_REPO.split('/')
  const proc = Bun.spawn(
    [
      'gh',
      'api',
      'graphql',
      '-f',
      `query=${ITEM_ID_QUERY}`,
      '-f',
      `owner=${owner}`,
      '-f',
      `repo=${repo}`,
      '-F',
      `number=${issueNumber}`,
    ],
    { stdout: 'pipe', stderr: 'pipe' }
  )
  const stdout = await new Response(proc.stdout).text()
  const code = await proc.exited
  if (code !== 0) throw new Error('Failed to fetch item ID')

  const data = JSON.parse(stdout)
  const items = data.data.repository.issue.projectItems.nodes
  const item = items.find(
    (i: { project: { id: string }; id: string }) => i.project.id === PROJECT_ID
  )
  if (!item) throw new Error(`Issue #${issueNumber} not found in project`)
  return item.id
}

async function updateProjectField(
  itemId: string,
  fieldId: string,
  optionId: string
): Promise<void> {
  const proc = Bun.spawn(
    [
      'gh',
      'api',
      'graphql',
      '-f',
      `query=${UPDATE_FIELD_MUTATION}`,
      '-f',
      `projectId=${PROJECT_ID}`,
      '-f',
      `itemId=${itemId}`,
      '-f',
      `fieldId=${fieldId}`,
      '-f',
      `optionId=${optionId}`,
    ],
    { stdout: 'pipe', stderr: 'pipe' }
  )
  const stderr = await new Response(proc.stderr).text()
  const code = await proc.exited
  if (code !== 0) throw new Error(`Update failed: ${stderr}`)
}

export async function handleUpdate(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as { issueNumber: number; field: string; value: string }
    const { issueNumber, field, value } = body

    const fieldConfig = FIELD_MAP[field]
    if (!fieldConfig)
      return Response.json({ ok: false, error: `Unknown field: ${field}` }, { status: 400 })

    const optionId = fieldConfig.options[value]
    if (!optionId)
      return Response.json({ ok: false, error: `Unknown value: ${value}` }, { status: 400 })

    const itemId = await getItemId(issueNumber)
    await updateProjectField(itemId, fieldConfig.fieldId, optionId)

    return Response.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ ok: false, error: msg }, { status: 500 })
  }
}
