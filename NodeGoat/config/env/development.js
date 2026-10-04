module.exports = {
    // ZAP configuration
    zapHostName: "192.168.56.20",
    zapPort: "8080",

    // Read ZAP API key from environment variable
    zapApiKey: process.env.ZAP_API_KEY || "",

    // Required if debugging security regression tests
    zapApiFeedbackSpeed: 5000,

    environmentalScripts: [
        `<script>document.write("<script src='http://" + (location.host || "localhost").split(":")[0] + ":35729/livereload.js'></" + "script>");</script>`
    ]
};