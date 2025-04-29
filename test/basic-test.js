const http = require('http');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const REQUIRED_ENDPOINTS = ['/', '/health', '/js/card-data.js', '/js/game.js', '/js/ui.js', '/js/network.js', '/js/main.js'];
const CARDS_TO_CHECK = [
    'cards/card_Trump.png',
    'cards/card_Obama.png',
    'cards/card_Erdoğan.png',
    'cards/card_5_lauterbach.png',
    'cards/card_Merkel.png',
    'cards/card_Thunberg.png',
    'cards/card_Selenskyj.png',
    'cards/card_Steinbruec.png',
    'cards/card_Putin.png',
    'cards/card_Soeder.png'
];

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

// Test results
const results = {
    passed: 0,
    failed: 0,
    total: 0
};

/**
 * Sends an HTTP request and returns a promise with the response
 */
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Check if a required file exists in the project
 */
function checkFileExists(filePath) {
    return new Promise((resolve) => {
        fs.access(filePath, fs.constants.F_OK, (err) => {
            resolve(!err);
        });
    });
}

/**
 * Run a single test and report the result
 */
async function runTest(name, testFn) {
    results.total++;
    try {
        console.log(`${ colors.cyan }Running test: ${ name }${ colors.reset }`);
        await testFn();
        console.log(`${ colors.green }✓ PASSED: ${ name }${ colors.reset }`);
        results.passed++;
        return true;
    } catch (error) {
        console.error(`${ colors.red }✗ FAILED: ${ name }${ colors.reset }`);
        console.error(`  ${ colors.red }Error: ${ error.message }${ colors.reset }`);
        results.failed++;
        return false;
    }
}

/**
 * Main test function
 */
async function runTests() {
    console.log(`\n${ colors.magenta }🃏 POLITICAL QUARTETT BASIC TEST 🃏${ colors.reset }\n`);

    // Test 1: Check if server is running
    await runTest('Server is running', async () => {
        try {
            const response = await makeRequest(BASE_URL);
            if (response.statusCode !== 200) {
                throw new Error(`Server responded with status code ${ response.statusCode }`);
            }
        } catch (error) {
            throw new Error(`Server is not running at ${ BASE_URL }. Make sure to start the server with 'npm start'.`);
        }
    });

    // Test 2: Check required endpoints
    await runTest('Required endpoints are accessible', async () => {
        const failures = [];

        for (const endpoint of REQUIRED_ENDPOINTS) {
            try {
                const response = await makeRequest(`${ BASE_URL }${ endpoint }`);
                if (response.statusCode !== 200) {
                    failures.push(`Endpoint ${ endpoint } returned status code ${ response.statusCode }`);
                }
            } catch (error) {
                failures.push(`Endpoint ${ endpoint } is not accessible: ${ error.message }`);
            }
        }

        if (failures.length > 0) {
            throw new Error(`Some endpoints are not accessible:\n${ failures.join('\n') }`);
        }
    });

    // Test 3: Check if required files exist locally
    await runTest('Required files exist locally', async () => {
        const requiredFiles = [
            'index.html',
            'js/card-data.js',
            'js/game.js',
            'js/ui.js',
            'js/network.js',
            'js/main.js',
            'styles/main.css',
            'server.js'
        ];

        const failures = [];

        for (const file of requiredFiles) {
            const exists = await checkFileExists(path.join(process.cwd(), file));
            if (!exists) {
                failures.push(`File ${ file } does not exist`);
            }
        }

        if (failures.length > 0) {
            throw new Error(`Some required files are missing:\n${ failures.join('\n') }`);
        }
    });

    // Test 4: Check if card image files exist locally
    await runTest('Card images exist locally', async () => {
        const failures = [];

        for (const card of CARDS_TO_CHECK) {
            const exists = await checkFileExists(path.join(process.cwd(), card));
            if (!exists) {
                failures.push(`Card image ${ card } does not exist`);
            }
        }

        if (failures.length > 0) {
            throw new Error(`Some card images are missing:\n${ failures.join('\n') }`);
        }
    });

    // Test 5: Check if card images are accessible through the server
    await runTest('Card images are accessible through the server', async () => {
        const failures = [];

        for (const card of CARDS_TO_CHECK) {
            try {
                const response = await makeRequest(`${ BASE_URL }/${ card }`);
                if (response.statusCode !== 200) {
                    failures.push(`Card image ${ card } returned status code ${ response.statusCode }`);
                }
            } catch (error) {
                failures.push(`Card image ${ card } is not accessible: ${ error.message }`);
            }
        }

        if (failures.length > 0) {
            throw new Error(`Some card images are not accessible:\n${ failures.join('\n') }`);
        }
    });

    // Test 6: Verify HTML has necessary game elements
    await runTest('HTML has necessary game elements', async () => {
        try {
            const response = await makeRequest(BASE_URL);
            const html = response.data;

            const requiredElements = [
                'loading-screen',
                'main-menu',
                'matchmaking-screen',
                'game-screen',
                'rules-screen',
                'game-over-screen',
                'play-button',
                'play-ai-button',
                'rules-button',
                'player-card',
                'opponent-card',
                'category-selection'
            ];

            const failures = [];

            for (const element of requiredElements) {
                if (!html.includes(`id="${ element }"`)) {
                    failures.push(`Element with id="${ element }" not found in HTML`);
                }
            }

            if (failures.length > 0) {
                throw new Error(`Some required elements are missing:\n${ failures.join('\n') }`);
            }
        } catch (error) {
            throw new Error(`Failed to verify HTML elements: ${ error.message }`);
        }
    });

    // Test 7: Check if JS files contain the necessary class declarations
    await runTest('JS files contain necessary class declarations', async () => {
        const jsClasses = [
            { file: 'js/game.js', class: 'Game' },
            { file: 'js/ui.js', class: 'UI' },
            { file: 'js/network.js', class: 'Network' }
        ];

        const failures = [];

        for (const jsClass of jsClasses) {
            try {
                const content = await fs.promises.readFile(path.join(process.cwd(), jsClass.file), 'utf8');
                if (!content.includes(`class ${ jsClass.class }`)) {
                    failures.push(`Class "${ jsClass.class }" not found in ${ jsClass.file }`);
                }
            } catch (error) {
                failures.push(`Failed to read ${ jsClass.file }: ${ error.message }`);
            }
        }

        if (failures.length > 0) {
            throw new Error(`Some required class declarations are missing:\n${ failures.join('\n') }`);
        }
    });

    // Test 8: Check if card data file contains all required cards
    await runTest('Card data file contains all required cards', async () => {
        try {
            const content = await fs.promises.readFile(path.join(process.cwd(), 'js/card-data.js'), 'utf8');

            const requiredCards = [
                'Trump', 'Obama', 'Erdoğan', 'Lauterbach', 'Merkel',
                'Thunberg', 'Selenskyj', 'Steinbrück', 'Putin', 'Söder'
            ];

            const failures = [];

            for (const card of requiredCards) {
                if (!content.includes(card)) {
                    failures.push(`Card "${ card }" not found in card-data.js`);
                }
            }

            if (failures.length > 0) {
                throw new Error(`Some required cards are missing:\n${ failures.join('\n') }`);
            }
        } catch (error) {
            throw new Error(`Failed to verify card data: ${ error.message }`);
        }
    });

    // Print test summary
    console.log(`\n${ colors.magenta }📊 TEST SUMMARY${ colors.reset }`);
    console.log(`${ colors.green }Passed: ${ results.passed }${ colors.reset }`);
    console.log(`${ colors.red }Failed: ${ results.failed }${ colors.reset }`);
    console.log(`${ colors.cyan }Total: ${ results.total }${ colors.reset }\n`);

    if (results.failed === 0) {
        console.log(`${ colors.green }All tests passed! The game should be ready to play.${ colors.reset }`);
        console.log('You can now visit http://localhost:3000 in your browser to play the game.\n');
    } else {
        console.log(`${ colors.red }Some tests failed. Please fix the issues and try again.${ colors.reset }\n`);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = { runTests };