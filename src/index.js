const core = require('@actions/core');
const fs = require('fs');
const path = require('path');
const Client = require('ftp');

async function run() {
  try {
    const server = core.getInput('server');
    const username = core.getInput('username');
    const password = core.getInput('password');
    const remotePath = core.getInput('remote-path');
    const localPath = core.getInput('local-path');

    const client = new Client();
    client.on('ready', async () => {
      core.info('Connected to FTP server');

      const files = getAllFiles(localPath);
      for (const file of files) {
        const fullPath = path.join(localPath, file);
        const stream = fs.createReadStream(fullPath);
        const remoteFilePath = path.join(remotePath, file);
        await uploadFile(client, stream, remoteFilePath);
      }

      client.end();
      core.info('Files uploaded successfully');
    });

    client.on('error', (err) => {
      core.setFailed(`Failed to upload files: ${err}`);
      client.end();
    });

    client.connect({
      host: server,
      user: username,
      password: password
    });
  } catch (error) {
    core.setFailed(`Action failed with error: ${error}`);
  }
}

function getAllFiles(dirPath) {
  const files = fs.readdirSync(dirPath);
  let fileList = [];

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      fileList = fileList.concat(getAllFiles(filePath));
    } else {
      fileList.push(file);
    }
  }

  return fileList;
}

function uploadFile(client, stream, remoteFilePath) {
  return new Promise((resolve, reject) => {
    client.put(stream, remoteFilePath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

run();