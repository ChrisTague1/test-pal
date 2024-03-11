const fs = require('fs');
const path = require('path');
// const {parse} = require('@typescript-eslint/parser');
const {parse} = require('@babel/parser');
const {default: traverse} = require('@babel/traverse');

function findReactComponentFunctions(projectDir, extensions = ['.ts', '.tsx']) {
    const componentFunctions = [];

    function traverseDirectory(currentDir) {
        const files = fs.readdirSync(currentDir);

        files.forEach((file) => {
            const filePath = path.join(currentDir, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
                traverseDirectory(filePath);
            } else
            if (stats.isFile() && extensions.includes(path.extname(file))) {
                const sourceCode = fs.readFileSync(filePath, 'utf8');
                const ast = parse(sourceCode, {
                    sourceType: 'module',
                    plugins: ['typescript', 'jsx']
                });

                traverse(ast, {
                    FunctionDeclaration(path) {
                        const returnType = path.node.returnType;
                        console.log(returnType);

                        if (
                            returnType &&
                                returnType.typeAnnotation &&
                                isReactElementType(returnType.typeAnnotation)
                        ) {
                            componentFunctions.push({
                                filePath,
                                functionName: path.node.id.name,
                                sourceCode: sourceCode.slice(path.node.start, path.node.end)
                            })
                        }
                    },
                    ArrowFunctionExpression(path) {
                        return;
                        const returnType = path.node.returnType;
                        if (
                            returnType &&
                                returnType.typeAnnotation &&
                                isReactElementType(returnType.typeAnnotation)
                        ) {
                            componentFunctions.push({
                                filePath,
                                functionName: path.parent.id ? path.parent.id.name : 'Anonymous',
                                sourceCode: sourceCode.slice(path.node.start, path.node.end),
                            });
                        }
                    }
                });
            }
        });
    }

    traverseDirectory(projectDir);
    return componentFunctions;
}

function isReactElementType(typeAnnotation) {
    return (
        typeAnnotation.type === 'TSTypeReference' &&
        typeAnnotation.typeName.type === 'Identifier' &&
        (typeAnnotation.typeName.name === 'JSX.Element' ||
        typeAnnotation.typeName.name === 'React.ReactElement')
    );
}

const projectDirectory = '../CounterApp/src';
const reactComponentFunctions = findReactComponentFunctions(projectDirectory);

reactComponentFunctions.forEach((func) => {
    console.log('File:', func.filePath);
    console.log('Function Name:', func.functionName);
    console.log('Source code:', func.sourceCode);
    console.log('---');
});
