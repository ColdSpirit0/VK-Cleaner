import { driver } from "@/driver";
import { logger } from "@/utils/Logger";
import { isElementExists, waitForElement } from "@/utils/selenium";

const loggedInProfileSelector = [
    "#page_header .WjmGck",
    ".TopNavBtn__profileImg",
    "#top_profile_link",
].join(", ")

export async function loginVK() {
    await driver.get("https://vk.com");

    let isSignedIn = await isElementExists(loggedInProfileSelector);
    if (!isSignedIn) {
        logger.log("Waiting for user logging in...");

        // wait for page loaded
        await waitForElement(loggedInProfileSelector, {waitTime: Infinity});
        await driver.sleep(1000);
    }
}
