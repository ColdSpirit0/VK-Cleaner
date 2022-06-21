import { driver } from "../driverInstance";
import { findElements } from "../utils/selenium";

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
