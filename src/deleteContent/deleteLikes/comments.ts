import { LikeDataItem } from "../../parsers/LikeParser/LikeDataItem";
import { clickElement, findElement, isElementExists, scrollToBottom, waitElementCountChanged } from "../../utils/selenium";
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

    let likeElements = await deleteLikesCommon()
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
    await reporter.report(like.url, likeElements.length || "Лайки не найдены")
}