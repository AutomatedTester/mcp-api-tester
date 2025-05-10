#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
    name: "MCP API Tester",
    description: "A simple Model Context Protocol server for testing APIs.",
    version: process.env.npm_package_version,
}, { capabilities: { logging: {} } });

const headersSchema = z
    .object({
        accept: z.string().default("application/json"),
        contentType: z.enum(["application/json", "text/plain"]).optional(),
        authorization: z
            .string()
            .regex(/^Bearer\s+\S+$/, {
                message: "authorization must be in the format 'Bearer <token>'",
            })
            .optional(),
    })
    .default({ accept: "application/json" });

const bodySchema = z.object({}).catchall(z.string());
const paramsSchema = z.object({}).catchall(z.string());

server.tool(
    "GET",
    "Does a HTTP GET request",
    {
        url: z.string().url(),
        headers: headersSchema.optional().default({ accept: "application/json" }),
        params: paramsSchema.optional().default({}),
    },
    async ({ url, headers, params }) => {
        const response = await fetch(url, {
            method: "GET",
            headers: headers,
            params: params,
        });
        return {
            content: [
                { type: "text", text: `status: ${response.status}` },
                { type: "text", text: `headers: ${JSON.stringify(Object.fromEntries(response.headers))}` },
                { type: "text", text: `body: ${await response.text()}` }
            ]
        };
    }
)

server.tool(
    "POST",
    "Does a HTTP POST request",
    {
        url: z.string().url(),
        headers: headersSchema.optional().default({ accept: "application/json" }),
        body: bodySchema.optional().default({}),
    },
    async ({ url, headers, body }) => {
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: body,
        });
        return {
            content: [
                { type: "text", text: `status: ${response.status}` },
                { type: "text", text: `headers: ${JSON.stringify(Object.fromEntries(response.headers))}` },
                { type: "text", text: `body: ${await response.text()}` }
            ]
        };
    }
)

server.tool(
    "PUT",
    "Does a HTTP PUT request",
    {
        url: z.string().url(),
        headers: headersSchema.optional().default({ accept: "application/json" }),
        body: bodySchema.optional().default({}),
    },
    async ({ url, headers, body }) => {
        const response = await fetch(url, {
            method: "PUT",
            headers: headers,
            body: body,
        });
        return {
            content: [
                { type: "text", text: `status: ${response.status}` },
                { type: "text", text: `headers: ${JSON.stringify(Object.fromEntries(response.headers))}` },
                { type: "text", text: `body: ${await response.text()}` }
            ]
        };
    }
)

server.tool(
    "DELETE",
    "Does a HTTP DELETE request",
    {
        url: z.string().url(),
        headers: headersSchema.optional().default({ accept: "application/json" }),
        body: bodySchema.optional().default({}),
    },
    async ({ url, headers, body }) => {
        const response = await fetch(url, {
            method: "DELETE",
            headers: headers,
            body: body,
        });
        return {
            content: [
                { type: "text", text: `status: ${response.status}` },
                { type: "text", text: `headers: ${JSON.stringify(Object.fromEntries(response.headers))}` },
                { type: "text", text: `body: ${await response.text()}` }
            ]
        };
    }
)

server.tool(
    "HEAD",
    "Does a HTTP HEAD request",
    {
        url: z.string().url(),
        headers: headersSchema.optional().default({ accept: "application/json" }),
        params: paramsSchema.optional().default({}),
    },
    async ({ url, headers, params }) => {
        const response = await fetch(url, {
            method: "HEAD",
            headers: headers,
            params: params,
        });
        return {
            content: [
                { type: "text", text: `status: ${response.status}` },
                { type: "text", text: `headers: ${JSON.stringify(Object.fromEntries(response.headers))}` },
                { type: "text", text: `body: ${await response.text()}` }
            ]
        };
    }
)
server.tool(
    "OPTIONS",
    "Does a HTTP OPTIONS request",
    {
        url: z.string().url(),
        headers: headersSchema.optional().default({ accept: "application/json" }),
        params: paramsSchema.optional().default({}),
    },
    async ({ url, headers, params }) => {
        const response = await fetch(url, {
            method: "OPTIONS",
            headers: headers,
            params: params,
        });
        return {
            content: [
                { type: "text", text: `status: ${response.status}` },
                { type: "text", text: `headers: ${JSON.stringify(Object.fromEntries(response.headers))}` },
                { type: "text", text: `body: ${await response.text()}` }
            ]
        };
    }
)

const transport = new StdioServerTransport();
await server.connect(transport);


