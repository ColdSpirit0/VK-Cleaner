import config from "./config";
import { driver } from "./driverInstance";
import { LikesParser } from "./parsers/LikeParser/LikesParser";
import { Progress } from "./progress";
import { Tasks } from "./Tasks";
import { waitForElements } from "./utils/selenium";

export async function deleteLikes(progress: Progress) {
    if (progress.task !== Tasks.DeleteLikes) {
        progress.task = Tasks.DeleteLikes

        // get data from parser
        let likesParser = new LikesParser();
        likesParser.init(config.archivePath);
        let likesData = await likesParser.parse();

        progress.data = likesData
    }

    for (const like of progress.data) {
        console.log(like.url);
        //if (progress.index == 3) throw "LOL"
        await deleteLike(like.url);
        progress.index++
    }
}

async function deleteLike(url: string) {
    await driver.get(url);
    
    // photo like and comments
    //`//*[class("like_btn") and @title="Нравится"]//self::*[class("active")]`
    // post like
    // `//*[class("PostButtonReactions--active")]`
    // combined
    let selector = `(//*[class("like_btn") and @title="Нравится"]//self::*[class("active")] | //*[class("PostButtonReactions--active")])`
    let likeButtons = await waitForElements(selector)
    for (const button of likeButtons) {
        await button.click()
        await driver.sleep(config.actionCompleteTimeout)
    }

    await driver.sleep(config.actionCompleteTimeout)
}