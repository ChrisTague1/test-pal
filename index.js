const fs = require('fs');
const path = require('path');
const {parse} = require('@babel/parser');
const traverse = require('@babel/traverse').default;

function getComponents(projectDir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
    const components = [];

    function traverseDirectory(currentDir) {
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
                                sourceCode: sourceCode.slice(path.node.start, path.node.end)
                            });
                        }
                    },
                    ArrowFunctionExpression(path) {
                        if (path.parent.id && path.parent.id.name.match(/^[A-Z]/)) {
                            components.push({
                                componentType: 'arrow',
                                sourceCode: sourceCode.slice(path.parent.start, path.parent.end)
                            })
                        }
                    },
                    ClassDeclaration(path) {
                        if (
                            path.node.id &&
                            path.node.id.name.match(/^[A-Z]/) &&
                            path.node.superClass &&
                            (path.node.superClass.name === 'Component' ||
                                path.node.superClass.name === 'PureComponent')
                        ) {
                            components.push({
                                sourceCode: sourceCode.slice(path.node.start, path.node.end)
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

const components = getComponents('../TodoApp/src')

components.forEach(({sourceCode}) => {
    console.log(sourceCode);

    for (let i = 0; i < 10; i++) {
        console.log()
    }
})
