import { abortSignal, Progress, TaskCancelledError } from "@/classes/Progress";
import { Reporter } from "@/classes/Reporter";
import { Task } from "@/classes/Task";
import { clickElement, findElement, findElements, hoverElement, injectCSS, waitActionComplete } from "@/utils/selenium";
import { clickFirstElement, clickTextAction, findFirstElement } from "../vkDom";
import { getUserId, openPage } from "../vkHelpers";

const reporter = new Reporter(Task.DeleteWall)

export async function deleteWall(progress: Progress) {
    let userId = await getUserId()
    if (userId === null) {
        await reporter.report("Не удалось определить userId")
        return
    }

    await openPage(`https://vk.com/wall${userId}`)
    await injectCSS(`
    .dld {
        display: none !important;
    }
    `)

    let deletedPostsCount = 0
    while(await deletePost()) {
        if (abortSignal.aborted) throw new TaskCancelledError()
        deletedPostsCount++
    }
    await reporter.report("Удалено постов:", deletedPostsCount)
}

async function deletePost(): Promise<boolean> {
    const visiblePostSelector = `//*[(@data-post-id or class("post") or contains(@class, "Post")) and not(descendant::*[class("dld") and not(contains(@style, "display: none"))]) and not(contains(@class, "deleted"))]`
    const postActionsSelectors = [
        visiblePostSelector + `//*[class("PostHeaderActions") or @data-testid="post_header_actions" or contains(@aria-label, "Действия") or contains(@title, "Действия") or contains(@aria-label, "Ещё") or contains(@title, "Ещё")]`,
        `[data-testid="post_header_actions"]`,
        `[data-testid*="post"][data-testid*="actions"]`,
        `[aria-label*="Действия"]`,
        `[aria-label*="Ещё"]`,
    ]
    const deleteButtonSelectors = [
        `[data-testid="post_context_menu_item_delete"]`,
        `[data-testid*="post"][data-testid*="delete"]`,
        `[role="menuitem"][aria-label*="Удалить"]`,
    ]
    const loadMoreButtonSelector = `#fw_load_more`

    let posts = await findElements(visiblePostSelector)
    if (posts.length === 0) {
        // if no posts, try load more
        let loadMoreButton = await findElement(loadMoreButtonSelector)
        if (loadMoreButton !== null && await loadMoreButton.isDisplayed()) {
            await clickElement(loadMoreButton)
            await waitActionComplete()
            posts = await findElements(visiblePostSelector)
            if (posts.length === 0) {
                return false
            }
        }
        // if cant load, return false
        else {
            return false
        }
    }
    
    await hoverElement(posts[0], { now: true, safe: false })
    await clickFirstElement(postActionsSelectors, { safe: false })
    const deleteButton = await clickFirstElement(deleteButtonSelectors, { waitTime: 1000 })
    if (deleteButton === null) {
        await clickTextAction(["Удалить запись", "Удалить"], { safe: false })
    }
    await waitActionComplete()

    const confirmButton = await findFirstElement([
        `//*[@id="box_layer"]//*[class("FlatButton") and descendant-or-self::*[contains(normalize-space(.), "Удалить")]]`,
        `[data-testid="modal-confirm-button"]`,
        `[data-testid*="confirm"]`,
    ], { waitTime: 500 })
    if (confirmButton !== null) {
        await clickElement(confirmButton)
        await waitActionComplete()
    }

    return true
}
