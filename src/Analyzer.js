import {parse} from 'acorn';
import {simple} from 'acorn-walk';
import {ExtClassMeta} from './ClassMeta.js';
import {ExtFileMeta} from './FileMeta.js';

export class ExtAnalyzer {
    static #code = '';
    static classMap = {};
    static xTypeMap = {};
    static aliasMap = {};
    static fileMap = {};

    static get code() {
        return this.#code;
    }

    static getSource(node) {
        return this.code.slice(node.start, node.end);
    }

    static argsToStr(args = []) {
        return args.reduce((_, cur) => this.getSource(cur), '');
    }

    static propToArray({type, elements, value}) {
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

    static findCallParent(node, className, isOverride) {
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
                                            this.getSource(node.callee.object),
                                            this.argsToStr(node.arguments),
                                            isOverride
                                        );
                                        matches.push({node: {start: node.start, end: node.end}, replacement});
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
        this.#code = code;
        const ast = parse(this.code, {ecmaVersion: 2020});
        const fileMeta = new ExtFileMeta(importPath);
        fileMeta.setAST(ast);
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
                        const classMeta = new ExtClassMeta({name, importPath});
                        this.classMap[name] = classMeta;
                        const props = node.expression.arguments[1].properties;
                        props?.forEach(prop => {
                            // alias
                            if (['alias', 'xtype'].includes(prop.key.name)) {
                                classMeta[prop.key.name] = prop.value.value;
                            }
                            // alternateClassName
                            if (prop.key.name === 'alternateClassName') {
                                classMeta.alternateNames = this.propToArray(prop.value);
                            }
                            // extend, override
                            if (['extend', 'override'].includes(prop.key.name)) {
                                classMeta[prop.key.name] = prop.value.value;
                                fileMeta.addCallParentNodes(this.findCallParent(node, prop.value.value, prop.key.name === 'override'));
                            }
                            // uses, requires, mixins
                            if (['uses', 'requires', 'mixins'].includes(prop.key.name)) {
                                // TODO mixins can be object
                                classMeta[prop.key.name] = this.propToArray(prop.value);
                            }
                        });
                        fileMeta.addDefinedClass(classMeta);
                        if (classMeta.alternateNames.length) {
                            classMeta.alternateNames.forEach(name => {
                                this.classMap[name] = classMeta;
                            });
                        }
                        if (classMeta.xtype) {
                            this.xTypeMap[classMeta.xtype] = classMeta;
                        }
                        if (classMeta.alias) {
                            this.aliasMap[classMeta.alias] = classMeta;
                        }
                    }
                }
            }
        });
        return ast;
    }
}
