"use strict";

const getSafeRedirect = (target) => {
    if (
        typeof target === "string" &&
        target.startsWith("/") &&
        !target.startsWith("//") &&
        !target.includes("\\")
    ) {
        return target;
    }

    return "/";
};

module.exports = getSafeRedirect;
