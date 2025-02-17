import config from "./config";
import { driver } from "./driverInstance";
import { logger } from "./utils/Logger";
import { clickElement, isElementExists, waitForElement } from "./utils/selenium";

export async function loginVK() {
    await driver.get("https://vk.com");

    // XXX: test it again
    // check if signed in already, no login required
    let isSignedIn = await isElementExists(".TopNavBtn__profileImg");
    if (!isSignedIn) {
        logger.log("sign in with login/pass");

        // click "login"
        await clickElement(".VkIdForm__signInButton");

        // fill login input
        let loginInput = await clickElement(".vkc__EnterLogin__input input");
        await loginInput.sendKeys(config.login);

        // click next
        await clickElement(".vkc__EnterLogin__button");

        // click "with password"
        await clickElement(".vkc__Bottom__switchToPassword");

        // fill password input
        let passInput = await clickElement(".vkc__Password__Wrapper input");
        await passInput.sendKeys(config.pass);

        // click next
        await clickElement(".vkc__EnterPasswordNoUserInfo__buttonWrap");

        // wait for page loaded
        await waitForElement(".TopNavBtn__profileImg");
        await driver.sleep(1000);
    }
}
