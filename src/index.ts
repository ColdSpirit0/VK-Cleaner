import config from "./config"
import { LikesParser } from "./parsers/LikeParser/LikesParser"
import { Builder, Browser, By, Key, until, ThenableWebDriver, WebDriver, Locator } from "selenium-webdriver"
import fs from "fs"
import { isExists } from "./utils/fs"
import { Options } from "selenium-webdriver/chrome"
import path from "path"
main().catch(console.log)

let driver: WebDriver

async function main() {
    driver = await prepareBrowser()
    await loginVK()
    // await deleteLikes()
    // await driver.sleep(100000000)
}

async function loginVK() {
    await driver.get("https://vk.com")

    // check if signed in already, no login required
    let isSignedIn = await isElementVisible(By.css(".TopNavBtn__profileImg"))
    if (!isSignedIn) {
        console.log("sign in with login/pass")
        // click "login"
        await driver.findElement(By.css(".VkIdForm__signInButton")).click()

        // fill login input
        const loginInputLocator = By.css(".vkc__EnterLogin__input input")
        let loginInput = await waitElementLocated(loginInputLocator)
        // let loginInput = await driver.findElement(loginInputLocator)
        await loginInput.click()
        await loginInput.sendKeys(config.login)

        let enterLoginButton = await waitElementLocated(By.css(".vkc__EnterLogin__button"))
        await enterLoginButton.click()

        // click "with password"
        const switchToPasswordLocator = By.css(".vkc__Bottom__switchToPassword")
        let switchToPasswordButton = await waitElementLocated(switchToPasswordLocator)
        await switchToPasswordButton.click()

        // fill password input
        let passwordInputLocator = By.css(".vkc__Password__Wrapper input")
        let passInput = await waitElementLocated(passwordInputLocator)
        await passInput.click()
        await passInput.sendKeys(config.pass)

        // click next
        let nextButtonLocator = By.css(".vkc__EnterPasswordNoUserInfo__buttonWrap")
        let nextButton = await waitElementLocated(nextButtonLocator)
        await nextButton.click()

        // wait for page loaded
        await waitElementLocated(By.css(".TopNavBtn__profileImg"))
        await driver.sleep(1000)
    }
}

async function deleteLikes() {
    let likesParser = new LikesParser()
    likesParser.init(config.archivePath)
    let likesData = await likesParser.parse()

    console.log(likesData[0])
    await deleteLike(likesData[0].url)
}

async function deleteLike(url: string) {
    await driver.get(url);
}

async function waitElementLocated(locator: Locator) {
    return await driver.wait(until.elementLocated(locator))
}

async function prepareBrowser(): Promise<WebDriver> {
    const options = new Options()
    options.detachDriver(!config.dontCloseBrowser)
    options.addArguments("user-data-dir=" + path.resolve(config.userDataPath))
    options.windowSize({width: 1200, height: 1000})

    let driver = await new Builder()
        .forBrowser(Browser.CHROME)
        .setChromeOptions(options)
        .build()

    return driver
}

async function isElementVisible(locator: Locator) {
    try {
        await driver.wait(until.elementLocated(locator), config.waitElementTimeout)
    } catch (error) {
        return false
    }
    return true
}