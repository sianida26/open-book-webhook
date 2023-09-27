require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.WEBHOOK_PORT;
const SECRET_KEY = process.env.SECRET_KEY;  // Change this to your secret key

app.use(bodyParser.json());
const LOG_FILE_PATH = './events.log';  // Path to the log file

// Custom logging function to prepend a timestamp to logs
function logWithTimestamp(message) {
    const timestamp = new Date().toISOString();
    // console.log(`[${timestamp}] ${message}`);
    fs.appendFileSync(LOG_FILE_PATH, `[${timestamp}] ${message}\n`)
}

app.get("/test", (req, res) => {
    res.send("Webhook server is running...");
})

app.post('/webhook', (req, res) => {
    const signature = req.headers['x-hub-signature'];
    const hmac = crypto.createHmac('sha1', SECRET_KEY);
    const digest = 'sha1=' + hmac.update(JSON.stringify(req.body)).digest('hex');
    const action = req.body.action;
    let scriptToRun = '';

     // Log the request to the logfile
    logWithTimestamp(`Request received with payload: ${JSON.stringify(req.body)}\n`);

    if (signature !== digest) {
        logWithTimestamp('Authentication failed');
        return res.status(403).send('Authentication failed');
    }

    if (action === 'update-opmx') {
        scriptToRun = './scripts/update-opmx.sh';
    } else if (action === 'update-bee') {
        scriptToRun = './scripts/update-bee.sh';
    } else if (action === 'update-opmx-tasks') {
        scriptToRun = './scripts/update-opmx-tasks.sh';
    } else if (action === 'update-bee-tasks') {
        scriptToRun = './scripts/update-bee-tasks.sh';
    } else if (action === 'update-webhook') {
        scriptToRun = './scripts/update-webhook.sh';
    } else if (action === "test-webhook"){
        scriptToRun = './scripts/test-webhook.sh';        
    } 
    else {
        logWithTimestamp(`Response: Invalid pull type\n`);
        return res.status(400).send('Invalid pull type');
    }

    exec(scriptToRun, (error, stdout, stderr) => {
        if (error) {
            logWithTimestamp(`exec error: ${error}`);
            return res.status(500).send('Failed to execute script');
        }
        logWithTimestamp(`stdout: ${stdout}`);
        if (stderr) {  // Only log stderr if it has content
            logWithTimestamp(`stderr: ${stderr}`);
        }
        res.send('Script executed successfully');
    });
});

app.listen(PORT, () => {
    logWithTimestamp(`Server is running on port ${PORT}`);
});
