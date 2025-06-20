#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import { JiraApiClient } from './jiraApiClient.js';
import { JiraToolRegistry } from './toolRegistry.js';
import { Logger } from './utils/logger.js';
import { validateEnvironment } from './utils/validation.js';

const logger = new Logger('JiraMCPServer');

class JiraMCPServer {
  private server: Server;
  private apiClient: JiraApiClient;
  private toolRegistry: JiraToolRegistry;

  constructor() {
    // Validate environment variables
    validateEnvironment();

    this.server = new Server(
      {
        name: 'jira-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.apiClient = new JiraApiClient();
    this.toolRegistry = new JiraToolRegistry(this.apiClient);
    
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.info('Listing available tools');
      return {
        tools: this.toolRegistry.getToolDefinitions(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
      const { name, arguments: args } = request.params;
      
      logger.info(`Executing tool: ${name}`, { args });

      try {
        const result = await this.toolRegistry.executeTool(name, args || {});
        logger.info(`Tool ${name} executed successfully`);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error executing tool ${name}:`, error);
        
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to execute ${name}: ${errorMessage}`
        );
      }
    });

    // Handle server shutdown gracefully
    process.on('SIGINT', () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      process.exit(0);
    });
  }

  async start(): Promise<void> {
    try {
      // Test Jira connection
      await this.apiClient.testConnection();
      
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      logger.info('Jira MCP Server is running on stdio');
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start the server
async function main() {
  const server = new JiraMCPServer();
  await server.start();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});