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
    let selector = `//div[contains(@class, 'PostButtonReactions--active')] | //a[contains(@class, 'like_btn') and contains(@class, '_like') and contains(@class, 'active')] | //*[contains(@class, 'vkuiIcon--like_24') and contains(@class, 'vkitgetColorClass__colorAccentRed--JtojA')] | //*[contains(@class, 'vkuiIcon--like_circle_fill_red_28')]`;
    let likeButtons = await findElements(selector);

    if (likeButtons.length > 0) {
        await waitCaptchaSolved()
    }

    for (const button of likeButtons) {
        await clickElement(button);
        await waitActionComplete();
        await waitCaptchaSolved();
    }
    return likeButtons;
}

export async function ensurePageLoaded() {
    while (!await isElementExists(`//*[@id="pv_photo" or @id="react_rootVideo_page" or @id="mv_player_box" or class("post")]`)) {
        await driver.navigate().refresh();
    }
}

