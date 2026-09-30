module.exports = {
   
   zapHostName: "192.168.56.20",
   zapPort: "8080",

    zapApiKey: process.env.ZAP_API_KEY,


   zapApiFeedbackSpeed: 5000, 
   environmentalScripts: [

      `<script>document.write("<script src='http://" + (location.host || "localhost").split(":")[0] + ":35729/livereload.js'></" + "script>");</script>`

   ]
};
