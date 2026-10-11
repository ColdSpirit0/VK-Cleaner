import { driver } from "@/driver";
import { LikeDataItem } from "@/parsers/LikeParser/LikeDataItem";
import { clickElement, findElements, isElementExists, waitActionComplete } from "@/utils/selenium";
import { findActiveLikeButtons } from "../vkDom";
import { waitModalClosed } from "../vkHelpers";
import { reporter } from "./reporter";

const o = {
    locators: {
        // locators to check that page is loaded
        pageWall: `//*[class("post") or @data-post-id]`,
        pagePhoto: `//*[@id="pv_photo" or @id="pv_box" or @data-testid="photo-viewer"]`,
        pageVideo: `//*[@id="react_rootVideo_page" or @id="mv_player_box" or @data-testid="video_modal" or @data-testid="video_page"]`,
        pageClip: `//*[contains(@class, "Clips") or contains(@class, "Clip") or @data-testid="clip_page" or @data-testid="clip_viewer"] | //video`,

        // locators for like button
        likeWall: `//*[class("PostButtonReactions--active")]`,
        likePhoto: `//*[class("like_btn") and class("active")]`, // selector is same for: wall_reply, photo_comment, video_comment (old)
        likeVideo: `//*[@data-testid="video_modal_like_button"
                    and descendant-or-self::*[contains(concat(" ", @class), " vkitgetColorClass__colorAccentRed")]]`,
        likeVideo_old: `//*[contains(@class, 'vkuiIcon--like_circle_fill_red_28')]`, // Hard to reproduce: (LikeType.video in old video player, maybe)
        likeVideoComment: `//*[@data-testid="comment-liked"]`,
    }
}

export async function deleteLikeBase(like: LikeDataItem) {
    // to be sure photo/video/other is visible
    // reload page if not
    const loaded = await ensurePageLoaded();
    if (!loaded) {
        await reporter.report(like.url, "Страница не загрузилась")
        return
    }

    let likeButtons = await deleteLikesCommon();

    // report how much removed likes
    // report if no likes removed
    await reporter.report(like.url, likeButtons.length || "Лайки не найдены");
}

export async function deleteLikesCommon() {
    let likeButtons = await findActiveLikeButtons();

    if (likeButtons.length === 0) {
        const selector = [
        o.locators.likeWall,
        o.locators.likePhoto,
        o.locators.likeVideo,
        o.locators.likeVideo_old,
        o.locators.likeVideoComment,
        ].join(" | ")
        likeButtons = await findElements(selector);
    }

    if (likeButtons.length > 0) {
        await waitModalClosed()
    }

    for (const button of likeButtons) {
        await clickElement(button);
        await waitActionComplete();
        await waitModalClosed();
    }
    return likeButtons;
}

export async function ensurePageLoaded() {
    const locator = [
        o.locators.pageWall,
        o.locators.pagePhoto,
        o.locators.pageVideo,
        o.locators.pageClip,
    ].join(" | ")

    for (let attempt = 0; attempt < 5; attempt++) {
        if (await isElementExists(locator)) {
            return true
        }

        await driver.navigate().refresh();
    }

    return false
}

