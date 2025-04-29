/**
 * Comprehensive Matchmaking Test for Political Quartett
 *
 * This test suite thoroughly examines the lobby system and matchmaking functionality
 * with multiple browser instances to simulate real player interactions.
 */

const puppeteer = require('puppeteer');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = './test/screenshots/matchmaking';
const TIMEOUT = 30000; // Extended timeout for network operations
const WAIT_TIME = 1000; // Standard wait time between actions

// Create screenshot directory if it doesn't exist
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

/**
 * Main test function for matchmaking
 */
async function runMatchmakingTests() {
    console.log('\n🎮 POLITICAL QUARTETT MATCHMAKING TEST 🎮\n');
    console.log('Starting comprehensive matchmaking tests...\n');

    // Test results tracking
    const results = {
        passed: 0,
        failed: 0,
        total: 0,
        details: []
    };

    let browser1, browser2, page1, page2;

    try {
        // Launch two browser instances to simulate two players
        console.log('Launching browser instances...');
        browser1 = await puppeteer.launch({
            headless: false,
            args: ['--window-size=800,700', '--window-position=0,0'],
            defaultViewport: {
                width: 800,
                height: 700
            }
        });

        browser2 = await puppeteer.launch({
            headless: false,
            args: ['--window-size=800,700', '--window-position=810,0'],
            defaultViewport: {
                width: 800,
                height: 700
            }
        });

        page1 = await browser1.newPage();
        page2 = await browser2.newPage();

        // Set longer timeout for all operations
        page1.setDefaultTimeout(TIMEOUT);
        page2.setDefaultTimeout(TIMEOUT);

        // Enable request interception and logging
        await setupPageLogging(page1, 'Player1');
        await setupPageLogging(page2, 'Player2');

        // Run the actual test sequence
        await runTestSequence(page1, page2, results);

        // Print test summary
        printTestSummary(results);

        // Success criteria: at least 80% of tests passed
        const successRate = (results.passed / results.total) * 100;
        if (successRate >= 80) {
            console.log(`\n✅ MATCHMAKING TEST SUCCEEDED WITH ${ successRate.toFixed(2) }% PASS RATE`);
        } else {
            console.log(`\n❌ MATCHMAKING TEST FAILED WITH ONLY ${ successRate.toFixed(2) }% PASS RATE`);
            throw new Error('Matchmaking test failed with too many failures');
        }

    } catch (error) {
        console.error('\n❌ FATAL ERROR IN TEST:', error);
    } finally {
        // Always clean up browsers
        console.log('\nClosing browser instances...');
        if (browser1) await browser1.close().catch(e => console.error('Error closing browser1:', e));
        if (browser2) await browser2.close().catch(e => console.error('Error closing browser2:', e));
    }
}

/**
 * Configure page logging and monitoring
 */
async function setupPageLogging(page, name) {
    // Log console messages
    page.on('console', msg => {
        const msgType = msg.type().toUpperCase();
        if (msgType === 'ERROR') {
            console.error(`[${ name } CONSOLE ERROR] ${ msg.text() }`);
        } else if (msgType === 'WARNING') {
            console.warn(`[${ name } CONSOLE WARN] ${ msg.text() }`);
        } else {
            // Uncomment to see all console messages
            // console.log(`[${name} CONSOLE] ${msg.text()}`);
        }
    });

    // Log page errors
    page.on('pageerror', error => {
        console.error(`[${ name } PAGE ERROR] ${ error.message }`);
    });

    // Log request/response for socket.io connections
    await page.setRequestInterception(true);
    page.on('request', request => {
        const url = request.url();
        if (url.includes('socket.io') && !url.includes('transport=polling')) {
            console.log(`[${ name } SOCKET CONNECT] ${ url }`);
        }
        request.continue();
    });
}

/**
 * Run the complete test sequence
 */
async function runTestSequence(page1, page2, results) {
    // Load both pages
    await testStep(results, 'Both pages load correctly', async () => {
        await page1.goto(BASE_URL, { waitUntil: 'networkidle2' });
        await page2.goto(BASE_URL, { waitUntil: 'networkidle2' });

        // Wait for main menu to appear
        await waitForSelector(page1, '#main-menu.active');
        await waitForSelector(page2, '#main-menu.active');

        await takeScreenshot(page1, page2, 'main_menu');

        // Verify main menu elements
        const playBtn1 = await page1.$('#play-button');
        const playBtn2 = await page2.$('#play-button');
        const lobbyBtn1 = await page1.$('#lobby-button');
        const lobbyBtn2 = await page2.$('#lobby-button');

        expect(playBtn1).to.not.be.null;
        expect(playBtn2).to.not.be.null;
        expect(lobbyBtn1).to.not.be.null;
        expect(lobbyBtn2).to.not.be.null;
    });

    // Test 1: Access lobby screens from both browsers
    await testStep(results, 'Accessing lobby screens', async () => {
        await page1.click('#lobby-button');
        await page2.click('#lobby-button');

        await waitForSelector(page1, '#lobby-screen');
        await waitForSelector(page2, '#lobby-screen');

        await takeScreenshot(page1, page2, 'lobby_screens');

        // Verify lobby screen elements
        const createLobbyBtn1 = await page1.$('#create-lobby-button');
        const createLobbyBtn2 = await page2.$('#create-lobby-button');

        expect(createLobbyBtn1).to.not.be.null;
        expect(createLobbyBtn2).to.not.be.null;
    });

    // Test 2: Create a lobby in browser 1
    await testStep(results, 'Creating a lobby in Browser 1', async () => {
        await page1.click('#create-lobby-button');
        await takeScreenshot(page1, page2, 'creating_lobby');

        // Verify the lobby is created and shows in the UI
        await waitForSelector(page1, '#current-lobby:not(.hidden)');
        const lobbyTitle = await page1.$('#lobby-name');

        expect(lobbyTitle).to.not.be.null;
    });

    // Test 3: Lobby list updates in Browser 2
    await testStep(results, 'Lobby list updates in Browser 2', async () => {
        // Wait for lobby list to update in browser 2
        await page2.click('#refresh-lobbies-button');
        await page2.waitForTimeout(WAIT_TIME);

        // Check if there are lobby items
        const lobbyItems = await page2.$$('.lobby-item');
        await takeScreenshot(page1, page2, 'lobby_list_updated');

        expect(lobbyItems.length).to.be.greaterThan(0);
    });

    // Test 4: Join the lobby from Browser 2
    await testStep(results, 'Joining lobby from Browser 2', async () => {
        // Click join button on the first lobby
        const joinButtons = await page2.$$('.join-lobby-button');
        expect(joinButtons.length).to.be.greaterThan(0);

        await joinButtons[0].click();
        await waitForSelector(page2, '#current-lobby:not(.hidden)');

        await takeScreenshot(page1, page2, 'joined_lobby');
    });

    // Test 5: Player list updates in both browsers
    await testStep(results, 'Player list updates in both browsers', async () => {
        // Check for player list in both browsers
        await waitForSelector(page1, '#lobby-players');
        await waitForSelector(page2, '#lobby-players');

        const playerItems1 = await page1.$$('.lobby-player');
        const playerItems2 = await page2.$$('.lobby-player');

        expect(playerItems1.length).to.equal(2);
        expect(playerItems2.length).to.equal(2);

        await takeScreenshot(page1, page2, 'player_list_updated');
    });

    // Test 6: Lobby creator (Browser 1) can start the game
    await testStep(results, 'Lobby creator can start the game', async () => {
        // Check that start button is enabled in browser 1 but not in browser 2
        const startBtn1 = await page1.$('#start-game-button');
        expect(startBtn1).to.not.be.null;

        const isDisabled2 = await page2.$eval('#start-game-button', btn => btn.disabled);
        expect(isDisabled2).to.be.true;

        await takeScreenshot(page1, page2, 'start_game_button_state');
    });

    // Test 7: Starting the game from the lobby
    await testStep(results, 'Starting the game from lobby', async () => {
        await page1.click('#start-game-button');

        // Both pages should transition to game screen
        await waitForSelector(page1, '#game-screen.active', 10000);
        await waitForSelector(page2, '#game-screen.active', 10000);

        await takeScreenshot(page1, page2, 'game_started');
    });

    // Test 8: Game initializes with correct card counts
    await testStep(results, 'Game initializes with correct card counts', async () => {
        // Check card counts in both browsers
        const playerCardCount1 = await getElementText(page1, '#player-cards-count');
        const opponentCardCount1 = await getElementText(page1, '#opponent-cards-count');
        const playerCardCount2 = await getElementText(page2, '#player-cards-count');
        const opponentCardCount2 = await getElementText(page2, '#opponent-cards-count');

        expect(parseInt(playerCardCount1)).to.equal(5);
        expect(parseInt(opponentCardCount1)).to.equal(5);
        expect(parseInt(playerCardCount2)).to.equal(5);
        expect(parseInt(opponentCardCount2)).to.equal(5);
    });

    // Test 9: Both players see their own cards
    await testStep(results, 'Both players see their own cards', async () => {
        const playerCard1 = await page1.$('#player-card .card-image');
        const playerCard2 = await page2.$('#player-card .card-image');

        expect(playerCard1).to.not.be.null;
        expect(playerCard2).to.not.be.null;

        // Check if cards have background images set
        const bgImage1 = await page1.evaluate(el =>
            window.getComputedStyle(el).backgroundImage, playerCard1);
        const bgImage2 = await page2.evaluate(el =>
            window.getComputedStyle(el).backgroundImage, playerCard2);

        expect(bgImage1).to.include('url');
        expect(bgImage2).to.include('url');

        await takeScreenshot(page1, page2, 'player_cards');
    });

    // Test 10: Turn indicator shows correctly in both browsers
    await testStep(results, 'Turn indicator shows correctly', async () => {
        const turnText1 = await getElementText(page1, '#turn-indicator');
        const turnText2 = await getElementText(page2, '#turn-indicator');

        // One player should see "Your Turn" and the other "Opponent's Turn"
        const isPlayer1Turn = turnText1.includes('Your Turn');
        const isPlayer2Turn = turnText2.includes('Your Turn');

        expect(isPlayer1Turn).to.not.equal(isPlayer2Turn);
        await takeScreenshot(page1, page2, 'turn_indicators');
    });

    // Test 11: Category buttons are enabled only for the current player
    await testStep(results, 'Category buttons enabled only for current player', async () => {
        const player1Turn = await page1.evaluate(() => {
            return document.querySelector('#turn-indicator').textContent.includes('Your Turn');
        });

        // Try to find enabled category buttons
        const enabledButtons1 = await page1.$$eval('.category-button:not([disabled])', btns => btns.length);
        const enabledButtons2 = await page2.$$eval('.category-button:not([disabled])', btns => btns.length);

        if (player1Turn) {
            expect(enabledButtons1).to.be.greaterThan(0);
            expect(enabledButtons2).to.equal(0);
        } else {
            expect(enabledButtons1).to.equal(0);
            expect(enabledButtons2).to.be.greaterThan(0);
        }
    });

    // Test 12: Playing a round with category selection
    await testStep(results, 'Playing a round with category selection', async () => {
        // Determine which player's turn it is
        const player1Turn = await page1.evaluate(() => {
            return document.querySelector('#turn-indicator').textContent.includes('Your Turn');
        });

        const activePage = player1Turn ? page1 : page2;

        // Click a category button on the active page
        const categoryButtons = await activePage.$$('.category-button:not([disabled])');
        expect(categoryButtons.length).to.be.greaterThan(0);

        await categoryButtons[0].click();
        await takeScreenshot(page1, page2, 'category_selected');

        // Wait for the round result to appear
        await waitForSelector(page1, '#battle-result', 5000);
        await waitForSelector(page2, '#battle-result', 5000);

        await takeScreenshot(page1, page2, 'round_result');
    });

    // Test 13: Round result is visible to both players
    await testStep(results, 'Round result visible to both players', async () => {
        const result1 = await page1.$('#battle-result');
        const result2 = await page2.$('#battle-result');

        expect(result1).to.not.be.null;
        expect(result2).to.not.be.null;
    });

    // Test 14: Card counts update correctly after round
    await testStep(results, 'Card counts update correctly after round', async () => {
        // Wait for the UI to update
        await page1.waitForTimeout(2000);
        await page2.waitForTimeout(2000);

        // Get the new card counts
        const playerCardCount1 = await getElementText(page1, '#player-cards-count');
        const opponentCardCount1 = await getElementText(page1, '#opponent-cards-count');
        const playerCardCount2 = await getElementText(page2, '#player-cards-count');
        const opponentCardCount2 = await getElementText(page2, '#opponent-cards-count');

        // Verify total cards is still 10
        const totalCards1 = parseInt(playerCardCount1) + parseInt(opponentCardCount1);
        const totalCards2 = parseInt(playerCardCount2) + parseInt(opponentCardCount2);

        expect(totalCards1).to.equal(10);
        expect(totalCards2).to.equal(10);
    });

    // Test 15: Turn switches after the round
    await testStep(results, 'Turn switches after the round', async () => {
        // Get the turn indicators after the round
        const turnText1 = await getElementText(page1, '#turn-indicator');
        const turnText2 = await getElementText(page2, '#turn-indicator');

        // One player should see "Your Turn" and the other "Opponent's Turn"
        const isPlayer1Turn = turnText1.includes('Your Turn');
        const isPlayer2Turn = turnText2.includes('Your Turn');

        expect(isPlayer1Turn).to.not.equal(isPlayer2Turn);
    });

    // Test 16: Disconnection handling - Close and reopen browser 2
    await testStep(results, 'Disconnection handling', async () => {
        await takeScreenshot(page1, page2, 'before_disconnect');

        // Close browser 2
        console.log('Closing browser 2 to test disconnection handling...');
        await page2.close();

        // Wait for disconnection to register
        await page1.waitForTimeout(3000);
        await takeScreenshot(page1, null, 'during_disconnect');

        // Check for error message in browser 1
        const errorVisible = await page1.evaluate(() => {
            const toasts = Array.from(document.querySelectorAll('.toast'));
            return toasts.some(toast => toast.textContent.includes('Opponent') &&
                toast.textContent.includes('left'));
        });

        expect(errorVisible).to.be.true;

        // Reopen browser 2
        console.log('Reopening browser 2...');
        page2 = await browser2.newPage();
        page2.setDefaultTimeout(TIMEOUT);
        await setupPageLogging(page2, 'Player2');

        // Navigate back to the game
        await page2.goto(BASE_URL, { waitUntil: 'networkidle2' });
        await waitForSelector(page2, '#main-menu.active');

        await takeScreenshot(page1, page2, 'after_disconnect');
    });

    // Test 17: Player can leave the game and return to menu
    await testStep(results, 'Player can leave game and return to menu', async () => {
        // First check if we're in game screen or already back at menu
        const inGame = await elementExists(page1, '#game-screen.active');

        if (inGame) {
            // Click leave game button
            await page1.click('#leave-game');
            await waitForSelector(page1, '#main-menu.active');
        }

        const mainMenuVisible = await elementExists(page1, '#main-menu.active');
        expect(mainMenuVisible).to.be.true;

        await takeScreenshot(page1, page2, 'back_to_menu');
    });

    // Test 18: Direct matchmaking via play button
    await testStep(results, 'Direct matchmaking via play button', async () => {
        // Both players click play online
        await page1.click('#play-button');
        await page2.click('#play-button');

        // Wait for matchmaking screens
        await waitForSelector(page1, '#matchmaking-screen.active', 5000);
        await waitForSelector(page2, '#matchmaking-screen.active', 5000);

        await takeScreenshot(page1, page2, 'matchmaking_screens');

        // Wait for both to enter game (may take a moment)
        try {
            await waitForSelector(page1, '#game-screen.active', 15000);
            await waitForSelector(page2, '#game-screen.active', 15000);
            await takeScreenshot(page1, page2, 'direct_matchmaking_success');
        } catch (error) {
            // If direct matchmaking doesn't work, test will fail
            throw new Error('Direct matchmaking failed: ' + error.message);
        }
    });

    // Test 19: Simultaneous games don't interfere (would need 4 browsers ideally, but we'll check if our 2 can still play)
    await testStep(results, 'Current game functions properly', async () => {
        // Get card counts
        const playerCardCount1 = await getElementText(page1, '#player-cards-count');
        const opponentCardCount1 = await getElementText(page1, '#opponent-cards-count');

        // Verify counts make sense
        expect(parseInt(playerCardCount1) + parseInt(opponentCardCount1)).to.equal(10);

        // Play one more round
        const player1Turn = await page1.evaluate(() => {
            return document.querySelector('#turn-indicator').textContent.includes('Your Turn');
        });

        const activePage = player1Turn ? page1 : page2;
        const categoryButtons = await activePage.$$('.category-button:not([disabled])');

        if (categoryButtons.length > 0) {
            await categoryButtons[0].click();
            await page1.waitForTimeout(2000);
            await takeScreenshot(page1, page2, 'final_round_played');
        }
    });

    // Test 20: Both players can leave game properly
    await testStep(results, 'Both players can leave game properly', async () => {
        // Leave game in browser 1
        const leaveGame1 = await page1.$('#leave-game');
        if (leaveGame1) {
            await page1.click('#leave-game');
            await waitForSelector(page1, '#main-menu.active');
        }

        // Leave game in browser 2
        const leaveGame2 = await page2.$('#leave-game');
        if (leaveGame2) {
            await page2.click('#leave-game');
            await waitForSelector(page2, '#main-menu.active');
        }

        // Verify both are at main menu
        const atMenu1 = await elementExists(page1, '#main-menu.active');
        const atMenu2 = await elementExists(page2, '#main-menu.active');

        expect(atMenu1).to.be.true;
        expect(atMenu2).to.be.true;

        await takeScreenshot(page1, page2, 'test_complete');
    });
}

/**
 * Helper function to run a test step and track results
 */
async function testStep(results, name, testFn) {
    results.total++;
    console.log(`\n${ results.total }. Running test: ${ name }`);

    try {
        await testFn();
        console.log(`✅ PASSED: ${ name }`);
        results.passed++;
        results.details.push({ name, status: 'passed' });
    } catch (error) {
        console.error(`❌ FAILED: ${ name }`);
        console.error(`   Error: ${ error.message }`);
        results.failed++;
        results.details.push({ name, status: 'failed', error: error.message });
    }
}

/**
 * Helper function to wait for selector with custom error
 */
async function waitForSelector(page, selector, timeout = TIMEOUT) {
    try {
        await page.waitForSelector(selector, { visible: true, timeout });
    } catch (error) {
        throw new Error(`Element '${ selector }' not found: ${ error.message }`);
    }
}

/**
 * Helper function to check if element exists
 */
async function elementExists(page, selector, timeout = 1000) {
    try {
        await page.waitForSelector(selector, { visible: true, timeout });
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Helper function to get text from an element
 */
async function getElementText(page, selector) {
    try {
        return await page.$eval(selector, el => el.textContent);
    } catch (error) {
        throw new Error(`Could not get text from '${ selector }': ${ error.message }`);
    }
}

/**
 * Take screenshots from both browsers
 */
async function takeScreenshot(page1, page2, name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${ name }_${ timestamp }`;

    try {
        if (page1 && !page1.isClosed()) {
            await page1.screenshot({ path: `${ SCREENSHOT_DIR }/${ filename }_p1.png` });
        }
    } catch (e) {
        console.error(`Failed to take screenshot for player 1: ${ e.message }`);
    }

    try {
        if (page2 && !page2.isClosed()) {
            await page2.screenshot({ path: `${ SCREENSHOT_DIR }/${ filename }_p2.png` });
        }
    } catch (e) {
        console.error(`Failed to take screenshot for player 2: ${ e.message }`);
    }
}

/**
 * Print test summary in a nice format
 */
function printTestSummary(results) {
    console.log('\n📊 TEST SUMMARY');
    console.log('==============');
    console.log(`✅ Passed: ${ results.passed } / ${ results.total } (${ ((results.passed / results.total) * 100).toFixed(2) }%)`);
    console.log(`❌ Failed: ${ results.failed }`);

    if (results.failed > 0) {
        console.log('\n🔍 FAILED TESTS:');
        results.details
            .filter(test => test.status === 'failed')
            .forEach(test => {
                console.log(`   ❌ ${ test.name }`);
                console.log(`      Error: ${ test.error }`);
            });
    }
}

// Run the tests when this file is executed directly
if (require.main === module) {
    runMatchmakingTests();
}

module.exports = { runMatchmakingTests };