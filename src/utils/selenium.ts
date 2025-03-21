import { By, Locator, until, WebDriver, WebElement } from "selenium-webdriver"
import { driver } from "../driverInstance"
import config from "../config"
import { isString, isWebElement } from "./typeCheckers"
import { logger } from "./Logger"
import { Command } from "selenium-webdriver/lib/command"


/*

ACTIONS (splitted by function)
    click
    find one element
    find many elements
    check element exists
    scroll to element

TYPES (in options)
    selector argument or locator argument - first parameter, check by type
    wait element or get it now
    should throw error or not
*/
type UserActionOptions = {
    now?: boolean,
    waitTime?: number
    safe?: boolean
}

type CountChangeInfo = {
    changed: boolean
    from: number
    to: number
}

// safe by default
type UserActionSafeOptions = Omit<UserActionOptions, "safe">
type UserActionWaitOptions = Omit<UserActionOptions, "now">


type QueryType = string | Locator
type ActionQueryType = QueryType | WebElement


const defaultOptions: UserActionOptions = {
    now: false,
    waitTime: config.waitElementTimeout,
    safe: true,
}

export async function clickElement(elementData: ActionQueryType, options?: UserActionOptions) {
    logger.debug("CLICK_ELEMENT", elementData, options)

    options = normalizeOptions(options)
    let element = await getElement(elementData, options)

    if (element !== null) {
        try {
            await scrollToElement(element)
            await element.click()
        } catch (error) {
            if (options.safe) {
                return element
            }
            else {
                throw error
            }
        }
    }

    return element
}


export async function waitElementCountChanged(query: QueryType, options?: UserActionWaitOptions): Promise<CountChangeInfo> {
    logger.debug("WAIT_ELEMENT_COUNT_CHANGED", query, options)

    options = normalizeOptions(options)
    const findOptions: UserActionOptions = { safe: options.safe, now: true }

    let initialCount: number = -1
    let currentCount: number = -1

    try {
        initialCount = (await findElements(query, findOptions)).length

        await driver.wait(async function() {
            currentCount = (await findElements(query, findOptions)).length
            return initialCount !== currentCount
        }, options.waitTime)

    } catch (error) {
        if (options.safe) {
            logger.log("NOT changed")
            return { changed: false, from: initialCount, to: currentCount }
        }
        else {
            throw error
        }
    }

    return { changed: true, from: initialCount, to: currentCount }
}


// not tested
export async function hoverElement(elementData: ActionQueryType, options?: UserActionOptions) {
    logger.debug("HOVER_ELEMENT", elementData, options)

    options = normalizeOptions(options)
    let element = await getElement(elementData, options)

    if (element !== null) {
        await scrollToElement(element)
        await driver.actions().move({ x: 0, y: 0, origin: element }).perform()
    }

    return element
}

export async function findElement(query: QueryType, options?: UserActionOptions): Promise<WebElement> {
    logger.debug("FIND_ELEMENT", query, options)

    let locator: Locator = getLocator(query)
    options = normalizeOptions(options)

    try {
        if (options.now) {
            return await driver.findElement(locator)
        }
        else {
            return await driver.wait(until.elementLocated(locator), options.waitTime)
        }
    } catch (error) {
        if (options.safe) {
            return null
        }
        else {
            throw error
        }
    }
}

export async function findElements(query: QueryType, options?: UserActionOptions): Promise<WebElement[]> {
    logger.debug("FIND_ELEMENTS", query, options)

    let locator: Locator = getLocator(query)
    options = normalizeOptions(options)

    try {
        if (options.now) {
            return await driver.findElements(locator)
        }
        else {
            return await driver.wait(until.elementsLocated(locator), options.waitTime)
        }
    } catch (error) {
        if (options.safe) {
            return []
        }
        else {
            throw error
        }
    }
}

export async function waitForElement(query: QueryType, options?: UserActionWaitOptions) {
    logger.debug("WAIT_ELEMENT", query, options)

    // same as find element but now:false by default
    let optionsNorm = normalizeOptions(options)
    // optionsNorm.now = false
    return await findElement(query, optionsNorm)
}

export async function waitForElementHidden(elementData: ActionQueryType, options?: UserActionWaitOptions) {
    options = normalizeOptions(options)
    let element = await getElement(elementData, options)

    // wait for element disappear
    try {
        await driver.wait(until.elementIsNotVisible(element), options.waitTime)
    } catch (error) {
        if (!options.safe) {
            throw error
        }
    }
}

export async function waitForElementDeleted(elementData: ActionQueryType, options?: UserActionWaitOptions) {
    logger.debug("WAIT_ELEMENT_DELETED", elementData, options)

    options = normalizeOptions(options)
    let element = await getElement(elementData, options)

    // wait for element disappear
    try {
        await driver.wait(until.stalenessOf(element), options.waitTime)
    } catch (error) {
        if (!options.safe) {
            throw error
        }
        else {
            return false
        }
    }

    return true
}

export async function waitForElements(query: QueryType, options?: UserActionWaitOptions) {
    logger.debug("WAIT_ELEMENTS", query, options)

    // same as find elements but now:false by default
    let optionsNorm = normalizeOptions(options)
    // optionsNorm.now = false
    return await findElements(query, optionsNorm)
}

export async function isElementExists(query: QueryType, options?: UserActionSafeOptions) {
    logger.debug("IS_ELEMENT_EXISTS", query, options)

    let locator = getLocator(query)
    options = normalizeOptions(options)

    let element = await findElement(query, options)
    return element !== null
}

export async function scrollToElement(elementData: ActionQueryType, options?: UserActionOptions) {
    logger.debug("SCROLL_TO_ELEMENT", elementData, options)

    options = normalizeOptions(options)
    let element = await getElement(elementData, options)

    // scroll to it if it exists
    if (element !== null) {
        await driver.executeAsyncScript(function(element, resolve) {
            element.scrollIntoView({ block: "center", behavior: "instant" })
            resolve()
        }, element)
    }

    return element
}

export async function scrollToTop() {
    logger.debug("SCROLL_TO_TOP")

    await driver.executeAsyncScript(function(resolve) {
        // @ts-ignore
        window.scrollTo({ left: 0, top: 0, behavior: "instant" })
        resolve()
    })
}

export async function scrollToBottom() {
    logger.debug("SCROLL_TO_BOTTOM")

    await driver.executeAsyncScript(function(resolve) {
        // @ts-ignore
        window.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: "instant" })
        resolve()
    })
}

export async function browserLog(...args: any[]) {
    await driver.executeAsyncScript(function(innerArgs: any[], resolve) {
        console.log(...innerArgs)
        resolve()
    }, args)
}


// should be opened dev tools
export async function browserDebugger() {
    await driver.executeAsyncScript(function(resolve) {
        debugger;
        resolve()
    })
}

async function getElement(elementData: ActionQueryType, options: UserActionOptions): Promise<WebElement> {
    let element: WebElement = null
    if (isWebElement(elementData)) {
        element = elementData
    }
    else {
        element = await findElement(elementData, options)
    }
    return element
}

export async function isElementOverlapped(element: WebElement) {
    return await driver.executeAsyncScript(function(element, resolve) {
        function isOverlapped(targetElement: Element) {
            const rect = targetElement.getBoundingClientRect()
            const foundElement = document.elementFromPoint(
                rect.x + rect.width / 2,
                rect.y + rect.height / 2
            )
            return !targetElement.contains(foundElement)
        }
        resolve(isOverlapped(element))
    }, element)
}

function getLocator(query: QueryType): Locator {
    if (isString(query)) {
        return selectorToLocator(query)
    }

    return query
}

function selectorToLocator(selector: string): Locator {
    // if xpath selector
    if (selector.startsWith("/") || selector.startsWith("(")) {
        // replace old class() to new class()
        let s = selector.replaceAll(/class\("(.+?)"\)/g, `contains(concat(" ", @class, " "), " $1 ")`)
        return By.xpath(s)
    }
    // if css selector
    else {
        return By.css(selector)
    }
}

function normalizeOptions(optionsParam: any): UserActionOptions {
    let optionsBase = { ...defaultOptions }

    if (typeof optionsParam === "object") {
        Object.assign(optionsBase, optionsParam)
    }

    return optionsBase
}

export async function waitActionComplete() {
    logger.debug("WAIT_ACTION_COMPLETE")
    await driver.sleep(config.actionCompleteTimeout)
}

export async function waitBrowserClosed() {
    logger.debug("WAIT_BROWSER_CLOSED")
    while (true) {
        await driver.sleep(1000)
        let handles = await driver.getAllWindowHandles()
        if (handles.length === 0) {
            await driver.quit()
            break
        }
    }
}

export async function injectCSS(css: string) {
    logger.debug("INJECT_CSS")
    await driver.executeAsyncScript(function(css, resolve) {
        let styleElement = document.createElement("style")
        styleElement.innerHTML = css
        document.head.appendChild(styleElement)
        resolve()
    }, css)
}