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
        "content-type": z.enum(["application/json", "text/plain"]).optional(),
        authorization: z
            .string()
            .regex(/^Bearer\s+\S+$/, {
                message: "authorization must be in the format 'Bearer <token>'",
            })
            .optional(),
    })
    .default({ accept: "application/json", "Content-Type": "application/json" });

const bodySchema = z.object({}).catchall(z.union([z.string(), z.number(), z.boolean(), z.array(z.any()), z.object({})]));
const paramsSchema = z.object({}).catchall(z.string());
const querySchema = z.object({}).catchall(z.string());

let swaggerState = {};

// Utility function to handle HTTP requests
async function handleHttpRequest(method, { url, headers, body, params }) {
    if (swaggerState.paths && url.startsWith("/")) {
        const swaggerPath = Object.keys(swaggerState.paths).find((path) => url.startsWith(path));
        console.error(`Swagger path: ${swaggerPath}`);
        if (swaggerPath) {
            if (!swaggerState.paths[swaggerPath][method.toLowerCase()]) {
                throw new Error(`The path ${swaggerPath} does not support ${method} requests.`);
            }
            const swaggerUrl = new URL(swaggerState.url.pathname + url, swaggerState.url);
            console.error(`Using Swagger URL: ${swaggerUrl}`);
            url = swaggerUrl.toString();
        } else {
            console.warn(`URL ${url} not found in Swagger paths. Proceeding with the provided URL.`);
        }
    }
    if (!url.startsWith("http")) {
        url = new URL(url, swaggerState.url).toString();
    }
    console.error(`Final URL: ${url}`);
    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        params,
    });
    return {
        content: [
            { type: "text", text: `status: ${response.status}` },
            { type: "text", text: `headers: ${JSON.stringify(Object.fromEntries(response.headers))}` },
            { type: "text", text: `body: ${await response.text()}` },
        ],
    };
}

// Define tools for each HTTP method
const httpMethods = ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"];
httpMethods.forEach((method) => {
    server.tool(
        method,
        `Does a HTTP ${method} request`,
        {
            url: z.string(),
            headers: headersSchema.optional().default({
                accept: "application/json",
                "content-type": "application/json",
            }),
            ...(method === "GET" || method === "HEAD" || method === "OPTIONS" ? { params: paramsSchema.optional().default({}) } : {}),
            ...(method === "POST" || method === "PUT" || method === "DELETE" ? { body: bodySchema.optional().default({}) } : {}),
        },
        async (args) => handleHttpRequest(method, args)
    );
});

server.tool(
    "LOAD_SWAGGER",
    "Loads a Swagger endpoint and stores the available URLs in state",
    {
        url: z.string().url(),
    },
    async ({ url }) => {
        const response = await fetch(url, {
            method: "GET",
            headers: { accept: "application/json" },
        });
        console.error(`Response: ${response.status} ${response.statusText}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch Swagger endpoint: ${response.statusText}`);
        }

        const swaggerData = await response.json();

        if (!swaggerData.paths) {
            throw new Error("Invalid Swagger data: 'paths' field is missing");
        }
        swaggerState.url = new URL(url.split("/").slice(0, -1).join("/"));
        console.error(`Swagger base URL: ${swaggerState.url.toString()}`);
        swaggerState.paths = swaggerData.paths;
        return {
            content: [
                { type: "text", text: `Swagger endpoint loaded successfully. Available URLs: ${Object.keys(swaggerState.paths).join(", ")}` },
            ],
        };
    }
);

const transport = new StdioServerTransport();
await server.connect(transport);


