import { driver } from "../driverInstance";
import { LikeDataItem } from "../parsers/LikeParser/LikeDataItem";
import { logger } from "../utils/logger";
import { findElements, isElementExists, waitForElement } from "../utils/selenium";
import { reporter } from "./deleteLikes/reporter";

export async function openPage(url: string) {
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
    if (await isElementExists(`//*[class("message_page_title") and normalize-space(text())="Ошибка"]`, { now: true })) {
        await reporter.report(url, "Ошибка");
        return false;
    }

    return true;
}

// check captcha for all window (even if it appears again)
// captcha is solved when its was showed and missed after for 1 second
export async function waitCaptchaSolved() {
    let captchaSolved = false
    let wasCaptcha = false

    while (!captchaSolved) {
        wasCaptcha = await waitCaptchaWindow()

        if (wasCaptcha) {
            // wait 1 second and check again
            await driver.sleep(1000)
            // next loop
        }
        else {
            captchaSolved = true
        }
    }

    if (wasCaptcha) {
        logger.log("captcha solved")
    }
}

// check captcha for one window
export async function waitCaptchaWindow() {
    let captchaExists = true;
    let captchaExisted = false;

    while (captchaExists) {
        let captchas = await findElements(`.captcha`, { now: true });

        if (captchas.length > 0) {
            captchaExisted = true;
            await driver.sleep(500);
        }
        else {
            captchaExists = false;
        }
    }

    return captchaExisted;
}

export async function getUserId(): Promise<number> {
    return await driver.executeAsyncScript(function (resolve) {
        // @ts-ignore
        resolve(vk.id)
    })
}