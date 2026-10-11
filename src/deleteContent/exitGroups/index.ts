import { abortSignal, Progress, TaskCancelledError } from "@/classes/Progress";
import { Reporter } from "@/classes/Reporter";
import { Task } from "@/classes/Task";
import { findElement, hoverElement, scrollToBottom, waitActionComplete } from "@/utils/selenium";
import { openPage } from "../vkHelpers";
import { clickFirstElement, clickTextAction } from "../vkDom";

const o = {
    groupsURL: `https://vk.com/groups/my_all_groups`,

    locators: {
        loadMore: `#spa_root .vkuiSpinner__host`,
        actionsButton: `//*[@data-testid="desktop_group_item_button" and not(descendant-or-self::*[
            normalize-space(text())="Подписаться"
            or normalize-space(text())="Подать заявку"
        ])] |
            //*[(@role="button" or self::button) and descendant-or-self::*[
                normalize-space(text())="Вы участник"
                or normalize-space(text())="Подписки"
                or normalize-space(text())="Вы подписаны"
            ]]`,
        actionUnsubscribe: [
            `//*[@data-testid="dropdownactionsheet-item" and descendant-or-self::*[
                normalize-space(text())="Отписаться"
                or normalize-space(text())="Выйти из группы"
                or normalize-space(text())="Покинуть"
            ]]`,
            `[data-testid*="unsubscribe"]`,
        ],
        warningModalUnsubscribe: [
            `//*[@id="box_layer"]//*[class("FlatButton") and descendant-or-self::*[
                normalize-space(text())="Отписаться"
                or normalize-space(text())="Выйти из группы"
                or normalize-space(text())="Покинуть"
            ]]`,
            `[data-testid="modal-confirm-button"]`,
        ],
    }
}

const reporter = new Reporter(Task.ExitGroups)

export async function exitGroups(progress: Progress) {
    await openPage(o.groupsURL)

    while (true) {
        const loadMore = await findElement(o.locators.loadMore, { waitTime: 1000 })
        if (loadMore === null || !await loadMore.isDisplayed()) {
            break
        }

        if (abortSignal.aborted) throw new TaskCancelledError()
        await scrollToBottom()
        await waitActionComplete()
    }

    let leavedGroupsCount = 0
    while (await exitGroup()) {
        if (abortSignal.aborted) throw new TaskCancelledError()
        leavedGroupsCount++
    }

    await reporter.report("Покинуто групп:", leavedGroupsCount)
}

async function exitGroup() {
    let actionsButton = await hoverElement(o.locators.actionsButton)
    if (actionsButton === null) {
        return false
    }

    let unsubscribeButton = await clickFirstElement(o.locators.actionUnsubscribe, { waitTime: 1000 })
    if (unsubscribeButton === null) {
        unsubscribeButton = await clickTextAction(["Отписаться", "Выйти из группы", "Покинуть"], { safe: false })
    }

    // click exit if warning shown
    await clickFirstElement(o.locators.warningModalUnsubscribe, { waitTime: 500 })

    // mouse out
    // await hoverElement("#groups_list_groups .group_list_row:not(.deleted) .group_row_photo", { now: true, safe: false })

    await waitActionComplete()

    return true
}
