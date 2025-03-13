import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { extname, dirname } from "path";
import { createHash } from "crypto";

import { rollup } from "rollup";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import swc from "@swc/core";

const extensions = [".js", ".jsx", ".mjs", ".ts", ".tsx", ".cts", ".mts"];

/** @type import("rollup").InputPluginOption */
const plugins = [
    nodeResolve(),
    commonjs(),
    {
        name: "swc",
        async transform(code, id) {
            const ext = extname(id);
            if (!extensions.includes(ext)) return null;

            const ts = ext.includes("ts");
            const tsx = ts ? ext.endsWith("x") : undefined;
            const jsx = !ts ? ext.endsWith("x") : undefined;

            const result = await swc.transform(code, {
                filename: id,
                jsc: {
                    externalHelpers: true,
                    parser: {
                        syntax: ts ? "typescript" : "ecmascript",
                        tsx,
                        jsx,
                    },
                },
                env: {
                    targets: "defaults",
                    include: [
                        "transform-classes",
                        "transform-arrow-functions",
                    ],
                },
            });
            return result.code;
        },
    },
    {
        name: "minify",
        async transform(code) {
            const result = await swc.transform(code, {
                minify: true,
            });
            return result.code;
        }
    }
];

const PLUGIN_NAME = "clickette-api-vendetta";
const PLUGIN_ENTRY = "clicketteUploadPlugin.js";
const OUTPUT_DIR = "./dist";

async function build() {
    try {
        const manifest = {
            name: "Clickette Uploader",
            description: "Uploads files to clickette.org instead of Discord CDN",
            authors: [
                {
                    name: "CheeseDev",
                    id: "908150004961652797" 
                }
            ],
            main: PLUGIN_ENTRY,
            version: "2.0.0"
        };

        const outDir = `${OUTPUT_DIR}/${PLUGIN_NAME}`;
        if (!existsSync(dirname(outDir))) {
            await mkdir(dirname(outDir), { recursive: true });
        }
        if (!existsSync(outDir)) {
            await mkdir(outDir);
        }

        const outPath = `${outDir}/${PLUGIN_ENTRY}`;

        const bundle = await rollup({
            input: `./${PLUGIN_ENTRY}`,
            onwarn: () => {},
            plugins,
        });
    
        await bundle.write({
            file: outPath,
            globals(id) {
                if (id.startsWith("@vendetta")) return id.substring(1).replace(/\//g, ".");
                const map = {
                    react: "window.React",
                };

                return map[id] || null;
            },
            format: "iife",
            compact: true,
            exports: "named",
        });
        await bundle.close();
    
        const toHash = await readFile(outPath);
        manifest.hash = createHash("sha256").update(toHash).digest("hex");
        
        await writeFile(`${outDir}/manifest.json`, JSON.stringify(manifest));
    
        console.log(`Successfully built ${manifest.name}!`);
    } catch (e) {
        console.error("Failed to build plugin...", e);
        process.exit(1);
    }
}

build();
