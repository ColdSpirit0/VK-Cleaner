import { driver } from "@/driver";
import { logger } from "@/utils/Logger";
import { isElementExists, waitForElement } from "@/utils/selenium";

export async function loginVK() {
    await driver.get("https://vk.com");

    let isSignedIn = await isElementExists(".TopNavBtn__profileImg");
    if (!isSignedIn) {
        logger.log("Waiting for user logging in...");

        // wait for page loaded
        await waitForElement(".TopNavBtn__profileImg", {waitTime: Infinity});
        await driver.sleep(1000);
    }
}
