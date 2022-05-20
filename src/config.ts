import dotenv from "dotenv"
dotenv.config()

let config = {
    archivePath: "./Archive",
    login: process.env.VK_LOGIN,
    pass: process.env.VK_PASS,
    waitElementTimeout: 3000,
    actionCompleteTimeout: 1000,
    userDataPath: "./seleniumUserData",
    cookiesPath: "./vk.cookies",
    dontCloseBrowser: true,
    progressFilePath: "./progress.json",
    reportsDirectoryPath: "./reports/",
    manualRemoveReportFilename: "_ManualRemove"
    // token: process.env.VK_TOKEN,
    // downloadPath: "./downloads",
    // likes: {
    //     delete: true
    // },
    // photos: {
    //     dump: true
    // }
}

export default config