import { JiraApiClient } from '../jiraApiClient.js';
import { ToolResult, Project, FormattedProject, WorklogRequest } from '../types/index.js';
import { Logger } from '../utils/logger.js';
import { formatMarkdownTable } from '../utils/formatters.js';

// Project Service
export class ProjectService {
  private logger: Logger;

  constructor(private apiClient: JiraApiClient) {
    this.logger = new Logger('ProjectService');
  }

  async getProjects(): Promise<ToolResult> {
    try {
      this.logger.debug('Fetching all projects');

      const projects: Project[] = await this.apiClient.getProjects();

      const formattedProjects: FormattedProject[] = projects.map(project => ({
        key: project.key,
        name: project.name,
        projectType: project.projectTypeKey,
        leadName: project.lead?.displayName || 'No lead assigned',
        issueTypeCount: project.issueTypes?.length || 0,
        componentCount: project.components?.length || 0,
        versionCount: project.versions?.length || 0,
      }));

      const tableData = formattedProjects.map(project => [
        project.key,
        project.name.length > 30 ? project.name.substring(0, 27) + '...' : project.name,
        project.projectType,
        project.leadName || 'No lead',
        project.issueTypeCount.toString(),
        project.componentCount.toString(),
        project.versionCount.toString(),
      ]);

      const markdownTable = formatMarkdownTable(
        ['Key', 'Name', 'Type', 'Lead', 'Issue Types', 'Components', 'Versions'],
        tableData
      );

      const projectTypes = [...new Set(projects.map(p => p.projectTypeKey))];
      const totalIssueTypes = projects.reduce((sum, p) => sum + (p.issueTypes?.length || 0), 0);

      return {
        content: [
          {
            type: 'text',
            text: `# 📁 Jira Projects (${projects.length} total)

${markdownTable}

## Summary
- **Total Projects**: ${projects.length}
- **Project Types**: ${projectTypes.join(', ')}
- **Total Issue Types**: ${totalIssueTypes}
- **Projects with Components**: ${projects.filter(p => p.components && p.components.length > 0).length}
- **Projects with Versions**: ${projects.filter(p => p.versions && p.versions.length > 0).length}

## Quick Actions
- Get project details: Use \`get_project_details\` with any project key
- Search project issues: Use \`search_issues\` with JQL: \`project = "PROJECT_KEY"\`
- Create new issue: Use \`create_issue\` with any project key`,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to get projects:', error);
      throw new Error(`Failed to retrieve projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProjectDetails(projectKey: string): Promise<ToolResult> {
    try {
      this.logger.debug(`Fetching project details for: ${projectKey}`);

      const project: Project = await this.apiClient.getProject(projectKey);

      const issueTypes = project.issueTypes || [];
      const components = project.components || [];
      const versions = project.versions || [];

      return {
        content: [
          {
            type: 'text',
            text: `# 📁 Project Details: ${project.name}

## Basic Information
- **Key**: ${project.key}
- **Name**: ${project.name}
- **Type**: ${project.projectTypeKey}
- **Style**: ${project.style}
- **Privacy**: ${project.isPrivate ? '🔒 Private' : '🌐 Public'}
- **Simplified**: ${project.simplified ? 'Yes' : 'No'}

## Leadership
- **Project Lead**: ${project.lead?.displayName || 'No lead assigned'}
${project.lead ? `- **Lead Email**: ${project.lead.emailAddress || 'Not available'}` : ''}

## Issue Types (${issueTypes.length})
${issueTypes.map(type => `- **${type.name}**: ${type.description || 'No description'} ${type.subtask ? '(Subtask)' : ''}`).join('\n')}

## Components (${components.length})
${components.length > 0 ? components.map(comp => `- **${comp.name}**: ${comp.description || 'No description'} (Lead: ${comp.lead?.displayName || 'None'})`).join('\n') : '- No components defined'}

## Versions (${versions.length})
${versions.length > 0 ? versions.map(version => `- **${version.name}**: ${version.released ? '✅ Released' : '🚧 In Development'} ${version.releaseDate ? `(${new Date(version.releaseDate).toLocaleDateString()})` : ''}`).join('\n') : '- No versions defined'}

## Quick Actions
- Search all issues: Use \`search_issues\` with JQL: \`project = "${project.key}"\`
- Create new issue: Use \`create_issue\` with projectKey: \`${project.key}\`
- Get project boards: Use \`get_boards\` with projectKey: \`${project.key}\`

## Example JQL Queries
\`\`\`
project = "${project.key}" AND status != Done
project = "${project.key}" AND created >= -7d
project = "${project.key}" AND assignee = currentUser()
\`\`\``,
          },
        ],
      };
    } catch (error) {
      this.logger.error(`Failed to get project details for ${projectKey}:`, error);
      throw new Error(`Failed to retrieve project details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
