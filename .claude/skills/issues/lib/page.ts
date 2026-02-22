import { issueRow, renderBranchesAndWorktrees, renderPRs } from './components'
import { buildDepGraph, renderDepGraph } from './graph'
import type { Branch, Issue, PR, Worktree } from './types'

export function buildHtml(
  issues: Issue[],
  prs: PR[],
  branches: Branch[],
  worktrees: Worktree[],
  fetchMs: number
): string {
  const totalCount = issues.reduce((sum, i) => sum + 1 + i.children.length, 0)

  const INITIAL_VISIBLE = 8
  const visibleRows = issues
    .slice(0, INITIAL_VISIBLE)
    .map((i) => issueRow(i))
    .join('')
  const hiddenRows = issues
    .slice(INITIAL_VISIBLE)
    .map((i) => issueRow(i))
    .join('')
  const hasMore = issues.length > INITIAL_VISIBLE
  const hiddenCount = issues.length - INITIAL_VISIBLE
  const depNodes = buildDepGraph(issues)
  const depGraphHtml = renderDepGraph(depNodes, issues)
  const prsHtml = renderPRs(prs)
  const branchesHtml = renderBranchesAndWorktrees(branches, worktrees)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Issues Dashboard</title>
<style>
  :root {
    --bg: #0d1117;
    --surface: #161b22;
    --border: #30363d;
    --text: #e6edf3;
    --text-muted: #8b949e;
    --accent: #58a6ff;
    --green: #3fb950;
    --orange: #d29922;
    --red: #f85149;
    --purple: #bc8cff;
    --pink: #f778ba;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.5;
    padding: 24px;
  }

  header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  header h1 {
    font-size: 20px;
    font-weight: 600;
  }

  .count {
    font-size: 13px;
    color: var(--text-muted);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 2px 10px;
  }

  .meta {
    margin-left: auto;
    font-size: 12px;
    color: var(--text-muted);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  thead th {
    text-align: left;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    color: var(--text-muted);
    font-weight: 500;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    position: sticky;
    top: 0;
    background: var(--bg);
    z-index: 1;
  }

  tbody td {
    padding: 6px 12px;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }

  .issue-row:hover { background: var(--surface); }

  .col-num { width: 50px; color: var(--text-muted); }
  .col-num a { color: var(--text-muted); text-decoration: none; }
  .col-num a:hover { color: var(--accent); }
  .col-title { min-width: 300px; white-space: normal; word-break: break-word; }
  .col-title a { color: var(--accent); text-decoration: none; }
  .col-title a:hover { text-decoration: underline; }
  .col-status { width: 90px; }
  .col-size { width: 50px; text-align: center; }
  .col-pri { width: 50px; text-align: center; }
  .col-block { width: 36px; text-align: center; }
  .col-deps { min-width: 120px; font-size: 12px; }

  .depth-child td { border-bottom: none; padding-top: 2px; padding-bottom: 2px; }
  .depth-child .col-title { padding-left: 28px; color: var(--text-muted); font-size: 12px; }
  .tree-prefix { color: var(--border); margin-right: 4px; font-family: monospace; }

  .badge {
    display: inline-block;
    padding: 1px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    border: 1px solid var(--border);
    color: var(--text-muted);
  }

  .pri-p0 { background: rgba(248,81,73,.15); color: var(--red); border-color: rgba(248,81,73,.4); }
  .pri-p1 { background: rgba(210,153,34,.15); color: var(--orange); border-color: rgba(210,153,34,.4); }
  .pri-p2 { background: rgba(88,166,255,.1); color: var(--accent); border-color: rgba(88,166,255,.3); }
  .pri-p3 { background: rgba(139,148,158,.1); color: var(--text-muted); border-color: var(--border); }

  .status-progress { background: rgba(63,185,80,.15); color: var(--green); border-color: rgba(63,185,80,.4); }
  .status-review { background: rgba(188,140,255,.15); color: var(--purple); border-color: rgba(188,140,255,.4); }
  .status-specs { background: rgba(247,120,186,.15); color: var(--pink); border-color: rgba(247,120,186,.4); }
  .status-analysis { background: rgba(210,153,34,.15); color: var(--orange); border-color: rgba(210,153,34,.4); }
  .status-backlog { }
  .status-done { background: rgba(63,185,80,.15); color: var(--green); border-color: rgba(63,185,80,.4); }

  .block-blocked { }
  .block-blocking { }
  .block-ready { }

  .dep { margin-right: 6px; white-space: nowrap; }
  .dep-blocked { color: var(--red); }
  .dep-blocking { color: var(--orange); }
  .dep-done { color: var(--green); }
  .dep-none { color: var(--text-muted); }

  .legend {
    margin-top: 16px;
    font-size: 12px;
    color: var(--text-muted);
    display: flex;
    gap: 20px;
  }

  kbd {
    font-family: monospace;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 1px 5px;
    font-size: 11px;
  }

  /* Sections */
  .section {
    margin-top: 32px;
  }

  .section h2 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }

  .section-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-top: 32px;
  }

  .section-grid .section { margin-top: 0; }

  /* Dependency graph */
  .graph-container {
    overflow-x: auto;
    padding: 8px 0;
  }

  .dep-graph rect { cursor: default; }
  .dep-graph rect:hover { filter: brightness(1.2); }

  /* Sub-tables (PRs) */
  .sub-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .sub-table thead th {
    text-align: left;
    padding: 6px 10px;
    border-bottom: 1px solid var(--border);
    color: var(--text-muted);
    font-weight: 500;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .sub-table tbody td {
    padding: 5px 10px;
    border-bottom: 1px solid var(--border);
  }

  .sub-table a { color: var(--accent); text-decoration: none; }
  .sub-table a:hover { text-decoration: underline; }
  .sub-table code { font-size: 12px; color: var(--text-muted); background: var(--surface); padding: 1px 6px; border-radius: 4px; }
  .pr-branch { margin-top: 2px; font-size: 12px; color: var(--text-muted); }
  .sub-table .col-pr-title { max-width: 360px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .changes { font-family: monospace; font-size: 12px; }
  .additions { color: var(--green); }
  .deletions { color: var(--red); }
  .text-muted { color: var(--text-muted); }

  /* Branches & Worktrees */
  .branch-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .branch-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 10px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 13px;
  }

  .branch-item:hover { border-color: var(--accent); }

  .branch-icon { font-size: 14px; }
  .branch-issue { color: var(--accent); font-size: 12px; }
  .wt-path { font-size: 11px; color: var(--text-muted); margin-left: auto; }

  #show-more-btn {
    background: var(--surface);
    color: var(--accent);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 6px 20px;
    font-size: 13px;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }
  #show-more-btn:hover {
    border-color: var(--accent);
    background: rgba(88,166,255,.1);
  }

  .empty-state {
    color: var(--text-muted);
    font-size: 13px;
    font-style: italic;
    padding: 12px 0;
  }

  /* Context menu */
  .ctx-menu {
    display: none;
    position: fixed;
    z-index: 1000;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 4px 0;
    min-width: 180px;
    box-shadow: 0 8px 24px rgba(0,0,0,.4);
    font-size: 13px;
  }
  .ctx-menu.visible { display: block; }

  .ctx-header {
    padding: 6px 12px 4px;
    font-size: 12px;
    font-weight: 600;
    color: var(--accent);
    border-bottom: 1px solid var(--border);
    margin-bottom: 2px;
  }

  .ctx-section {
    padding: 6px 12px 2px;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-muted);
    border-top: 1px solid var(--border);
    margin-top: 2px;
  }

  .ctx-item {
    padding: 4px 12px 4px 28px;
    cursor: pointer;
    position: relative;
    color: var(--text);
    white-space: nowrap;
  }
  .ctx-item:hover {
    background: rgba(88,166,255,.15);
    color: var(--accent);
  }
  .ctx-item.active::before {
    content: '\\2713';
    position: absolute;
    left: 10px;
    color: var(--green);
    font-weight: 600;
  }
  .ctx-item.loading {
    opacity: 0.5;
    pointer-events: none;
  }

  /* Toast notification */
  .toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: var(--surface);
    color: var(--green);
    border: 1px solid var(--green);
    border-radius: 8px;
    padding: 8px 20px;
    font-size: 13px;
    opacity: 0;
    transition: opacity 0.2s, transform 0.2s;
    z-index: 1001;
    pointer-events: none;
  }
  .toast.visible { opacity: 1; transform: translateX(-50%) translateY(0); }
  .toast.error { color: var(--red); border-color: var(--red); }
</style>
</head>
<body>
  <header>
    <h1>Issues Dashboard</h1>
    <span class="count">${totalCount} issues</span>
    <span class="meta">Fetched in ${fetchMs}ms &middot; Refresh page (<kbd>F5</kbd>) for latest data</span>
  </header>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Title</th>
        <th>Status</th>
        <th>Size</th>
        <th>Pri</th>
        <th>&#9889;</th>
        <th>Deps</th>
      </tr>
    </thead>
    <tbody>
      ${visibleRows}
      ${
        hasMore
          ? `<tr id="show-more-row"><td colspan="7" style="text-align:center;padding:12px;">
        <button id="show-more-btn" onclick="document.getElementById('hidden-issues').style.display='';document.getElementById('show-less-row').style.display='';this.parentElement.parentElement.style.display='none';">
          Show ${hiddenCount} more issue${hiddenCount > 1 ? 's' : ''}
        </button>
      </td></tr>`
          : ''
      }
    </tbody>
    <tbody id="hidden-issues" style="display:none;">
      ${hiddenRows}
      <tr id="show-less-row" style="display:none;"><td colspan="7" style="text-align:center;padding:12px;">
        <button id="show-more-btn" onclick="document.getElementById('hidden-issues').style.display='none';document.getElementById('show-less-row').style.display='none';document.getElementById('show-more-row').style.display='';">
          Show less
        </button>
      </td></tr>
    </tbody>
  </table>

  <div class="legend">
    <span>\u26d4 blocked</span>
    <span>\ud83d\udd13 blocking</span>
    <span>\u2705 ready</span>
  </div>

  <div class="section">
    <h2>Dependency Graph</h2>
    <div class="graph-container">
      ${depGraphHtml}
    </div>
  </div>

  <div class="section">
    <h2>Pull Requests</h2>
    ${prsHtml}
  </div>

  <div class="section">
    <h2>Branches &amp; Worktrees</h2>
    ${branchesHtml}
  </div>

  <!-- Context menu -->
  <div id="ctx-menu" class="ctx-menu">
    <div class="ctx-header">#<span id="ctx-issue-num"></span></div>
    <div class="ctx-section">Status</div>
    <div class="ctx-item" data-field="status" data-value="Backlog">Backlog</div>
    <div class="ctx-item" data-field="status" data-value="Analysis">Analysis</div>
    <div class="ctx-item" data-field="status" data-value="Specs">Specs</div>
    <div class="ctx-item" data-field="status" data-value="In Progress">In Progress</div>
    <div class="ctx-item" data-field="status" data-value="Review">Review</div>
    <div class="ctx-item" data-field="status" data-value="Done">Done</div>
    <div class="ctx-section">Size</div>
    <div class="ctx-item" data-field="size" data-value="XS">XS</div>
    <div class="ctx-item" data-field="size" data-value="S">S</div>
    <div class="ctx-item" data-field="size" data-value="M">M</div>
    <div class="ctx-item" data-field="size" data-value="L">L</div>
    <div class="ctx-item" data-field="size" data-value="XL">XL</div>
    <div class="ctx-section">Priority</div>
    <div class="ctx-item" data-field="priority" data-value="P0 - Urgent">P0 - Urgent</div>
    <div class="ctx-item" data-field="priority" data-value="P1 - High">P1 - High</div>
    <div class="ctx-item" data-field="priority" data-value="P2 - Medium">P2 - Medium</div>
    <div class="ctx-item" data-field="priority" data-value="P3 - Low">P3 - Low</div>
  </div>
  <div id="toast" class="toast"></div>

  <script>
  (function() {
    var ctxMenu = document.getElementById('ctx-menu');
    var ctxNum = document.getElementById('ctx-issue-num');
    var toast = document.getElementById('toast');
    var ctxIssue = null;

    document.addEventListener('contextmenu', function(e) {
      var row = e.target.closest('.issue-row');
      if (!row) { ctxMenu.classList.remove('visible'); return; }

      e.preventDefault();
      ctxIssue = {
        number: row.dataset.issue,
        status: row.dataset.status,
        size: row.dataset.size,
        priority: row.dataset.priority,
      };
      ctxNum.textContent = ctxIssue.number;

      // Mark active items
      ctxMenu.querySelectorAll('.ctx-item').forEach(function(item) {
        item.classList.remove('active', 'loading');
        var field = item.dataset.field;
        var value = item.dataset.value;
        if (field === 'status' && value === ctxIssue.status) item.classList.add('active');
        if (field === 'size' && value === ctxIssue.size) item.classList.add('active');
        if (field === 'priority' && value === ctxIssue.priority) item.classList.add('active');
      });

      // Position menu
      ctxMenu.style.left = e.clientX + 'px';
      ctxMenu.style.top = e.clientY + 'px';
      ctxMenu.classList.add('visible');

      // Adjust if overflowing viewport
      var rect = ctxMenu.getBoundingClientRect();
      if (rect.right > window.innerWidth) ctxMenu.style.left = (window.innerWidth - rect.width - 8) + 'px';
      if (rect.bottom > window.innerHeight) ctxMenu.style.top = (window.innerHeight - rect.height - 8) + 'px';
    });

    document.addEventListener('click', function() { ctxMenu.classList.remove('visible'); });
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') ctxMenu.classList.remove('visible'); });

    ctxMenu.addEventListener('click', function(e) {
      var item = e.target.closest('.ctx-item');
      if (!item || !ctxIssue) return;
      e.stopPropagation();
      if (item.classList.contains('active')) { ctxMenu.classList.remove('visible'); return; }

      var field = item.dataset.field;
      var value = item.dataset.value;
      item.classList.add('loading');

      fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueNumber: Number(ctxIssue.number), field: field, value: value }),
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.ok) {
          showToast('#' + ctxIssue.number + ' ' + field + ' \\u2192 ' + value);
          setTimeout(function() { location.reload(); }, 800);
        } else {
          showToast('Error: ' + data.error, true);
          item.classList.remove('loading');
        }
      })
      .catch(function(err) {
        console.error('Context menu update failed:', err);
        showToast('Failed: ' + err.message, true);
        item.classList.remove('loading');
      });

      ctxMenu.classList.remove('visible');
    });

    function showToast(msg, isError) {
      toast.textContent = msg;
      toast.className = 'toast visible' + (isError ? ' error' : '');
      clearTimeout(toast._tid);
      toast._tid = setTimeout(function() { toast.classList.remove('visible'); }, 2500);
    }
  })();
  </script>

</body>
</html>`
}
