import config from "../config";
import { driver } from "../driverInstance";
import { LikeDataItem } from "../parsers/LikeParser/LikeDataItem";
import { logger } from "../utils/logger";
import { browserLog, clickElement, findElement, isElementExists, waitActionComplete, waitBrowserClosed, waitElementCountChanged } from "../utils/selenium";
import { deleteLikesCommon, ensurePageLoaded } from "./base";
import { reporter } from "./reporter";

export async function deleteLikePhotoComments(like: LikeDataItem) {
    await ensurePageLoaded()

    // unwrap all comments
    const loadCommentsButtonSelector = `//*[@id="pv_comments_header" and starts-with(text(), "Показать ")]`
    let button = await findElement(loadCommentsButtonSelector, {now: true})
    if (button !== null) {
        clickElement(button, {now: true})
        await waitElementCountChanged(`#pv_comments_list .reply`)
    }

    let likeElements = await deleteLikesCommon()
    await reporter.report(like.url, likeElements.length || "Лайки не найдены")
}

export async function deleteLikeVideoComments(like: LikeDataItem) {
    await ensurePageLoaded()

    // unwrap all comments
    const loadCommentsButtonSelector = `//*[@id="mv_comments_header" and starts-with(text(), "Показать ")]`
    let button = await findElement(loadCommentsButtonSelector, {now: true})
    while( ! await isElementExists(`#mv_comments_header.mv_comments_expanded`, {now: true})) {
        await clickElement(button, {now: true})
        // await waitActionComplete()
    }

    let likeElements = await deleteLikesCommon()
    // await waitBrowserClosed()
    await reporter.report(like.url, likeElements.length || "Лайки не найдены")
}