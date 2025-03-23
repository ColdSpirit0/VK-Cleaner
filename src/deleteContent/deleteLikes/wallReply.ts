import { driver } from "@/driver";
import { LikeDataItem } from "@/parsers/LikeParser/LikeDataItem";
import {
    clickElement, findElement, findElements,
    scrollToBottom, waitActionComplete, waitForElementDeleted
} from "@/utils/selenium";
import { waitModalClosed } from "../vkHelpers";
import { reporter } from "./reporter";

export async function deleteLikeWallReply(like: LikeDataItem) {
    // wait for VK scroll
    await driver.sleep(1000);

    // get all like buttons and click
    let selector = `//*[class("like_btn") and class("active")]`;
    let likeButtons = await findElements(selector, { now: true });

    for (const button of likeButtons) {
        await clickElement(button);
        await waitActionComplete();
        await waitModalClosed();
    }

    await reporter.report(like.url, likeButtons.length || "Лайки не найдены")
}

async function loadAllCommentsManually() {
    const buttonSelector = `.replies_list .replies_next_main:not(.replies_next_pre_deleted)`
    const loaderSelector = `.replies_list .replies_next_loader`
    const replySelector = `.replies_list > .reply`

    // if button shows, scroll to it
    do {
        let button = await clickElement(buttonSelector, {waitTime: 1000})
        if (button === null) break

        // wait while loader shows
        let loader = await findElement(loaderSelector, {waitTime: 1000})

        await waitForElementDeleted(loader)
    } while (true);

    await scrollToBottom()
}

async function loadAllCommentsAuto() {
    const buttonSelector = `.replies_list .replies_next_main:not(.replies_next_pre_deleted)`
    const loaderSelector = `.replies_list .replies_next_loader`
    const replySelector = `.replies_list > .reply`

    // if button shows, scroll to it
    do {
        let button = await findElement(buttonSelector, {waitTime: 1000})
        if (button === null) break

        // wait while loader shows
        let isLoaderFirst = true
        do {
            await scrollToBottom()

            let loader = await findElement(loaderSelector, {waitTime: 1000})

            // first loader should be showed
            // second loader may be showed
            if (loader === null) {
                if (isLoaderFirst) {
                    return false
                }
                else {
                    break
                }
            }

            await waitForElementDeleted(loader)
            isLoaderFirst = false
        } while (true);
    } while (true);

    await scrollToBottom()

    return true
}