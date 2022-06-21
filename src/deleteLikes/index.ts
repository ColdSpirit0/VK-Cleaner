import config from "../config";
import { driver } from "../driverInstance";
import { LikeDataItem } from "../parsers/LikeParser/LikeDataItem";
import { LikesParser } from "../parsers/LikeParser/LikesParser";
import { LikeType } from "../parsers/LikeParser/LikeType";
import { Progress } from "../progress";
import { Task } from "../Task";
import { logger } from "../utils/logger";
import { isElementExists, waitForElement } from "../utils/selenium";
import { deleteLikeBase } from "./base";
import { deleteLikeWallReply } from "./wallReply";
import { waitCaptchaWindow } from "./captcha";
import { deleteLikePhotoComments, deleteLikeVideoComments } from "./comments";
import { reporter, manualRemoveReporter } from "./reporter";

let likesOrder = [
    // {type: LikeType.wall, reverse: true},
    // {type: LikeType.wall_reply, reverse: false},
    // {type: LikeType.photo, reverse: false},
    // {type: LikeType.photo_comment, reverse: false},
    // {type: LikeType.video, reverse: false},
    {type: LikeType.video_comment, reverse: false},
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
                
                case LikeType.photo_comment:
                    await deleteLikePhotoComments(like)
                    break
                
                case LikeType.video_comment:
                    await deleteLikeVideoComments(like)
                    break

                default:
                    await deleteLikeManual(like)
                    break
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


