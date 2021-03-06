// MIT © 2017 azu
"use strict";
import { TextlintMessage } from "@textlint/kernel";

const assert = require("assert");
import { TextlintKernel } from "../src/textlint-kernel";
import { errorRule } from "./helper/ErrorRule";
import { createPluginStub, ExampleProcessorOptions } from "./helper/ExamplePlugin";
import SeverityLevel from "../src/shared/type/SeverityLevel";

/**
 * assert: TextlintMessage must have these properties
 */
const assertMessage = (message: TextlintMessage) => {
    assert.strictEqual(typeof message.type, "string");
    assert.strictEqual(typeof message.ruleId, "string");
    assert.strictEqual(typeof message.message, "string");
    assert.strictEqual(typeof message.index, "number");
    assert.strictEqual(typeof message.line, "number");
    assert.strictEqual(typeof message.column, "number");
    assert.ok(
        SeverityLevel.info === message.severity ||
            message.severity === SeverityLevel.warning ||
            message.severity === SeverityLevel.error
    );
};

describe("textlint-kernel", () => {
    describe("#lintText", () => {
        it("should return messages", () => {
            const kernel = new TextlintKernel();
            const { plugin } = createPluginStub({
                extensions: [".md"]
            });
            const options = {
                filePath: "/path/to/file.md",
                ext: ".md",
                plugins: [{ pluginId: "markdown", plugin: plugin }],
                rules: [
                    { ruleId: "error", rule: errorRule, options: { errors: [{ message: "error message", index: 0 }] } }
                ]
            };
            return kernel.lintText("text", options).then(result => {
                assert.strictEqual(result.filePath, options.filePath);
                assert.strictEqual(result.messages.length, 1);
                result.messages.forEach(message => assertMessage(message));
            });
        });
        context("when rule has fixer", () => {
            it("should return messages that has `fix` object", () => {
                const kernel = new TextlintKernel();
                const expectedFixObject = {
                    range: [0, 5],
                    text: "fixed"
                };
                const { plugin } = createPluginStub();
                const options = {
                    filePath: "/path/to/file.md",
                    ext: ".md",
                    plugins: [{ pluginId: "markdown", plugin: plugin }],
                    rules: [
                        {
                            ruleId: "error",
                            rule: errorRule,
                            options: {
                                errors: [
                                    {
                                        message: "error message",
                                        index: 0,
                                        range: expectedFixObject.range,
                                        output: expectedFixObject.text
                                    }
                                ]
                            }
                        }
                    ]
                };
                return kernel.lintText("test text", options).then(result => {
                    assert.strictEqual(result.filePath, options.filePath);
                    assert.strictEqual(result.messages.length, 1);
                    const [message] = result.messages;
                    assertMessage(message);
                    if (typeof message.fix !== "object") {
                        throw new Error("Not found `fix` object");
                    }
                    assert.deepStrictEqual(message.fix, expectedFixObject);
                });
            });
        });
        it("should pass pluginOptions to plugin", () => {
            const kernel = new TextlintKernel();
            const { getOptions, plugin } = createPluginStub();
            const expectedPluginOptions: ExampleProcessorOptions = { testOption: "test" };
            const options = {
                filePath: "/path/to/file.md",
                ext: ".md",
                plugins: [{ pluginId: "example", plugin: plugin, options: expectedPluginOptions }],
                rules: [{ ruleId: "error", rule: errorRule }]
            };
            return kernel.lintText("text", options).then(_result => {
                const actualPluginOptions = getOptions();
                assert.deepEqual(actualPluginOptions, expectedPluginOptions);
            });
        });
        context("when pass invalid options", () => {
            it("should throw validation error", () => {
                const kernel = new TextlintKernel({});
                return kernel.lintText("text", { ext: "test", plugins: [{ pluginId: 1 }] } as any).catch(error => {
                    assert.ok(error instanceof Error);
                });
            });
        });
    });
    describe("#fixText", () => {
        it("should return messages", () => {
            const kernel = new TextlintKernel();
            const { plugin } = createPluginStub();
            const options = {
                filePath: "/path/to/file.md",
                ext: ".md",
                plugins: [{ pluginId: "markdown", plugin: plugin }],
                rules: [
                    { ruleId: "error", rule: errorRule, options: { errors: [{ message: "error message", index: 0 }] } }
                ]
            };
            return kernel.fixText("text", options).then(result => {
                assert.strictEqual(typeof result.filePath, "string");
                assert.strictEqual(result.messages.length, 1);
                result.messages.forEach(message => assertMessage(message));
            });
        });
        it("should pass pluginOptions to plugin", () => {
            const kernel = new TextlintKernel();
            const { getOptions, plugin } = createPluginStub();
            const expectedPluginOptions: ExampleProcessorOptions = { testOption: "test" };
            const options = {
                filePath: "/path/to/file.md",
                ext: ".md",
                plugins: [{ pluginId: "example", plugin: plugin, options: expectedPluginOptions }],
                rules: [{ ruleId: "error", rule: errorRule }]
            };
            return kernel.lintText("text", options).then(_result => {
                const actualPluginOptions = getOptions();
                assert.deepEqual(actualPluginOptions, expectedPluginOptions);
            });
        });
        context("when pass invalid options", () => {
            it("should throw validation error", () => {
                const kernel = new TextlintKernel({});
                return kernel.fixText("text", { ext: "test", plugins: [{ pluginId: 1 }] } as any).catch(error => {
                    assert.ok(error instanceof Error);
                });
            });
        });
    });
});
