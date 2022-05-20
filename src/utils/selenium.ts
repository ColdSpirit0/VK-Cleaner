import { By, Locator, until } from "selenium-webdriver"
import { driver } from "../driverInstance"
import config from "../config"

export async function clickElement(selector: string) {
    let locator = selectorToLocator(selector)
    let element = await waitForElementLocator(locator)
    await element.click()
    return element
}

export async function waitForElement(selector: string) {
    let locator = selectorToLocator(selector)
    return await waitForElementLocator(locator)
}

export async function waitForElements(selector: string) {
    let locator = selectorToLocator(selector)
    try {
        return await waitForElementsLocator(locator)
    } catch (error) {
        return []
    }
}

export async function findElementsNow(selector: string) {
    let locator = selectorToLocator(selector)
    // try {
    return await driver.findElements(locator)
    // } catch (error) {
    //     return []
    // }
}


async function waitForElementsLocator(locator: Locator) {
    return await driver.wait(until.elementsLocated(locator), config.waitElementTimeout)
}

async function waitForElementLocator(locator: Locator) {
    return await driver.wait(until.elementLocated(locator), config.waitElementTimeout)
}

export async function isElementVisible(selector: string, now = false) {
    let locator = selectorToLocator(selector)

    try {
        if (now) {
            await driver.findElement(locator)
        }
        else {
            await driver.wait(until.elementLocated(locator), config.waitElementTimeout)
        }
    } catch (error) {
        return false
    }
    return true
}

export function selectorToLocator(selector: string): Locator {
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