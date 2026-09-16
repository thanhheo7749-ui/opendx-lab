// ==============================================================================
// OpenDX-Lab - License Header Applier Script
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

const fs = require('fs');

const files = [
  'configs/activepieces/setup-flows.mjs',
  'configs/postgres/init-multiple-databases.sh',
  'dashboard/app/api/auth/[...nextauth]/route.ts',
  'dashboard/app/api/employees/[id]/route.ts',
  'dashboard/app/api/knowledge/nodes/[id]/route.ts',
  'dashboard/components/ui/avatar.tsx',
  'dashboard/components/ui/badge.tsx',
  'dashboard/components/ui/button.tsx',
  'dashboard/components/ui/card.tsx',
  'dashboard/components/ui/dialog.tsx',
  'dashboard/components/ui/dropdown-menu.tsx',
  'dashboard/components/ui/input.tsx',
  'dashboard/components/ui/select.tsx',
  'dashboard/components/ui/separator.tsx',
  'dashboard/components/ui/sheet.tsx',
  'dashboard/components/ui/sidebar.tsx',
  'dashboard/components/ui/skeleton.tsx',
  'dashboard/components/ui/table.tsx',
  'dashboard/components/ui/toast-container.tsx',
  'dashboard/components/ui/tooltip.tsx',
  'dashboard/components/workflows/WorkflowExecutionTable.tsx',
  'dashboard/components/workflows/WorkflowExecutionTimeline.tsx',
  'dashboard/components/workflows/WorkflowStatusCard.tsx',
  'dashboard/hooks/use-mobile.ts',
  'dashboard/lib/utils.ts',
  'dashboard/eslint.config.mjs',
  'dashboard/next.config.ts',
  'dashboard/postcss.config.mjs',
  'dashboard/test-dashboards.js',
  'dashboard/update_urls.js',
  'dashboard/vitest.config.ts'
];

let count = 0;
for (const relPath of files) {
  if (!fs.existsSync(relPath)) {
    console.log('Skipping missing:', relPath);
    continue;
  }
  let content = fs.readFileSync(relPath, 'utf8');
  if (content.includes('SPDX-License-Identifier')) {
    continue;
  }

  const isShell = relPath.endsWith('.sh');
  if (isShell) {
    const header = '# ==============================================================================\n# OpenDX-Lab\n# SPDX-License-Identifier: GPL-3.0-or-later\n# ==============================================================================\n\n';
    if (content.startsWith('#!')) {
      const firstLineEnd = content.indexOf('\n');
      content = content.slice(0, firstLineEnd + 1) + header + content.slice(firstLineEnd + 1);
    } else {
      content = header + content;
    }
  } else {
    const header = '// ==============================================================================\n// OpenDX-Lab / ShopWise\n// SPDX-License-Identifier: GPL-3.0-or-later\n// ==============================================================================\n\n';
    if (content.startsWith('"use client";') || content.startsWith("'use client';")) {
      const firstLineEnd = content.indexOf('\n');
      content = content.slice(0, firstLineEnd + 1) + '\n' + header + content.slice(firstLineEnd + 1);
    } else {
      content = header + content;
    }
  }

  fs.writeFileSync(relPath, content, 'utf8');
  count++;
  console.log(`[+] Added license header to: ${relPath}`);
}

console.log(`Successfully updated ${count} files.`);
