const puppeteer = require('puppeteer');
const username = require("./lib/username");

const initClient = async (
    url,
    browser,
    webcam = false,
    microphone = false,
    username = "Testing"
) => {
    //   const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    console.log(`wait selector username: ${process.env.BBB_INPUT_SELECTOR_USERNAME}`)
    await page.waitForSelector(process.env.BBB_INPUT_SELECTOR_USERNAME);
    await page.type(process.env.BBB_INPUT_SELECTOR_USERNAME, username);
    // await page.screenshot({ path: `${username}-0.png` });
    console.log(`click submit: ${process.env.BBB_INPUT_SELECTOR_SUBMIT}`)
    await page.click(process.env.BBB_INPUT_SELECTOR_SUBMIT);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // await page.screenshot({ path: `${username}-1.png` });
    const audioAction = microphone ? "Microphone" : "Listen only";
    console.log(`waiting for audio prompt ([aria-label="${audioAction}"])`)
    await page.waitForSelector(`[aria-label="${audioAction}"]`);
    console.log(`click on ${audioAction}`);
    await page.click(`[aria-label="${audioAction}"]`);
    if (microphone) {
        console.log("waiting for the echo test dialog");
        try {
            await page.waitForSelector(`[aria-label="Echo is audible"]`);
            console.log(
                'echo test dialog detected. clicking on "Echo is audible" button.'
            );
            await page.click(`[aria-label="Echo is audible"]`);
        } catch (err) {
            console.log(
                "unable to detect the echo test dialog. Maybe echo test is disabled."
            );
        }
    }
    await page.waitForSelector(".ReactModal__Overlay", { hidden: true });
    if (microphone) {
        console.log("Ensure that we are not muted...");
        // Wait for the toolbar to appear
        await page.waitForSelector('[aria-label="Mute"],[aria-label="Unmute"]');
        // If we are muted, click on Unmute
        const unmuteButton = await page.$('[aria-label="Unmute"]');
        if (unmuteButton !== null) {
            console.log("clicking on unmute button");
            await unmuteButton.click();
        }
    }
    if (webcam) {
        await page.waitForSelector('[aria-label="Share webcam"]');
        await page.click('[aria-label="Share webcam"]');
        console.log("clicked on sharing webcam");
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await page.waitForSelector("#setCam > option");
        await page.waitForSelector("#setQuality > option")
        await page.select('#setQuality', 'hd')
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await page.waitForSelector('[aria-label="Start sharing"]');
        console.log("clicking on start sharing");
        await page.click('[aria-label="Start sharing"]');
    }
    return Promise.resolve(page);
};

const generateClientConfig = (webcam = false, microphone = false) => {
    return {
        username: username.getRandom(),
        webcam,
        microphone,
    };
};

async function start(
    url,
    testDuration,
    clientWithCamera,
    clientWithMicrophone,
    clientListening
) {
    const [browser] = await Promise.all([
        puppeteer.launch({
            headless: true,
            // executablePath: "google-chrome-unstable",
            args: [
                "--no-sandbox",
                "--use-fake-device-for-media-stream",
                "--use-fake-ui-for-media-stream",
                "--mute-audio",
                // '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process', // <- this one doesn't works in Windows
                '--disable-gpu'
            ],
        }),
    ]);
    const clientsConfig = [
        ...[...Array(clientWithCamera)].map(() => generateClientConfig(true, true)),
        ...[...Array(clientWithMicrophone)].map(() =>
            generateClientConfig(false, true)
        ),
        ...[...Array(clientListening)].map(() =>
            generateClientConfig(false, false)
        ),
    ];
    for (let idx = 0; idx < clientsConfig.length; idx++) {
        console.log(`${clientsConfig[idx].username} join the conference`);
        await initClient(
            url,
            browser,
            clientsConfig[idx].webcam,
            clientsConfig[idx].microphone,
            clientsConfig[idx].username
        ).catch((err) => {
            console.log(
                `Unable to initialize client ${clientsConfig[idx].username} : ${err}`
            );
            Promise.resolve(null);
        });
    }

    console.log("All user joined the conference");
    console.log(`Sleeping ${testDuration}s`);
    await new Promise((resolve) => setTimeout(resolve, testDuration * 1000));
    console.log("Test finished");
    return browser.close();
}

module.exports = {
    start
}