const fs = require('fs');
const path = require('path');
const {parse} = require('@babel/parser');
const traverse = require('@babel/traverse').default;

// TODO improve this function
function isReactComponent(sourceCode) {
    let isComponent = false;

    const ast = parse(sourceCode, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
    });

    traverse(ast, {
        FunctionDeclaration(path) {
            if (path.node.id && path.node.id.name.match(/^[A-Z]/)) {
                isComponent = true;
            } else {
                console.log('Not a component: function');
                console.log(path.node.id);
            }
        },
        ArrowFunctionExpression(path) {
            console.log(path)
            if (
                path.parent.type === 'VariableDeclarator' &&
                path.parent.id.type === 'Identifier' &&
                path.parent.id.name.match(/^[A-Z]/)
            ) {
                isComponent = true;
            } else {
                console.log('Not a component: arrow');
                console.log(path.node.id);
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
                isComponent = true;
            } else {
                console.log('Not a component: class');
                console.log(path.node.id);
            }
        }
    });

    return isComponent;
}

function getComponents(projectDir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
    const components = [];

    function traverseDirectory(currentDir) {
        const files = fs.readdirSync(currentDir);

        files.forEach((file) => {
            const filePath = path.join(currentDir, file);
            console.log(filePath)
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
                    // FunctionDeclaration(path) {
                    //     potentialComponents.push(sourceCode.slice(path.node.start, path.node.end));
                    // },
                    ArrowFunctionExpression(path) {
                        if (chris) {
                            console.log(path.parent.id.name)
                            potentialComponents.push(sourceCode.slice(path.parent.start, path.parent.end));
                            chris = false
                        }
                    },
                    // ClassDeclaration(path) {
                    //     potentialComponents.push(sourceCode.slice(path.node.start, path.node.end));
                    // }
                });
            }
        })
    }

    traverseDirectory(projectDir);

    console.log(potentialComponents);

    return potentialComponents;
}

const components = getPotentialComponents('../TodoApp/src/components')
    // .filter(isReactComponent);

// console.log(components);
