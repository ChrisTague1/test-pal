import {config} from 'dotenv';
import fs from 'fs';
import path from 'path';
import {parse} from '@babel/parser';
import babelTraverse from '@babel/traverse';
import Anthropic from '@anthropic-ai/sdk';

config();

type TraverseType = typeof babelTraverse;

// why does the typescript support for this library suck so much
const traverse = (babelTraverse as unknown as {default: TraverseType}).default;

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

type ComponentRepresentation = {
    sourceCode: string;
    componentType?: string;
}

function getComponents(projectDir: string, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
    const components: ComponentRepresentation[] = [];

    function traverseDirectory(currentDir: string) {
        const files = fs.readdirSync(currentDir);

        files.forEach((file) => {
            const filePath = path.join(currentDir, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
                traverseDirectory(filePath);
                return;
            }

            if (stats.isFile() && extensions.includes(path.extname(file))) {
                const sourceCode = fs.readFileSync(filePath, 'utf8');

                const ast = parse(sourceCode, {
                    sourceType: 'module',
                    plugins: ['typescript', 'jsx']
                });

                traverse(ast, {
                    FunctionDeclaration(path) {
                        if (path.node.id && path.node.id.name.match(/^[A-Z]/)) {
                            components.push({
                                sourceCode: sourceCode.slice(path.node.start as number | undefined, path.node.end as number | undefined).replace(/\n\s+/g, '')
                            });
                        }
                    },
                    ArrowFunctionExpression(path) {
                        const id: {name: string} | null = (path.parent as { id: any }).id;
                        if (id && id.name.match(/^[A-Z]/)) {
                            components.push({
                                componentType: 'arrow',
                                sourceCode: sourceCode.slice(path.parent.start as number | undefined, path.parent.end as number | undefined).replace(/\n\s+/g, '')
                            })
                        }
                    },
                    ClassDeclaration(path) {
                        if (
                            path.node.id &&
                            path.node.id.name.match(/^[A-Z]/) &&
                            path.node.superClass &&
                            ((path.node.superClass as {name: string}).name === 'Component' ||
                                (path.node.superClass as {name: string}).name === 'PureComponent')
                        ) {
                            components.push({
                                sourceCode: sourceCode.slice(path.node.start as number | undefined, path.node.end as number | undefined).replace(/\n\s+/g, '')
                            });
                        }
                    }
                });
            }
        })
    }

    traverseDirectory(projectDir);

    return components;
}

const components = getComponents('../CounterApp/src')

if (components.length > 0) {
    const component = components[0];

    const proompt = `Write a complete RTL test suite for the following component:\n${component.sourceCode}`

    anthropic.messages
        .create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1024,
            messages: [{role: 'user', content: proompt}]
        })
        .then(msg => {
            console.log(msg);

            const response = msg.content[0].text;

            fs.writeFile("output.js", response, (err) => {
                if (err) {
                    console.log("Error writing to file");
                    console.log(err);
                } else {
                    console.log("File written");
                }
            })
        })
}
