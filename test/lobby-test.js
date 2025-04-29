const puppeteer = require('puppeteer');

async function openTestBrowsers() {
    try {
        // Launch 2 browser instances to simulate 2 players
        console.log('Opening browser 1...');
        const browser1 = await puppeteer.launch({
            headless: false,
            args: ['--window-size=800,600', '--window-position=0,0']
        });

        console.log('Opening browser 2...');
        const browser2 = await puppeteer.launch({
            headless: false,
            args: ['--window-size=800,600', '--window-position=810,0']
        });

        // Create pages
        console.log('Creating page for browser 1...');
        const page1 = await browser1.newPage();

        console.log('Creating page for browser 2...');
        const page2 = await browser2.newPage();

        // Set up console logging for debugging
        page1.on('console', msg => console.log('BROWSER1:', msg.text()));
        page2.on('console', msg => console.log('BROWSER2:', msg.text()));

        // Set up error handling
        page1.on('pageerror', error => console.error('BROWSER1 ERROR:', error.message));
        page2.on('pageerror', error => console.error('BROWSER2 ERROR:', error.message));

        // Navigate to the game
        console.log('Loading game in browser 1...');
        await page1.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });

        console.log('Loading game in browser 2...');
        await page2.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });

        console.log('Test browsers opened. You can manually test the lobbies now.');
        console.log('The browsers will close automatically after 5 minutes or press Ctrl+C to close earlier.');

        // Keep the browsers open for 5 minutes for manual testing
        await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));

        console.log('Closing test browsers...');
        await browser1.close();
        await browser2.close();
    } catch (error) {
        console.error('Test failed with error:', error);
    }
}

openTestBrowsers().catch(error => {
    console.error('Fatal error in test:', error);
    process.exit(1);
});