/**
 * Demo Runner - Runs the card game demo files
 */
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Find demo files
const demoFiles = fs.readdirSync(__dirname)
    .filter(file => file.endsWith('-demo.js'))
    .map(file => join(__dirname, file));

if (demoFiles.length === 0) {
    console.log("No demo files found!");
    process.exit(1);
}

console.log(`Found ${ demoFiles.length } demo files to run:\n`);
demoFiles.forEach(file => console.log(`- ${ file.split('/').pop() }`));
console.log();

// Function to run a demo file
function runDemo(file) {
    return new Promise((resolve, reject) => {
        console.log(`\n=== Running ${ file.split('/').pop() } ===\n`);

        const child = exec(`node ${ file }`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing ${ file }:`, error);
                reject(error);
                return;
            }

            if (stderr) {
                console.error(`Stderr output from ${ file }:`, stderr);
            }

            console.log(stdout);
            resolve();
        });
    });
}

// Run demos in sequence
async function runDemos() {
    for (const file of demoFiles) {
        try {
            await runDemo(file);
            console.log(`\n=== Completed ${ file.split('/').pop() } ===\n`);
        } catch (error) {
            console.error(`Failed to run ${ file }:`, error);
        }
    }

    console.log("All demos completed!");
}

runDemos();