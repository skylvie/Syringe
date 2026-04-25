#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

type CliOptions = {
    input: string;
    output: string;
    sourceDir: string;
};

const injectPattern = /\/\*\s*@SYRINGE-INJECT:\s*([^*]+?)\s*\*\//g;

function usage(): string {
    return [
        "usage:",
        "syringe -i ./src.js -o out.js -s ./data",
        "-i = input js file",
        "-o = output js file",
        "-s = source directory",
    ].join("\n");
}

function parseArgs(args: string[]): CliOptions {
    const options: Partial<CliOptions> = {};

    for (let index = 0; index < args.length; index += 1) {
        const flag = args[index];
        const value = args[index + 1];

        if (!value || value.startsWith("-")) {
            throw new Error(`Missing value for ${flag}`);
        }

        if (flag === "-i") {
            options.input = value;
        } else if (flag === "-o") {
            options.output = value;
        } else if (flag === "-s") {
            options.sourceDir = value;
        } else {
            throw new Error(`Unknown option ${flag}`);
        }

        index += 1;
    }

    if (!options.input || !options.output || !options.sourceDir) {
        throw new Error("Missing required options");
    }

    return options as CliOptions;
}

function escapeInjectedContent(content: string): string {
    return content
        .replaceAll("\\", "\\\\")
        .replaceAll("\r", "\\r")
        .replaceAll("\n", "\\n")
        .replaceAll('"', '\\"')
        .replaceAll("'", "\\'")
        .replaceAll("`", "\\`")
        .replaceAll("${", "\\${");
}

async function injectSources(source: string, sourceDir: string): Promise<string> {
    const replacements = await Promise.all(
        [...source.matchAll(injectPattern)].map(async (match) => {
            const marker = match[0];
            const relativeFile = match[1].trim();
            const filePath = path.resolve(sourceDir, relativeFile);
            const content = escapeInjectedContent(await readFile(filePath, "utf8"));

            return { marker, content };
        }),
    );

    let output = source;

    for (const replacement of replacements) {
        output = output.split(replacement.marker).join(replacement.content);
    }

    return output;
}

async function main(): Promise<void> {
    const options = parseArgs(process.argv.slice(2));
    const inputPath = path.resolve(options.input);
    const outputPath = path.resolve(options.output);
    const sourceDir = path.resolve(options.sourceDir);
    const source = await readFile(inputPath, "utf8");
    const output = await injectSources(source, sourceDir);

    await writeFile(outputPath, output);
}

main().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);

    console.error(message);
    console.error("");
    console.error(usage());

    process.exitCode = 1;
});
