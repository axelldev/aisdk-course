import { google } from '@ai-sdk/google';
import {
  convertToModelMessages,
  streamText,
  tool,
  stepCountIs,
  type UIMessage,
} from 'ai';
import { z } from 'zod';
import * as fsTools from './file-system-functionality.ts';

export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: UIMessage[] } = await req.json();
  const { messages } = body;

  const result = streamText({
    model: google('gemini-2.5-flash'),
    messages: await convertToModelMessages(messages),
    system: `
      You are a helpful assistant that can use a sandboxed file system to create, edit and delete files.

      You have access to the following tools:
      - writeFile
      - readFile
      - deletePath
      - listDirectory
      - createDirectory
      - exists
      - searchFiles

      Use these tools to record notes, create todo lists, and edit documents for the user.

      Use markdown files to store information.
    `,
    // TODO: add the tools to the streamText call,
    tools: {
      writeFile: tool({
        description: 'Writes content to a file',
        inputSchema: z.object({
          filePath: z.string().describe('path to the file'),
          content: z
            .string()
            .describe('content to be writen on the file'),
        }),
        execute: async ({ filePath, content }) =>
          fsTools.writeFile(filePath, content),
      }),
      readFile: tool({
        description: 'read content from a file',
        inputSchema: z.object({
          filePath: z.string().describe('path to file'),
        }),
        execute: async ({ filePath }) =>
          fsTools.readFile(filePath),
      }),
      deletePath: tool({
        description: 'deletes a file or directory',
        inputSchema: z.object({
          pathToDelete: z
            .string()
            .describe('path to the file/directory to delete'),
        }),
        execute: async ({ pathToDelete }) =>
          fsTools.deletePath(pathToDelete),
      }),
      listDirectory: tool({
        description: 'List contents of a directory',
        inputSchema: z.object({
          dirPath: z.string().describe('path of the directory'),
        }),
        execute: async ({ dirPath }) =>
          fsTools.listDirectory(dirPath),
      }),
      createDirectory: tool({
        description: 'creates a directory',
        inputSchema: z.object({
          dirPath: z
            .string()
            .describe('path of the directory to create'),
        }),
        execute: async ({ dirPath }) =>
          fsTools.createDirectory(dirPath),
      }),
      exists: tool({
        description: 'check if a file or directory exists',
        inputSchema: z.object({
          pathToCheck: z
            .string()
            .describe('path to check if it exists'),
        }),
        execute: async ({ pathToCheck }) =>
          fsTools.exists(pathToCheck),
      }),
      searchFiles: tool({
        description:
          'Search for files by pattern (simple glob-like search)',
        inputSchema: z.object({
          pattern: z.string().describe('pattern to find'),
          searchDir: z
            .string()
            .describe(
              'path where the pattern should be looked at',
            ),
        }),
        execute: async ({ searchDir }) =>
          fsTools.searchFiles(searchDir),
      }),
    },
    // TODO: add a custom stop condition to the streamText call
    // to force the agent to stop after 10 steps have been taken
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse();
};
