import config from "../config";
import { driver } from "../driverInstance";
import { LikeDataItem } from "../parsers/LikeParser/LikeDataItem";
import { logger } from "../utils/logger";
import { browserLog, clickElement, findElement, isElementExists, scrollToBottom, waitActionComplete, waitBrowserClosed, waitElementCountChanged } from "../utils/selenium";
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

export async function deleteLikeTopicComments(like: LikeDataItem) {
    const lastPageReachedSelector = `//*[@id="pg_fixed"]//*[class("pg_fixed_pages")]/a[last()]/self::*[class("pg_flnk_sel")]`
    const paginatorSelector = `//*[@id="bt_pages" and descendant::a]`

    // check is page has pagitnator
    if (await isElementExists(paginatorSelector, {now: true})) {
        // scroll down until reached last page
        do {
            await scrollToBottom()
        } while (!await isElementExists(lastPageReachedSelector, {now: true}));
    }

    // remove likes
    let likeElements = await deleteLikesCommon()
    // await waitBrowserClosed()
    await reporter.report(like.url, likeElements.length || "Лайки не найдены")
}