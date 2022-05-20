import config from "./config";
import { driver } from "./driverInstance";
import { LikesParser } from "./parsers/LikeParser/LikesParser";
import { Progress } from "./progress";
import { Reporter } from "./Reporter";
import { Task } from "./Task";
import { isElementVisible, waitForElement, waitForElements } from "./utils/selenium";

const reporter = new Reporter(Task.DeleteLikes)

export async function deleteLikes(progress: Progress) {
    if (progress.task !== Task.DeleteLikes) {
        progress.task = Task.DeleteLikes

        // get data from parser
        let likesParser = new LikesParser();
        likesParser.init(config.archivePath);
        let likesData = await likesParser.parse();

        progress.data = likesData
    }

    for (const like of progress.data) {
        //if (progress.index == 3) throw "LOL"
        await deleteLike(like.url);
        progress.index++
    }
}

async function deleteLike(url: string) {
    await driver.get(url);

    await waitForElement(`#content`)

    // report if access error
    if (await isElementVisible(`//*[normalize-space(text())="Ошибка доступа"]`, true)) {
        await reporter.report(url, "Ошибка доступа")
        return 
    }

    
    /*
        photo like and comments
            `//*[class("like_btn") and @title="Нравится"]//self::*[class("active")]`
        post like
            `//*[class("PostButtonReactions--active")]`
        combined ^
    */
    let selector = `(//*[class("like_btn") and @title="Нравится"]//self::*[class("active")] | //*[class("PostButtonReactions--active")])`
    let likeButtons = await waitForElements(selector)


    for (const button of likeButtons) {
        await button.click()
        await driver.sleep(config.actionCompleteTimeout)
    }

    // report how much removed likes
    // report if no likes removed
    await reporter.report(url, likeButtons.length || "Лайки не найдены")
}