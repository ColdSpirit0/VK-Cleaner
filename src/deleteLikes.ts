import config from "./config";
import { driver } from "./driverInstance";
import { LikeDataItem } from "./parsers/LikeParser/LikeDataItem";
import { LikesParser } from "./parsers/LikeParser/LikesParser";
import { LikeType } from "./parsers/LikeParser/LikeType";
import { Progress } from "./progress";
import { Reporter } from "./Reporter";
import { Task } from "./Task";
import { findElementsNow, isElementVisible, waitForElement, waitForElements } from "./utils/selenium";

const reporter = new Reporter(Task.DeleteLikes)
const manualRemoveReporter = new Reporter(config.manualRemoveReportFilename)

export async function deleteLikes(progress: Progress) {
    if (progress.task !== Task.DeleteLikes) {
        progress.task = Task.DeleteLikes

        // get data from parser
        let likesParser = new LikesParser();
        likesParser.init(config.archivePath);
        let likesData = await likesParser.parse();

        progress.data = likesData
    }

    for (const like of progress.data as LikeDataItem[]) {
        //if (progress.index == 3) throw "LOL"
        await deleteLike(like);
        progress.index++
    }
}

async function deleteLike(like: LikeDataItem) {
    // skip not supported types
    if (![LikeType.photo, LikeType.video, LikeType.wall].includes(like.type)) {
        await reporter.report(like.url, "Требуется удаление вручную")
        await manualRemoveReporter.report(like.url, "Требуется удаление вручную")
        return
    }

    // open url and wait for base element
    await driver.get(like.url);
    await waitForElement(`#content`)

    // report if access error
    if (await isElementVisible(`//*[class("message_page_title") and normalize-space(text())="Ошибка"]`, true)) {
        await reporter.report(like.url, "Ошибка")
        return 
    }

    // to be sure photo is visible (throws error if not)
    await waitForElement(`#pv_photo`)
    
    /*
        photo like and comments
            `//*[class("like_btn") and @title="Нравится"]//self::*[class("active")]`
        post like
            `//*[class("PostButtonReactions--active")]`
        combined ^
    */
    let selector = `(//*[class("like_btn") and @title="Нравится"]//self::*[class("active")] | //*[class("PostButtonReactions--active")])`
    let likeButtons = await findElementsNow(selector)


    for (const button of likeButtons) {
        await button.click()
        await driver.sleep(config.actionCompleteTimeout)
    }

    // report how much removed likes
    // report if no likes removed
    await reporter.report(like.url, likeButtons.length || "Лайки не найдены")
}