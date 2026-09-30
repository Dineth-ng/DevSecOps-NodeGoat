"use strict";

const assert = require("assert");
const getSafeRedirect = require("../../app/routes/redirect");

describe("getSafeRedirect", () => {
    const testCases = [
        { target: "/profile", expected: "/profile" },
        { target: "/dashboard", expected: "/dashboard" },
        { target: "/", expected: "/" },
        { target: "https://example.com", expected: "/" },
        { target: "http://example.com", expected: "/" },
        { target: "//example.com", expected: "/" },
        { target: "\\example.com", expected: "/" },
        { target: undefined, expected: "/" },
        { target: 123, expected: "/" }
    ];

    testCases.forEach((testCase) => {
        it(`maps ${String(testCase.target)} to ${testCase.expected}`, () => {
            assert.strictEqual(getSafeRedirect(testCase.target), testCase.expected);
        });
    });
});
