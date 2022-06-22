import config from "../../config";
import { driver } from "../../driverInstance";
import { LikeDataItem } from "../../parsers/LikeParser/LikeDataItem";
import { clickElement, findElements, isElementExists, waitActionComplete } from "../../utils/selenium";
import { waitCaptchaSolved } from "../vkHelpers";
import { reporter } from "./reporter";

// removes like of types: photo, video, wall
export async function deleteLikeBase(like: LikeDataItem) {
    // to be sure photo/video/other is visible
    // reload page if not
    // await waitForElement(`#pv_photo`)
    await ensurePageLoaded();

    /*
        photo like and comments
            `//*[class("like_btn") and @title="Нравится"]//self::*[class("active")]`
        post like
            `//*[class("PostButtonReactions--active")]`
        combined ^
    */
    let likeButtons = await deleteLikesCommon();

    // report how much removed likes
    // report if no likes removed
    await reporter.report(like.url, likeButtons.length || "Лайки не найдены");
}

export async function deleteLikesCommon() {
    let selector = `(//*[class("like_btn") and @title="Нравится"]//self::*[class("active")] | //*[class("PostButtonReactions--active")]/parent::*)`;
    let likeButtons = await findElements(selector, { now: true });

    for (const button of likeButtons) {
        await clickElement(button);
        await waitActionComplete();
        await waitCaptchaSolved();
    }
    return likeButtons;
}

export async function ensurePageLoaded() {
    while (!await isElementExists(`//*[@id="pv_photo" or class("VideoLayerInfo") or class("post")]`)) {
        await driver.navigate().refresh();
    }
}

