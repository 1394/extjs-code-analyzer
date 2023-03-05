import { parse } from 'acorn';
import { simple } from 'acorn-walk';

class ExtClassProps {
    name = '';
    alias = '';
    extend;
    override;
    alternateNames = [];
    requires = [];
    uses = [];
    mixins = [];
    imports = [];
    importPath;
}

class ExtClassMeta extends ExtClassProps {
    callParentNodes = [];

    constructor() {
        super();
        Object.assign(this, ...arguments);
    }

    getImportString() {
        return this.imports.reduce((str, path) => `${str}import '${path}.js';\n`, '');
    }
}

class ExtFileMeta {
    #importPath;

    definedClasses = [];
    callParentNodes = [];
    existingImports = [];

    constructor(importPath) {
        this.#importPath = importPath;
    }

    getImportPath() {
        return this.#importPath;
    }

    addCallParentNodes(items) {
        if (!items || !items.length) return;
        this.callParentNodes = this.callParentNodes.concat(Array.isArray(items) ? items : [items]);
    }

    addDefinedClass(item) {
        if (!item) return;
        this.definedClasses.push(item);
    }

    addExistingImport(item) {
        if (!item) return;
        this.existingImports.push(item);
    }
}

// TODO add constructor this.code
export class ExtAnalyzer {

    static classMap = {};
    static fileMap = {};

    static replaceCode(code, node, replacement = '') {
        let transformedCode = code.slice(0, node.start);
        transformedCode += replacement;
        transformedCode += code.slice(node.end);
        return transformedCode;
    }

    static getSource(code, node) {
        return code.slice(node.start, node.end);
    }

    static argsToStr(code, args = []) {
        return args.reduce((_, cur) => this.getSource(code, cur), '');
    }

    static propToArray({ type, elements, value }) {
        const result = [];
        if (type === 'ArrayExpression') {
            elements.forEach(el => {
                result.push(el.value);
            });
        } else if (type === 'Literal') {
            result.push(value);
        }
        return result;
    }

    static replaceCallParentDirect(className, fnName, scope, args, isOverride) {
        const argStr = args.length ? `${scope}, ${args}` : scope;
        let fn = `(${className}.prototype || ${className})['${fnName}']`;
        if (isOverride) {
            fn = `(${fn}['$previous'] || ${fn})`;
        }
        return `${fn}.apply(${argStr})`;
    }

    static findCallParent(code, node, className, isOverride) {
        const matches = [];
        simple(node, {
            Property: (prop) => {
                if (prop.value?.type === 'FunctionExpression') {
                    const fnName = prop.key.name;
                    simple(prop, {
                        FunctionExpression: (fnBody) => {
                            simple(fnBody, {
                                CallExpression: (node) => {
                                    if (node.callee?.property?.name === 'callParent') {
                                        const replacement = this.replaceCallParentDirect(
                                            className,
                                            fnName,
                                            this.getSource(code, node.callee.object),
                                            this.argsToStr(code, node.arguments),
                                            isOverride
                                        );
                                        matches.push({ node: { start: node.start, end: node.end }, replacement });
                                    }
                                }
                            });
                        }
                    });
                }
            }
        });
        return matches;
    }

    static analyze(code = '', importPath) {
        const ast = parse(code, { ecmaVersion: 2020 });
        const fileMeta = new ExtFileMeta(importPath);
        this.fileMap[importPath] = fileMeta;
        simple(ast, {
            ImportDeclaration(node) {
                fileMeta.addExistingImport(realpath(node.source.value));
            },
            ExpressionStatement: (node) => {
                if (node.expression.callee?.object?.name === 'Ext') {
                    // Ext.define
                    if (node.expression.callee.property.name === 'define') {
                        const name = node.expression.arguments[0].value;
                        const classMeta = new ExtClassMeta({ name, importPath });
                        this.classMap[name] = classMeta;
                        const props = node.expression.arguments[1].properties;
                        props?.forEach(prop => {
                            // alias
                            if (prop.key.name === 'alias') {
                                classMeta.alias = prop.value.value;
                            }
                            // alternateClassName
                            if (prop.key.name === 'alternateClassName') {
                                classMeta.alternateNames = this.propToArray(prop.value);
                            }
                            // extend, override
                            if (['extend', 'override'].includes(prop.key.name)) {
                                classMeta[prop.key.name] = prop.value.value;
                                fileMeta.addCallParentNodes(this.findCallParent(code, node, prop.value.value, prop.key.name === 'override'));
                            }
                            // uses, requires, mixins
                            if (['uses', 'requires', 'mixins'].includes(prop.key.name)) {
                                // TODO mixins can be object
                                classMeta[prop.key.name] = this.propToArray(prop.value);
                            }
                        });
                        fileMeta.addDefinedClass(classMeta);
                    }
                }
            }
        });
    }
}