import config from "./config";
import { driver } from "./driverInstance";
import { LikeDataItem } from "./parsers/LikeParser/LikeDataItem";
import { LikesParser } from "./parsers/LikeParser/LikesParser";
import { LikeType } from "./parsers/LikeParser/LikeType";
import { Progress } from "./progress";
import { Reporter } from "./Reporter";
import { Task } from "./Task";
import { logger } from "./utils/logger";
import { browserDebugger, browserLog, clickElement, findElement, findElements, hoverElement, isElementExists, scrollToBottom, scrollToElement, waitElementCountChanged, waitForElement, waitForElementDeleted, waitForElementHidden } from "./utils/selenium";

const reporter = new Reporter(Task.DeleteLikes)
const manualRemoveReporter = new Reporter(config.manualRemoveReportFilename)

let likesOrder = [
    // {type: LikeType.wall, reverse: true},
    {type: LikeType.wall_reply, reverse: false},
    // {type: LikeType.photo, reverse: false},
    // {type: LikeType.photo_comment, reverse: false},
    // {type: LikeType.video, reverse: false},
    // {type: LikeType.video_comment, reverse: false},
]

export async function deleteLikes(progress: Progress) {
    if (progress.task !== Task.DeleteLikes) {
        progress.task = Task.DeleteLikes

        // get data from parser
        let likesParser = new LikesParser();
        likesParser.init(config.archivePath);
        let likesDataRaw = await likesParser.parse();

        let likesData = []
        for (const orderItem of likesOrder) {
            let likesTyped = likesDataRaw.filter(a => a.type === orderItem.type)
            
            if (orderItem.reverse) {
                likesTyped.reverse()
            }

            likesData = likesData.concat(likesTyped)
        }

        progress.data = likesData
    }

    for (; progress.index < progress.data.length; progress.index++) {
        const like: LikeDataItem = progress.data[progress.index];

        let pageOk = await openPage(like)

        if (pageOk) {
            switch (like.type) {
                case LikeType.wall:
                case LikeType.video:
                case LikeType.photo:
                    await deleteLikeBase(like)
                    break
            
                case LikeType.wall_reply:
                    await deleteLikeWallReply(like)
                    break

                default:
                    await deleteLikeManual(like)
                    break;
            }
        }
    }
}

// just save to log
async function deleteLikeManual(like: LikeDataItem) {
    await reporter.report(like.url, "Требуется удаление вручную")
    await manualRemoveReporter.report(like.url, "Требуется удаление вручную")
}

async function openPage(like: LikeDataItem) {
    // open url 
    logger.log("Opening", like.url)
    await driver.get(like.url);
    
    // TODO: check captcha there (if vk blocked you)

    // wtf fix
    if (!await isElementExists("body")) {
        await driver.navigate().refresh()
    }

    // check it was blocked by rkn
    let url = await driver.getCurrentUrl()
    if (url.startsWith("https://vk.com/blank.php?rkn=")) {
        await reporter.report(like.url, "Заблокирован")
        return false
    }

    // wait for base element
    // may to throw error, its ok
    await waitForElement(`#content`)

    // report if access error
    if (await isElementExists(`//*[class("message_page_title") and normalize-space(text())="Ошибка"]`, {now: true})) {
        await reporter.report(like.url, "Ошибка")
        return false
    }

    return true
}

// removes like of types: photo, video, wall
async function deleteLikeBase(like: LikeDataItem) {
    // to be sure photo/video/other is visible
    // reload page if not
    // await waitForElement(`#pv_photo`)
    while (!await isElementExists(`//*[@id="pv_photo" or class("VideoLayerInfo") or class("post")]`)) {
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
    let likeButtons = await findElements(selector, {now: true})

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
async function waitCaptchaWindow() {
    let captchaExists = true
    let captchaExisted = false

    while (captchaExists) {
        let captchas = await findElements(`.captcha`, {now: true})

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

async function deleteLikeWallReply(like: LikeDataItem) {
    // wait for VK scroll
    await driver.sleep(1000)

    // reorder comments ascending
    // let reoderElement = await clickElement(`.post_replies_header .post_replies_reorder`, {now: true})
    // if (reoderElement !== null) {
    //     await clickElement(`.post_replies_header .eltt .radiobtn[data-order="asc"]`, {safe: false})
    //     await waitForElementHidden(`.post_replies_header .eltt`, {safe: false})
    //     await driver.sleep(config.actionCompleteTimeout)
    // }

    // let commentsLoaded = await loadAllCommentsAuto()
    // if (!commentsLoaded) {
    //     await loadAllCommentsManually()
    // }

    // show answers
    // for (const reply of await findElements(`.replies_list .replies_short_deep`, {now: true})) {
    //     await clickElement(reply)
    //     await driver.sleep(config.actionCompleteTimeout)
    // }

    // get all like buttons and click
    let selector = `(//*[class("like_btn") and @title="Нравится"]//self::*[class("active")] | //*[class("PostButtonReactions--active")]/parent::*)`
    let likeButtons = await findElements(selector, {now: true})

    for (const button of likeButtons) {
        await clickElement(button)
        await driver.sleep(config.actionCompleteTimeout)
        await waitCaptchaSolved()
    }
}

async function loadAllCommentsManually() {
    const buttonSelector = `.replies_list .replies_next_main:not(.replies_next_pre_deleted)`
    const loaderSelector = `.replies_list .replies_next_loader`
    const replySelector = `.replies_list > .reply`

    // if button shows, scroll to it
    do {
        let button = await clickElement(buttonSelector, {waitTime: 1000})
        if (button === null) break

        // wait while loader shows
        let loader = await findElement(loaderSelector, {waitTime: 1000})

        await waitForElementDeleted(loader)
    } while (true);

    await scrollToBottom()
}

async function loadAllCommentsAuto() {
    const buttonSelector = `.replies_list .replies_next_main:not(.replies_next_pre_deleted)`
    const loaderSelector = `.replies_list .replies_next_loader`
    const replySelector = `.replies_list > .reply`

    // if button shows, scroll to it
    do {
        let button = await findElement(buttonSelector, {waitTime: 1000})
        if (button === null) break

        // wait while loader shows
        let isLoaderFirst = true
        do {
            await scrollToBottom()

            let loader = await findElement(loaderSelector, {waitTime: 1000})

            // first loader should be showed
            // second loader may be showed
            if (loader === null) {
                if (isLoaderFirst) {
                    return false
                }
                else {
                    break
                }
            }

            await waitForElementDeleted(loader)
            isLoaderFirst = false
        } while (true);
    } while (true);

    await scrollToBottom()

    return true
}

