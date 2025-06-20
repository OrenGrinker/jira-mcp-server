export function formatMarkdownTable(headers: string[], rows: string[][]): string {
  if (rows.length === 0) {
    return `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n| *No data available* |`;
  }

  const headerRow = `| ${headers.join(' | ')} |`;
  const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
  const dataRows = rows.map(row => `| ${row.join(' | ')} |`).join('\n');
  
  return `${headerRow}\n${separatorRow}\n${dataRows}`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  } else {
    const days = Math.floor(seconds / 86400);
    const remainingHours = Math.floor((seconds % 86400) / 3600);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
}

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function escapeMarkdown(text: string): string {
  return text.replace(/[\\`*_{}[\]()#+\-.!]/g, '\\$&');
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export function formatJQLQuery(jql: string): string {
  // Basic JQL formatting for readability
  return jql
    .replace(/\s+AND\s+/gi, '\n  AND ')
    .replace(/\s+OR\s+/gi, '\n  OR ')
    .replace(/\s+ORDER\s+BY\s+/gi, '\nORDER BY ');
}

export function parseTimeString(timeStr: string): number {
  // Parse Jira time format (e.g., "2h 30m", "1d", "4h") to seconds
  const patterns = [
    { regex: /(\d+)d/g, multiplier: 86400 }, // days
    { regex: /(\d+)h/g, multiplier: 3600 },  // hours
    { regex: /(\d+)m/g, multiplier: 60 },    // minutes
    { regex: /(\d+)s/g, multiplier: 1 },     // seconds
    { regex: /(\d+)w/g, multiplier: 604800 }, // weeks
  ];

  let totalSeconds = 0;
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.regex.exec(timeStr)) !== null) {
      const value = match[1];
      if (value) {
        totalSeconds += parseInt(value) * pattern.multiplier;
      }
    }
    pattern.regex.lastIndex = 0; // Reset regex
  }
  
  return totalSeconds;
}