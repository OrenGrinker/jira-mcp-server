# Jira MCP Server

A comprehensive, production-ready Model Context Protocol (MCP) server for seamless Jira Cloud integration. This enhanced version provides advanced features, robust error handling, and extensive tooling for AI agents, automation systems, and custom applications.

## 🚀 Features

### Core Functionality
- **Board Management**: List, filter, and manage Jira boards with detailed information
- **Issue Operations**: Create, update, search, transition, and manage issues comprehensively
- **User Management**: Search users, get user details, and manage assignments
- **Project Administration**: View projects, get detailed project information
- **Time Tracking**: Add and view work logs with flexible time formats
- **Comment System**: Add comments with rich text support (ADF format)
- **Server Information**: Monitor server status and health

### Enhanced Features
- **Rate Limiting**: Intelligent API request throttling to respect Jira limits
- **Comprehensive Logging**: Configurable logging with multiple levels
- **Error Handling**: Robust error handling with detailed error messages
- **Input Validation**: Thorough validation of environment variables and inputs
- **Modular Architecture**: Clean, maintainable codebase with service-based architecture
- **TypeScript Support**: Full TypeScript implementation with comprehensive type definitions
- **Rich Formatting**: Beautiful markdown tables and formatted responses
- **Advanced Search**: Support for complex JQL queries with helpful examples

## 🛠️ Requirements

- **Node.js**: 18.0.0 or higher
- **Jira Cloud**: Access to a Jira Cloud instance
- **API Token**: Jira API Token ([create here](https://id.atlassian.com/manage-profile/security/api-tokens))

## ⚙️ Environment Variables

Create a `.env` file or set these environment variables:

```bash
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-jira-api-token
LOG_LEVEL=INFO  # Optional: ERROR, WARN, INFO, DEBUG
```

## 🚀 Quick Start

### Option 1: Using npx (Recommended)

```bash
# Run directly without installation
npx @orengrinker/jira-mcp-server

# With environment variables
JIRA_BASE_URL=https://company.atlassian.net \
JIRA_EMAIL=user@company.com \
JIRA_API_TOKEN=your-token \
npx @orengrinker/jira-mcp-server
```

### Option 2: Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "jira": {
      "command": "npx",
      "args": ["@orengrinker/jira-mcp-server"],
      "env": {
        "JIRA_BASE_URL": "https://your-company.atlassian.net",
        "JIRA_EMAIL": "your-email@company.com",
        "JIRA_API_TOKEN": "your-jira-api-token",
        "LOG_LEVEL": "INFO"
      }
    }
  }
}
```

### Option 3: Global Installation

```bash
npm install -g @orengrinker/jira-mcp-server
jira-mcp-server
```

### Option 4: Local Development

```bash
git clone https://github.com/OrenGrinker/jira-mcp-server.git
cd jira-mcp-server
npm install
npm run build
node dist/index.js
```

## 🧰 Available Tools

### Board Tools
- `get_boards` - List all boards with optional filtering by type and project
- `get_board_details` - Get comprehensive board information
- `get_board_issues` - Get board issues with advanced filtering options

### Issue Tools
- `search_issues` - Search issues using JQL with flexible parameters
- `get_issue_details` - Get comprehensive issue information
- `create_issue` - Create new issues with full field support
- `update_issue` - Update existing issues
- `transition_issue` - Move issues between statuses
- `add_comment` - Add comments with rich text support

### User Tools
- `get_current_user` - Get authenticated user information
- `search_users` - Find users by name, email, or username
- `get_user_details` - Get detailed user information

### Project Tools
- `get_projects` - List all accessible projects
- `get_project_details` - Get comprehensive project information

### Time Tracking Tools
- `add_worklog` - Log work time with flexible formats
- `get_worklogs` - View work logs for issues

### System Tools
- `get_server_info` - Get server status and information

## 💡 Usage Examples

### Natural Language Commands with Claude

Once configured with Claude Desktop, you can use natural language commands:

```
"Show me all my open issues in high priority"
"Create a new bug in PROJECT-X about login issues"
"Move ticket ABC-123 to In Progress"
"Log 2 hours of work on ABC-456 for code review"
"Add a comment to ABC-789 saying the fix is deployed"
"Show me all Scrum boards for the mobile project"
"Get details for issue ABC-100 including comments and worklogs"
"List all projects I have access to"
```

### Using with MCP Inspector

```bash
# List all boards
npx @modelcontextprotocol/inspector \
  npx @orengrinker/jira-mcp-server \
  get_boards

# Search for your issues
npx @modelcontextprotocol/inspector \
  npx @orengrinker/jira-mcp-server \
  search_issues \
  '{"jql": "assignee=currentUser() AND status!=Done"}'

# Create a new issue
npx @modelcontextprotocol/inspector \
  npx @orengrinker/jira-mcp-server \
  create_issue \
  '{"projectKey": "PROJ", "issueType": "Task", "summary": "New task from MCP"}'
```

### JQL Query Examples

```jql
# Your open issues
assignee = currentUser() AND status != Done

# Recent issues in a project
project = "MYPROJ" AND created >= -7d

# High priority bugs
priority = High AND issuetype = Bug

# Issues due this week
duedate >= startOfWeek() AND duedate <= endOfWeek()

# Unassigned issues in current sprint
assignee is EMPTY AND sprint in openSprints()

# Issues updated in the last 24 hours
updated >= -1d

# Epic issues with their child stories
"Epic Link" = PROJ-123 OR parent = PROJ-123
```

## 🔧 Configuration

### Getting Your Jira API Token

1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a descriptive name (e.g., "MCP Server")
4. Copy the generated token
5. Use it in your environment variables

### Permissions Required

Your Jira user should have:
- Browse projects permission
- Create issues permission (for issue creation)
- Edit issues permission (for updates and transitions)
- Work on issues permission (for worklogs)
- Add comments permission

## 🏗️ Development

### Setup

```bash
git clone https://github.com/OrenGrinker/jira-mcp-server.git
cd jira-mcp-server
npm install
```

### Development Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run clean        # Clean build directory
npm run start        # Start production server
npm run test         # Run tests (when available)
```

### Project Structure

```
src/
├── index.ts              # Main server entry point
├── jiraApiClient.ts      # Enhanced API client
├── toolRegistry.ts       # Tool registration and routing
├── types/
│   └── index.ts         # TypeScript type definitions
├── services/
│   ├── index.ts         # Service exports
│   ├── boardService.ts  # Board operations
│   ├── issueService.ts  # Issue operations
│   ├── userService.ts   # User operations
│   ├── projectService.ts # Project operations
│   ├── worklogService.ts # Worklog operations
│   └── serverService.ts  # Server operations
└── utils/
    ├── logger.ts        # Logging utility
    ├── rateLimiter.ts   # Rate limiting
    ├── validation.ts    # Input validation
    └── formatters.ts    # Response formatting
```

## 🔍 Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify your API token and email are correct
   - Check that your Jira base URL is correct (should end with .atlassian.net for cloud)
   - Ensure your API token hasn't expired

2. **Permission Denied**
   - Verify your Jira user has the required permissions
   - Check project-level permissions for specific operations

3. **Network Errors**
   - Verify your Jira base URL is accessible
   - Check firewall and proxy settings
   - Ensure you're using HTTPS

4. **Rate Limiting**
   - The server includes built-in rate limiting
   - If you hit Jira's rate limits, wait and retry
   - Consider reducing concurrent requests

### Debug Mode

Enable debug logging:
```bash
export LOG_LEVEL=DEBUG
```

## 🧪 Testing

```bash
# Test the server connection
JIRA_BASE_URL=https://your-company.atlassian.net \
JIRA_EMAIL=your@email.com \
JIRA_API_TOKEN=your-token \
node dist/index.js
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** following our coding standards
4. **Add tests** for new functionality
5. **Run the build**: `npm run build`
6. **Commit changes**: `git commit -m 'Add amazing feature'`
7. **Push to branch**: `git push origin feature/amazing-feature`
8. **Open a Pull Request**

### Coding Standards

- Follow TypeScript best practices
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Follow conventional commit messages
- Ensure all builds pass

## 📊 Performance

- **Rate Limiting**: Built-in rate limiting respects Jira API limits
- **Connection Pooling**: Efficient HTTP connection management
- **Error Recovery**: Automatic retry logic for transient failures
- **Memory Efficient**: Streaming responses for large datasets

## 🔐 Security

- **No Credential Storage**: Uses environment variables only
- **Input Validation**: All inputs are validated and sanitized
- **Secure Defaults**: Follows security best practices
- **Audit Trail**: Comprehensive logging for debugging

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **GitHub Repository**: [https://github.com/OrenGrinker/jira-mcp-server](https://github.com/OrenGrinker/jira-mcp-server)
- **NPM Package**: [@orengrinker/jira-mcp-server](https://www.npmjs.com/package/@orengrinker/jira-mcp-server)
- **Jira Cloud REST API**: [Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- **Model Context Protocol**: [Specification](https://modelcontextprotocol.io/)
- **Create API Tokens**: [Atlassian Guide](https://id.atlassian.com/manage-profile/security/api-tokens)

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/OrenGrinker/jira-mcp-server/issues)
- **Documentation**: Check this README and inline code documentation
- **Feature Requests**: Open an issue with the "enhancement" label

## 🏆 Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- Inspired by the MCP community and best practices
- Thanks to all contributors and users providing feedback