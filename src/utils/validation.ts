export function validateEnvironment(): void {
  const required = ['JIRA_BASE_URL', 'JIRA_EMAIL', 'JIRA_API_TOKEN'];
  const missing = required.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please set the following environment variables:\n' +
      '- JIRA_BASE_URL: Your Jira instance URL (e.g., https://company.atlassian.net)\n' +
      '- JIRA_EMAIL: Your Jira account email\n' +
      '- JIRA_API_TOKEN: Your Jira API token (create at https://id.atlassian.com/manage-profile/security/api-tokens)'
    );
  }

  // Validate URL format
  const baseUrl = process.env.JIRA_BASE_URL!;
  try {
    new URL(baseUrl);
  } catch {
    throw new Error(`Invalid JIRA_BASE_URL format: ${baseUrl}. Please provide a valid URL (e.g., https://company.atlassian.net)`);
  }

  // Validate email format
  const email = process.env.JIRA_EMAIL!;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error(`Invalid JIRA_EMAIL format: ${email}. Please provide a valid email address.`);
  }
}