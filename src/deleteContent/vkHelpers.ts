import { Condition, until } from "selenium-webdriver";
import { driver } from "../driverInstance";
import { Reporter } from "../Reporter";
import { logger } from "../utils/Logger";
import { findElement, findElements, isElementExists, isElementOverlapped, waitForElement } from "../utils/selenium";

export async function openPage(url: string, reporter: Reporter) {
    // open url 
    logger.log("Opening", url);
    await driver.get(url);

    // TODO: check captcha there (if vk blocked you)
    // wtf fix
    if (!await isElementExists("body")) {
        await driver.navigate().refresh();
    }

    // check it was blocked by rkn
    let currentUrl = await driver.getCurrentUrl();
    if (currentUrl.startsWith("https://vk.com/blank.php?rkn=")) {
        await reporter.report(url, "Заблокирован");
        return false;
    }

    // wait for base element
    // may to throw error, its ok
    await waitForElement(`#content`);

    // report if access error
    let s = `
        //*[class("message_page_title") and normalize-space(text())="Ошибка"] |
        //*[contains(@class, 'HiddenPostBlank')] |
        //*[@data-testid="placeholder_description"]`
    if (await isElementExists(s)) {
        await reporter.report(url, "Ошибка");
        return false;
    }

    return true;
}

// check captcha for all window (even if it appears again)
// captcha is solved when its was showed and missed after for 1 second
export async function waitCaptchaSolved() {
    let wasCaptcha = false

    while (await isCaptchaPresent()) {
        wasCaptcha = true
        await driver.sleep(3000)

        logger.debug("modal found")
    }

    if (wasCaptcha) {
        logger.log("captcha solved")
    }
}

async function isCaptchaPresent() {
    const visibleElementsLocator = `//*[@id="pv_box"] | //*[class("TopNavBtn__profileImg")]`
    const targetElements = await findElements(visibleElementsLocator)
    const overlappedMap = await Promise.all(targetElements.map(isElementOverlapped))
    return overlappedMap.every(Boolean);
}

// check captcha for one window
// async function waitCaptchaWindow() {
//     let captchaExists = true;
//     let captchaExisted = false;


//     while (captchaExists) {
//         let captchas = await findElements(`//*[@data-testid="modalbox"]`, { now: true });

//         if (captchas.length > 0) {
//             captchaExisted = true;
//             await driver.sleep(500);
//         }
//         else {
//             captchaExists = false;
//         }
//     }

//     return captchaExisted;
// }

export async function getUserId(): Promise<number> {
    return await driver.executeAsyncScript(function(resolve) {
        // @ts-ignore
        resolve(vk.id)
    })
}
export async function getProfileUrl(): Promise<string> {
    // open vk page
    await driver.get("https://vk.com")

    // get my page url
    let element = await findElement(`#l_pr > a`, { safe: false })
    return await element.getAttribute("href")
}