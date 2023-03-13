import { simple } from 'acorn-walk';

export class CodeUtils {
    static #code = '';
    static get code() {
        return this.#code;
    }

    static set code(code) {
        this.#code = code;
    }

    static getSource(node) {
        return this.code.slice(node.start, node.end);
    }

    static argsToStr(args = []) {
        return args.reduce((_, cur) => this.getSource(cur), '');
    }

    static propToArray({ type, elements, value }) {
        const result = [];
        if (type === 'ArrayExpression') {
            elements.forEach((el) => {
                result.push(el.value);
            });
        } else if (type === 'Literal') {
            result.push(value);
        }
        return result;
    }

    static getCallParentReplacement(className, fnName, node, isOverride) {
        const scope = this.getSource(node.callee.object);
        const args = this.argsToStr(node.arguments);
        const argStr = args.length ? `${scope}, ${args}` : scope;
        let fn = `(${className}.prototype || ${className})['${fnName}']`;
        if (isOverride) {
            fn = `(${fn}['$previous'] || ${fn})`;
        }
        return `${fn}.apply(${argStr})`;
    }

    static prepareTransforms(node, className) {
        const dataNode = node.expression.arguments[1];
        const matches = [];
        simple(dataNode, {
            Property: (prop) => {
                if (prop.value?.type === 'FunctionExpression') {
                    const fnName = prop.key.name;
                    simple(prop, {
                        FunctionExpression: (fnBody) => {
                            simple(fnBody, {
                                CallExpression: (node) => {
                                    if (node.callee?.property?.name === 'callParent') {
                                        const existing = matches.find(
                                            (m) => m.node.start === node.start && m.node.end === node.end
                                        );
                                        if (!existing) {
                                            matches.push({
                                                node: {
                                                    start: node.start,
                                                    end: node.end,
                                                },
                                                replacement: this.getCallParentReplacement(className, fnName, node),
                                            });
                                        }
                                    }
                                },
                            });
                        },
                    });
                }
            },
        });
        return matches;
    }

    static replaceCode(code, node, replacement = '') {
        let transformedCode = code.slice(0, node.start);
        transformedCode += replacement;
        transformedCode += code.slice(node.end);
        return transformedCode;
    }
}
