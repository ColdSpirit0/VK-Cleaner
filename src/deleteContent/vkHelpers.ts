import { driver } from "@/driver";
import { Reporter } from "@/classes/Reporter";
import { logger } from "@/utils/Logger";
import { findElement, findElements, isElementExists, isElementOverlapped, waitForElement } from "@/utils/selenium";

const o = {
    locators: {
        pageReady: [
            "#content",
            "#page_layout",
            "#page_wrap",
            "#spa_root",
            "body",
        ],
        accessError: `
            //*[class("message_page_title") and normalize-space(text())="Ошибка"] |
            //*[contains(@class, 'HiddenPostBlank')] |
            //*[@data-testid="placeholder_description"] |
            //*[contains(@class, "Placeholder") and descendant-or-self::*[
                contains(normalize-space(.), "Запись удалена")
                or contains(normalize-space(.), "страница недоступна")
                or contains(normalize-space(.), "видео недоступно")
            ]]`,
        pageAnchors: `
            //*[@id="page_header"]//*[contains(concat(" ", @class, " "), " WjmGck ")] |
            //*[class("TopNavBtn__profileImg")] |
            //*[@id="content"]`,
        blockingModal: `
            //*[@id="box_layer" and not(contains(@style, "display: none"))] |
            //*[@data-testid="modalbox"] |
            //*[contains(@class, "vkuiModalRoot") or contains(@class, "ModalRoot")]`,
        contentViewer: `//*[@id="pv_box"
            or @id="mv_box"
            or @id="react_rootVideo_page"
            or @data-testid="photo-viewer"
            or @data-testid="video_modal"
            or @data-testid="video_page"
            or contains(@class, "PhotoViewer")
            or contains(@class, "VideoModal")]`,
    }
}

export async function openPage(url: string, reporter: Reporter = null) {
    // open url 
    logger.log("Opening", url);
    await driver.get(url);

    // wtf fix
    if (!await isElementExists("body")) {
        await driver.navigate().refresh();
    }

    // check it was blocked by rkn
    let currentUrl = await driver.getCurrentUrl();
    if (currentUrl.startsWith("https://vk.com/blank.php?rkn=")) {
        await reporter?.report(url, "Заблокирован");
        return false;
    }

    // wait for base element
    // may to throw error, its ok
    await waitForVkShell();

    await waitModalClosed()

    // report if access error
    if (await isElementExists(o.locators.accessError)) {
        await reporter?.report(url, "Ошибка");
        return false;
    }

    return true;
}

// check for captcha or any modal
// captcha is solved when it was showed and missed after for 1 second
export async function waitModalClosed() {
    let wasCaptcha = false

    let modalFound = await isModalPresent()
    if (modalFound) {
        wasCaptcha = true
        logger.log("Modal found, please close it manually")
    }

    while (await isModalPresent()) {
        await driver.sleep(3000)
    }

    if (wasCaptcha) {
        logger.log("Modal closed")
        await driver.sleep(1000)
    }
}

async function isModalPresent() {
    const targetElements = await findElements(o.locators.pageAnchors, { now: true })
    if (targetElements.length === 0) {
        return false
    }

    const overlappedMap = await Promise.all(targetElements.map(isElementOverlapped))
    const pageIsOverlapped = overlappedMap.some(Boolean)
    if (!pageIsOverlapped) {
        return false
    }

    if (await isElementExists(o.locators.contentViewer, { now: true })) {
        return false
    }

    return await isElementExists(o.locators.blockingModal, { now: true });
}

async function waitForVkShell() {
    for (const locator of o.locators.pageReady) {
        const element = await waitForElement(locator, { waitTime: 1000 })
        if (element !== null) {
            return element
        }
    }

    return await waitForElement("body")
}

// check captcha for one window
// async function waitCaptchaWindow() {
//     let captchaExists = true;
//     let captchaExisted = false;


//     while (captchaExists) {
//         let captchas = await findElements(`//*[@data-testid="modalbox"]`, { now: true });

//         if (captchas.length > 0) {
//             captchaExisted = true;
//             await driver.sleep(500);
//         }
//         else {
//             captchaExists = false;
//         }
//     }

//     return captchaExisted;
// }

export async function getUserId(): Promise<number | null> {
    const userId = await driver.executeAsyncScript(function(resolve) {
        const vkWindow = window as any
        resolve(vkWindow.vk?.id ?? vkWindow.cur?.oid ?? vkWindow.cur?.user?.id ?? null)
    })

    if (userId !== null) {
        return Number(userId)
    }

    const profileUrl = await getProfileUrl()
    const match = profileUrl.match(/(?:id|wall)(\d+)$/)
    return match === null ? null : Number(match[1])
}
export async function getProfileUrl(): Promise<string> {
    // open vk page
    await openPage("https://vk.com")

    // get my page url
    const profileUrl = await driver.executeScript(function() {
        const selectors = [
            "#l_pr > a",
            "#top_profile_link",
            "[data-testid='leftmenu-my-profile'] a",
            "#page_header a[href*='/id']",
        ]

        for (const selector of selectors) {
            const element = document.querySelector(selector) as HTMLAnchorElement
            if (element?.href) {
                return element.href
            }
        }

        const avatar = document.querySelector("#page_header .WjmGck")
        const link = avatar?.closest("a[href]") as HTMLAnchorElement
        return link?.href ?? null
    }) as string

    if (profileUrl !== null) {
        return profileUrl
    }

    let element = await findElement(`#l_pr > a, #top_profile_link, [data-testid="leftmenu-my-profile"] a`, { safe: false })
    return await element.getAttribute("href")
}
