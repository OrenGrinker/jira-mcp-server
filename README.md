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
npx jira-mcp-server

# With environment variables
JIRA_BASE_URL=https://company.atlassian.net \
JIRA_EMAIL=user@company.com \
JIRA_API_TOKEN=your-token \
npx jira-mcp-server
```

### Option 2: MCP Configuration

Add to your `mcp.json` configuration:

```json
{
  "Jira MCP Server": {
    "command": "npx",
    "args": ["jira-mcp-server"],
    "env": {
      "JIRA_BASE_URL": "https://your-company.atlassian.net",
      "JIRA_EMAIL": "your-email@company.com",
      "JIRA_API_TOKEN": "your-jira-api-token",
      "LOG_LEVEL": "INFO"
    }
  }
}
```

### Option 3: Global Installation

```bash
npm install -g jira-mcp-server
jira-mcp-server
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

### Using with MCP Inspector

```bash
# List all boards
npx @modelcontextprotocol/inspector \
  --cli "npx jira-mcp-server" \
  --method tools/call \
  --tool-name get_boards

# Search for your issues
npx @modelcontextprotocol/inspector \
  --cli "npx jira-mcp-server" \
  --method tools/call \
  --tool-name search_issues \
  --tool-arg jql="assignee=currentUser() AND status!=Done"

# Create a new issue
npx @modelcontextprotocol/inspector \
  --cli "npx jira-mcp-server" \
  --method tools/call \
  --tool-name create_issue \
  --tool-arg projectKey="PROJ" \
  --tool-arg issueType="Task" \
  --tool-arg summary="New task from MCP"
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
```

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
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run validate     # Run all checks (format, lint, test)
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

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** following our coding standards
4. **Add tests** for new functionality
5. **Run validation**: `npm run validate`
6. **Commit changes**: `git commit -m 'Add amazing feature'`
7. **Push to branch**: `git push origin feature/amazing-feature`
8. **Open a Pull Request**

### Coding Standards

- Follow TypeScript best practices
- Use ESLint and Prettier configurations
- Write comprehensive tests
- Add JSDoc comments for public APIs
- Follow conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Jira Cloud REST API Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Creating Jira API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/OrenGrinker/jira-mcp-server/issues)
- **Documentation**: Check the README and inline code documentation
- **Community**: Join discussions in GitHub Discussions

## 🎯 Roadmap

- [ ] WebSocket support for real-time updates
- [ ] Advanced JQL query builder
- [ ] Issue template support
- [ ] Bulk operations
- [ ] Custom field support
- [ ] Agile/Sprint management tools
- [ ] Dashboard and reporting features
- [ ] Integration with other Atlassian products

---

**Happy automating with Jira MCP Server!** 🚀