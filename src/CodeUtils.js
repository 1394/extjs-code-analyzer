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

    static prepareTransforms(node, className, type) {
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
                                        const replacement = this.getCallParentReplacement(
                                            className,
                                            fnName,
                                            node,
                                            type === 'override'
                                        );
                                        matches.push({
                                            node: {
                                                start: node.start,
                                                end: node.end,
                                            },
                                            replacement,
                                        });
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
