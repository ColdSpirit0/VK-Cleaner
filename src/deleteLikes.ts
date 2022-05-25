import config from "./config";
import { driver } from "./driverInstance";
import { LikeDataItem } from "./parsers/LikeParser/LikeDataItem";
import { LikesParser } from "./parsers/LikeParser/LikesParser";
import { LikeType } from "./parsers/LikeParser/LikeType";
import { Progress } from "./progress";
import { Reporter } from "./Reporter";
import { Task } from "./Task";
import { logger } from "./utils/logger";
import { clickElement, findElementsNow, isElementVisible, waitForElement, waitForElements } from "./utils/selenium";

const reporter = new Reporter(Task.DeleteLikes)
const manualRemoveReporter = new Reporter(config.manualRemoveReportFilename)

export async function deleteLikes(progress: Progress) {
    if (progress.task !== Task.DeleteLikes) {
        progress.task = Task.DeleteLikes

        // get data from parser
        let likesParser = new LikesParser();
        likesParser.init(config.archivePath);
        let likesData = await likesParser.parse();

        // TODO: likes from wall should be first in reverse order (old to new)

        progress.data = likesData
    }

    for (; progress.index < progress.data.length; progress.index++) {
        const like = progress.data[progress.index];
        //if (progress.index == 3) throw "LOL"
        await deleteLike(like);
    }
}

async function deleteLike(like: LikeDataItem) {
    // skip not supported types
    if (![LikeType.photo, LikeType.video, LikeType.wall].includes(like.type)) {
        await reporter.report(like.url, "Требуется удаление вручную")
        await manualRemoveReporter.report(like.url, "Требуется удаление вручную")
        return
    }

    // open url 
    await driver.get(like.url);

    // TODO: check captcha there (if vk blocked you)

    // wtf fix
    if (!await isElementVisible("body")) {
        await driver.navigate().refresh()
    }

    // check it was blocked by rkn
    let url = await driver.getCurrentUrl()
    if (url.startsWith("https://vk.com/blank.php?rkn=")) {
        await reporter.report(like.url, "Заблокирован")
        return
    }

    // wait for base element
    await waitForElement(`#content`)

    // if (!await isElementVisible(`#content`)
    //     && await isElementVisible(`//*[contains(text(), "Этот материал заблокирован на территории РФ")]`)) {
    // }

    // report if access error
    if (await isElementVisible(`//*[class("message_page_title") and normalize-space(text())="Ошибка"]`, true)) {
        await reporter.report(like.url, "Ошибка")
        return 
    }

    // to be sure photo/video/other is visible
    // reload page if not
    // await waitForElement(`#pv_photo`)
    while (!await isElementVisible(`//*[@id="pv_photo" or class("VideoLayerInfo") or class("post")]`)) {
        await driver.navigate().refresh()
    }
    
    /*
        photo like and comments
            `//*[class("like_btn") and @title="Нравится"]//self::*[class("active")]`
        post like
            `//*[class("PostButtonReactions--active")]`
        combined ^
    */
    let selector = `(//*[class("like_btn") and @title="Нравится"]//self::*[class("active")] | //*[class("PostButtonReactions--active")]/parent::*)`
    let likeButtons = await findElementsNow(selector)


    for (const button of likeButtons) {
        await clickElement(button)
        await driver.sleep(config.actionCompleteTimeout)
        await waitCaptchaSolved()
    }

    // report how much removed likes
    // report if no likes removed
    await reporter.report(like.url, likeButtons.length || "Лайки не найдены")
}


// check captcha for all window (even if it appears again)
// captcha is solved when its was showed and missed after for 1 second
async function waitCaptchaSolved() {
    let captchaSolved = false
    let wasCaptcha = false

    while(!captchaSolved) {
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
async function waitCaptchaWindow() {
    let captchaExists = true
    let captchaExisted = false

    while (captchaExists) {
        let captchas = await findElementsNow(`.captcha`)

        if (captchas.length > 0) {
            captchaExisted = true
            await driver.sleep(500)
        }
        else {
            captchaExists = false
        }
    }

    return captchaExisted
}