import { issueRow, renderBranchesAndWorktrees, renderPRs } from './components'
import { buildDepGraph, renderDepGraph } from './graph'
import { PAGE_STYLES } from './page-styles'
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
${PAGE_STYLES}
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

  <div class="section">
    <h2>Pull Requests</h2>
    ${prsHtml}
  </div>

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
