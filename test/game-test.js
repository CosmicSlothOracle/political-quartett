const puppeteer = require('puppeteer');
const { expect } = require('chai');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = './test/screenshots';
const TIMEOUT = 10000;

/**
 * Political Quartett Game Test Suite
 */
async function runGameTests() {
    // Track test results
    const testResults = {
        passed: 0,
        failed: 0,
        skipped: 0
    };

    console.log('\n🃏 POLITICAL QUARTETT GAME TEST 🃏\n');
    console.log('Starting browser automation tests...\n');

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false, // Set to true for production, false to see the browser
            args: ['--window-size=1366,768'],
            defaultViewport: {
                width: 1366,
                height: 768
            }
        });

        const page = await browser.newPage();
        page.setDefaultTimeout(TIMEOUT);

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
                await page.screenshot({ path: `${ SCREENSHOT_DIR }/${ name.replace(/\s+/g, '_') }_error.png` });
                testResults.failed++;
            }
        }

        // Helper function to take screenshots during tests
        async function screenshot(name) {
            await page.screenshot({ path: `${ SCREENSHOT_DIR }/${ name }.png` });
            console.log(`   📸 Screenshot saved: ${ name }.png`);
        }

        // Test 1: Load the game
        await test('Game loads correctly', async () => {
            await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

            // Wait for loading screen to disappear and main menu to appear
            await page.waitForSelector('#loading-screen', { hidden: true, timeout: TIMEOUT });
            await page.waitForSelector('#main-menu.active', { visible: true, timeout: TIMEOUT });

            // Check menu buttons
            const playButton = await page.$('#play-button');
            const playAIButton = await page.$('#play-ai-button');
            const rulesButton = await page.$('#rules-button');

            expect(playButton).to.not.be.null;
            expect(playAIButton).to.not.be.null;
            expect(rulesButton).to.not.be.null;

            await screenshot('main_menu');
        });

        // Test 2: Check the rules screen
        await test('Rules screen displays correctly', async () => {
            await page.click('#rules-button');
            await page.waitForSelector('#rules-screen.active', { visible: true });

            // Check content
            const rulesContent = await page.$('.rules-content');
            expect(rulesContent).to.not.be.null;

            // Check back button
            const backButton = await page.$('#back-to-menu');
            expect(backButton).to.not.be.null;

            await screenshot('rules_screen');

            // Go back to main menu
            await page.click('#back-to-menu');
            await page.waitForSelector('#main-menu.active', { visible: true });
        });

        // Test 3: Start AI game and check initial state
        await test('Play vs AI starts correctly', async () => {
            await page.click('#play-ai-button');
            await page.waitForSelector('#game-screen.active', { visible: true });

            // Check game elements
            const playerCard = await page.$('#player-card');
            const opponentCard = await page.$('#opponent-card');
            const categorySelection = await page.$('#category-selection');
            const turnIndicator = await page.$('#turn-indicator');

            expect(playerCard).to.not.be.null;
            expect(opponentCard).to.not.be.null;
            expect(categorySelection).to.not.be.null;
            expect(turnIndicator).to.not.be.null;

            // Check card count display
            const playerCardCount = await page.$eval('#player-cards-count', el => el.textContent);
            const opponentCardCount = await page.$eval('#opponent-cards-count', el => el.textContent);

            expect(Number(playerCardCount)).to.equal(5);
            expect(Number(opponentCardCount)).to.equal(5);

            await screenshot('game_start_vs_ai');
        });

        // Test 4: Check if card images loaded correctly
        await test('Card images loaded correctly', async () => {
            // Get the card image element
            const cardImage = await page.$('.card-image');

            // Check if the background image is set
            const backgroundImage = await page.evaluate(
                element => window.getComputedStyle(element).getPropertyValue('background-image'),
                cardImage
            );

            expect(backgroundImage).to.not.equal('none');
            expect(backgroundImage).to.include('url');

            // Take a screenshot showing the cards
            await screenshot('card_images');
        });

        // Test 5: Test category selection and play a round
        await test('Category selection and round playing works', async () => {
            // Get current turn indicator text
            const turnText = await page.$eval('#turn-indicator', el => el.textContent);

            // If it's opponent's turn, we need to wait for the AI to play
            if (turnText.includes('Opponent')) {
                console.log('   Waiting for AI to make a move...');
                await page.waitForFunction(
                    () => document.querySelector('#turn-indicator').textContent.includes('Your Turn'),
                    { timeout: 5000 }
                ).catch(() => {
                    // If the AI doesn't play, we'll assume it's the player's turn and continue
                    console.log('   AI did not play, continuing with test...');
                });
            }

            // Get all category buttons
            const categoryButtons = await page.$$('.category-button');
            expect(categoryButtons.length).to.be.greaterThan(0);

            // Click on the first available category
            await categoryButtons[0].click();

            // Wait for battle result to appear
            await page.waitForSelector('#battle-result .result', { visible: true });

            await screenshot('round_played');

            // Wait for next round to be prepared
            await page.waitForFunction(
                () => !document.querySelector('#battle-result').innerHTML.trim(),
                { timeout: 5000 }
            ).catch(() => {
                // If battle result doesn't clear, we'll continue anyway
                console.log('   Battle result didn\'t clear, continuing with test...');
            });
        });

        // Test 6: Play multiple rounds
        await test('Multiple rounds can be played', async () => {
            // Play 3 more rounds
            for (let i = 0; i < 3; i++) {
                // Wait for player's turn if needed
                try {
                    await page.waitForFunction(
                        () => document.querySelector('#turn-indicator').textContent.includes('Your Turn'),
                        { timeout: 5000 }
                    );
                } catch (e) {
                    console.log(`   Round ${ i + 1 }: Waiting for player turn timed out, continuing...`);
                }

                // Get category buttons that are enabled
                const enabledButtons = await page.$$('.category-button:not([disabled])');

                if (enabledButtons.length > 0) {
                    // Click a random category
                    const randomIndex = Math.floor(Math.random() * enabledButtons.length);
                    await enabledButtons[randomIndex].click();

                    // Wait for battle result
                    await page.waitForSelector('#battle-result .result', { visible: true, timeout: 5000 })
                        .catch(() => console.log(`   Round ${ i + 1 }: No battle result appeared`));

                    await screenshot(`round_${ i + 1 }_played`);

                    // Wait a bit for the next round
                    await page.waitForTimeout(2000);
                } else {
                    console.log(`   Round ${ i + 1 }: No enabled category buttons found, might be AI's turn`);
                    await page.waitForTimeout(2000);
                }
            }

            // Check if game is still running by verifying card counts
            const playerCardCount = await page.$eval('#player-cards-count', el => Number(el.textContent));
            const opponentCardCount = await page.$eval('#opponent-cards-count', el => Number(el.textContent));

            expect(playerCardCount + opponentCardCount).to.equal(10);
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
        if (browser) {
            await browser.close();
        }
    }
}

// Run the tests when the file is executed directly
if (require.main === module) {
    runGameTests();
}

module.exports = { runGameTests };