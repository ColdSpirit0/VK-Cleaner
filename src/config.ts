import dotenv from "dotenv"
dotenv.config()

let config = {
    // debugging
    saveProgress: true,
    logToFile: false,
    openDevTools: false,
    verbose: false,
    progressFilePath: "./progress.json",
    reportsDirectoryPath: "./reports/",
    manualRemoveReportFilename: "_ManualRemove",

    // visual
    startMaximized: true,

    // vk
    archivePath: "./Archive",
    cookiesPath: "./vk.cookies",

    // selenium
    waitElementTimeout: 3000,
    actionCompleteTimeout: 1000,
    userDataPath: "./seleniumUserData",
    dontCloseBrowser: true,
}

export default config