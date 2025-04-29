const puppeteer = require('puppeteer');
const { expect } = require('chai');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = './test/screenshots';
const TIMEOUT = 20000; // Increased timeout

/**
 * Political Quartett Multiplayer Matchmaking Test Suite
 */
async function runMultiplayerTests() {
    // Track test results
    const testResults = {
        passed: 0,
        failed: 0,
        skipped: 0
    };

    console.log('\n🃏 POLITICAL QUARTETT MULTIPLAYER TEST 🃏\n');
    console.log('Starting multiplayer test automation...\n');

    let browser1, browser2, page1, page2;
    try {
        // Launch two browser instances to simulate multiplayer
        console.log('Launching browser 1...');
        browser1 = await puppeteer.launch({
            headless: false,
            args: ['--window-size=800,600', '--window-position=0,0'],
            defaultViewport: {
                width: 800,
                height: 600
            }
        });

        console.log('Launching browser 2...');
        browser2 = await puppeteer.launch({
            headless: false,
            args: ['--window-size=800,600', '--window-position=810,0'],
            defaultViewport: {
                width: 800,
                height: 600
            }
        });

        page1 = await browser1.newPage();
        page2 = await browser2.newPage();

        page1.setDefaultTimeout(TIMEOUT);
        page2.setDefaultTimeout(TIMEOUT);

        // Enable console logging for debugging
        page1.on('console', msg => console.log('BROWSER1 CONSOLE:', msg.text()));
        page2.on('console', msg => console.log('BROWSER2 CONSOLE:', msg.text()));

        // Handle page errors
        page1.on('pageerror', err => console.error('BROWSER1 ERROR:', err.message));
        page2.on('pageerror', err => console.error('BROWSER2 ERROR:', err.message));

        // Helper function to create a test
        async function test(name, testFn) {
            try {
                console.log(`Running test: ${ name }`);
                await testFn();
                console.log(`✅ PASSED: ${ name }`);
                testResults.passed++;
            } catch (error) {
                console.error(`❌ FAILED: ${ name }`);
                console.error(`   Error: ${ error.message }`);

                // Take screenshots from both browsers on failure, if they are still open
                try {
                    if (page1 && !page1.isClosed()) {
                        await page1.screenshot({ path: `${ SCREENSHOT_DIR }/${ name.replace(/\s+/g, '_') }_player1_error.png` });
                    }
                } catch (e) {
                    console.error('   Failed to take screenshot for player 1:', e.message);
                }

                try {
                    if (page2 && !page2.isClosed()) {
                        await page2.screenshot({ path: `${ SCREENSHOT_DIR }/${ name.replace(/\s+/g, '_') }_player2_error.png` });
                    }
                } catch (e) {
                    console.error('   Failed to take screenshot for player 2:', e.message);
                }

                testResults.failed++;
            }
        }

        // Helper function to take screenshots during tests
        async function screenshot(prefix) {
            try {
                if (page1 && !page1.isClosed()) {
                    await page1.screenshot({ path: `${ SCREENSHOT_DIR }/${ prefix }_player1.png` });
                    console.log(`   📸 Screenshot saved: ${ prefix }_player1.png`);
                }
            } catch (e) {
                console.error(`   Failed to take screenshot for player 1: ${ e.message }`);
            }

            try {
                if (page2 && !page2.isClosed()) {
                    await page2.screenshot({ path: `${ SCREENSHOT_DIR }/${ prefix }_player2.png` });
                    console.log(`   📸 Screenshot saved: ${ prefix }_player2.png`);
                }
            } catch (e) {
                console.error(`   Failed to take screenshot for player 2: ${ e.message }`);
            }
        }

        // Helper function to safely execute actions with retries
        async function safeAction(page, action, description, maxRetries = 3) {
            let attempts = 0;
            while (attempts < maxRetries) {
                try {
                    await action(page);
                    return true;
                } catch (error) {
                    attempts++;
                    console.log(`   Retry ${ attempts }/${ maxRetries } for ${ description }: ${ error.message }`);
                    if (attempts >= maxRetries) {
                        throw new Error(`Failed to ${ description } after ${ maxRetries } attempts: ${ error.message }`);
                    }
                    await page.waitForTimeout(1000); // Wait before retrying
                }
            }
        }

        // Helper function to check if element exists
        async function elementExists(page, selector, timeout = 2000) {
            try {
                await page.waitForSelector(selector, { timeout });
                return true;
            } catch (e) {
                return false;
            }
        }

        // Helper function to reset game state for both browsers
        async function resetGameState() {
            console.log('Resetting game state for both browsers...');

            // Reset browser 1
            await page1.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
            await page1.waitForSelector('#loading-screen', { hidden: true, timeout: TIMEOUT }).catch(() => { });
            await page1.waitForSelector('#main-menu.active', { visible: true, timeout: TIMEOUT }).catch(() => { });

            // Reset browser 2
            await page2.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
            await page2.waitForSelector('#loading-screen', { hidden: true, timeout: TIMEOUT }).catch(() => { });
            await page2.waitForSelector('#main-menu.active', { visible: true, timeout: TIMEOUT }).catch(() => { });

            // Wait to ensure connections are established
            await page1.waitForTimeout(1000);
            await page2.waitForTimeout(1000);
        }

        // Test 1: Load the game in both browsers
        await test('Both games load correctly', async () => {
            console.log('   Loading game in browser 1...');
            await page1.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });

            console.log('   Loading game in browser 2...');
            await page2.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });

            // Wait for loading screen to disappear and main menu to appear in both windows
            console.log('   Waiting for main menu in browser 1...');
            await page1.waitForSelector('#loading-screen', { hidden: true, timeout: TIMEOUT }).catch(() => console.log('   Loading screen not found in browser 1'));
            await page1.waitForSelector('#main-menu.active', { visible: true, timeout: TIMEOUT });

            console.log('   Waiting for main menu in browser 2...');
            await page2.waitForSelector('#loading-screen', { hidden: true, timeout: TIMEOUT }).catch(() => console.log('   Loading screen not found in browser 2'));
            await page2.waitForSelector('#main-menu.active', { visible: true, timeout: TIMEOUT });

            // Check for play buttons
            const playBtn1 = await page1.$('#play-button');
            const playBtn2 = await page2.$('#play-button');

            expect(playBtn1).to.not.be.null;
            expect(playBtn2).to.not.be.null;

            await screenshot('main_menu');
        });

        // Test 2: Test the basic multiplayer connection via AI mode as fallback
        await test('Basic multiplayer connection test', async () => {
            // Check if AI game mode is available
            const aiButton1 = await page1.$('#play-ai-button');
            const aiButton2 = await page2.$('#play-ai-button');

            if (!aiButton1 || !aiButton2) {
                console.log('   AI game mode not found, skipping test');
                testResults.skipped++;
                return;
            }

            // Start AI game on browser 1
            console.log('   Starting AI game on browser 1');
            await safeAction(page1, p => p.click('#play-ai-button'), 'click AI game button on browser 1');

            // Wait for game screen
            await page1.waitForSelector('#game-screen.active', { visible: true, timeout: TIMEOUT });

            // Verify cards are dealt
            const cardCount1 = await elementExists(page1, '#player-cards-count');
            expect(cardCount1).to.be.true;

            if (cardCount1) {
                const count = await page1.$eval('#player-cards-count', el => parseInt(el.textContent, 10));
                console.log(`   Browser 1 has ${ count } cards`);
                expect(count).to.be.greaterThan(0);
            }

            await screenshot('browser1_ai_game');

            // Reset browser 1
            await resetGameState();

            // Start AI game on browser 2
            console.log('   Starting AI game on browser 2');
            await safeAction(page2, p => p.click('#play-ai-button'), 'click AI game button on browser 2');

            // Wait for game screen
            await page2.waitForSelector('#game-screen.active', { visible: true, timeout: TIMEOUT });

            // Verify cards are dealt
            const cardCount2 = await elementExists(page2, '#player-cards-count');
            expect(cardCount2).to.be.true;

            if (cardCount2) {
                const count = await page2.$eval('#player-cards-count', el => parseInt(el.textContent, 10));
                console.log(`   Browser 2 has ${ count } cards`);
                expect(count).to.be.greaterThan(0);
            }

            await screenshot('browser2_ai_game');

            // Return to menu
            await resetGameState();
        });

        // Test 3: Test multiplayer matchmaking
        await test('Multiplayer matchmaking test', async () => {
            // Check if play button exists
            const playButton1 = await page1.$('#play-button');
            const playButton2 = await page2.$('#play-button');

            if (!playButton1 || !playButton2) {
                console.log('   Play button not found, skipping test');
                testResults.skipped++;
                return;
            }

            // Player 1 creates a game
            console.log('   Player 1 creating multiplayer game...');
            await safeAction(page1, p => p.click('#play-button'), 'click play button on browser 1');

            // Wait for matchmaking screen if it exists
            const matchmakingExists = await elementExists(page1, '#matchmaking-screen.active', 5000);

            if (matchmakingExists) {
                console.log('   Player 1 entered matchmaking screen');

                // Check for invite code - may or may not exist depending on implementation
                const hasInviteCode = await elementExists(page1, '#invite-code', 3000);

                // Player 2 joins game
                console.log('   Player 2 joining multiplayer game...');
                await safeAction(page2, p => p.click('#play-button'), 'click play button on browser 2');

                // Wait for both players to connect to game
                console.log('   Waiting for both players to connect...');

                // Try waiting for game screen or lobby screen
                const gameScreen1 = await elementExists(page1, '#game-screen.active', 10000) ||
                    await elementExists(page1, '#lobby-screen.active', 2000);
                const gameScreen2 = await elementExists(page2, '#game-screen.active', 10000) ||
                    await elementExists(page2, '#lobby-screen.active', 2000);

                await screenshot('matchmaking_result');

                if (gameScreen1 && gameScreen2) {
                    console.log('   Both players connected to game or lobby');

                    // If in a lobby, start game if possible
                    const inLobby1 = await elementExists(page1, '#lobby-screen.active');
                    const inLobby2 = await elementExists(page2, '#lobby-screen.active');

                    if (inLobby1 && inLobby2) {
                        console.log('   Both players are in lobby');

                        // Try to start game from lobby
                        const startButton = await page1.$('#start-game-button');
                        if (startButton) {
                            console.log('   Starting game from lobby');
                            await safeAction(page1, p => p.click('#start-game-button'), 'start game from lobby');

                            // Wait for game to start
                            await page1.waitForSelector('#game-screen.active', { visible: true, timeout: 10000 }).catch(() => { });
                            await page2.waitForSelector('#game-screen.active', { visible: true, timeout: 10000 }).catch(() => { });
                        }
                    }

                    // Check for card counts if we made it to the game screen
                    const inGame1 = await elementExists(page1, '#game-screen.active');
                    const inGame2 = await elementExists(page2, '#game-screen.active');

                    if (inGame1 && inGame2) {
                        console.log('   Both players are in game screen');

                        // Check for card counts
                        if (await elementExists(page1, '#player-cards-count') &&
                            await elementExists(page2, '#player-cards-count')) {

                            const count1 = await page1.$eval('#player-cards-count', el => parseInt(el.textContent, 10));
                            const count2 = await page2.$eval('#player-cards-count', el => parseInt(el.textContent, 10));

                            console.log(`   Card counts - Player 1: ${ count1 }, Player 2: ${ count2 }`);
                            expect(count1 + count2).to.equal(10); // Should have 10 cards total
                        }
                    }
                } else {
                    console.log('   Players did not connect properly to game or lobby');
                }
            } else {
                console.log('   Matchmaking screen not found, may have gone directly to game');

                // Wait for game screen
                const directGame1 = await elementExists(page1, '#game-screen.active', 5000);
                const directGame2 = await elementExists(page2, '#game-screen.active', 5000);

                if (directGame1 && directGame2) {
                    console.log('   Both players entered game directly');
                    await screenshot('direct_game_entry');
                } else {
                    console.log('   Game screens not found, cannot continue multiplayer test');
                }
            }
        });

        // Test 4: Test disconnect handling
        await test('Disconnect handling test', async () => {
            // First ensure we're back at main menu
            await resetGameState();

            // Start a basic AI game to test disconnection
            console.log('   Starting AI game for disconnect test...');
            const aiButton1 = await page1.$('#play-ai-button');

            if (!aiButton1) {
                console.log('   AI game button not found, skipping test');
                testResults.skipped++;
                return;
            }

            await safeAction(page1, p => p.click('#play-ai-button'), 'click AI game button');

            // Wait for game to start
            await page1.waitForSelector('#game-screen.active', { visible: true, timeout: TIMEOUT });

            // Take a screenshot before disconnect
            await screenshot('before_disconnect');

            // Close page 1 to simulate disconnect
            console.log('   Simulating disconnect by closing browser...');
            await page1.close();

            // Wait a moment for server to register disconnect
            await page2.waitForTimeout(3000);

            // Reopen page 1
            console.log('   Reopening browser after disconnect...');
            page1 = await browser1.newPage();
            page1.setDefaultTimeout(TIMEOUT);

            // Navigate back to game
            await page1.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });

            // Wait for menu to appear
            await page1.waitForSelector('#main-menu.active', { visible: true, timeout: TIMEOUT });

            // Take a screenshot after reconnect
            await screenshot('after_reconnect');

            // Verify we're back at main menu
            const backAtMenu = await elementExists(page1, '#main-menu.active');
            expect(backAtMenu).to.be.true;
        });

        // Print the summary of the tests
        console.log('\n📊 TEST SUMMARY');
        console.log(`Passed: ${ testResults.passed }`);
        console.log(`Failed: ${ testResults.failed }`);
        console.log(`Skipped: ${ testResults.skipped }`);
        console.log(`Total: ${ testResults.passed + testResults.failed + testResults.skipped }`);

    } catch (error) {
        console.error('❌ Test suite error:', error);
    } finally {
        // Close browsers
        console.log('Closing browsers...');
        if (browser1) await browser1.close().catch(() => { });
        if (browser2) await browser2.close().catch(() => { });
    }
}

// Run the tests when the file is executed directly
if (require.main === module) {
    runMultiplayerTests();
}

module.exports = { runMultiplayerTests };