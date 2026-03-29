import { type TDownloadLink, type TDownloadModel, type TGCWConfigModel } from "#src/types.ts";
import type Enquirer from "enquirer";
import c from "ansi-colors";
import { DOWNLOADS_DIR } from "#src/data.ts";

/**
 * Saves the download history to the config file.
 * @param downloadLinks An array of TDownloadLink objects.
 * @param config A valid instance of TGCWConfigModel.
 */
export async function saveDownloadHistory(
    downloadLinks: TDownloadLink[], 
    config: TGCWConfigModel
){  
    console.log(c.white.bold('Saving download history...'));
    const currHistory = (await config.getConfig()).downloadHistory;
    downloadLinks.forEach(link => {
        if (!currHistory.includes(link.title)) currHistory.push(link.title);
    });
    await config.setConfig('downloadHistory', currHistory);
}

/**
 * Displays a list of comics and allows the user to select which ones to download.
 * @param downloadLinks An array of TDownloadLink objects.
 * @param prompt An instance of enquirer.prompt.
 * @param DownloadModel A valid instance of TDownloadModel.
 * @returns Whether the user wants to exit the program.
 */
export async function downloadComicsList(
    downloadLinks: TDownloadLink[],
    prompt: typeof Enquirer.prompt,
    DownloadModel: TDownloadModel,
    config: TGCWConfigModel,
): Promise<boolean> {

    console.log(c.white.bold('*'.repeat(10)));
    const { comicIndexes } = await prompt<{ comicIndexes: string[] }>({
        type: 'multiselect',
        name: "comicIndexes",
        message: c.cyan("Choose a list of comics to download (SPACE to select, ENTER to download):"),
        choices: [
            ...downloadLinks.map((link, index) => ({ name: index.toString(), message: c.white(`· ${link.title}`) })),
            { name: 'Go back', message: c.yellowBright.bold('Go back') },
        ],
    });

    if (comicIndexes.includes('Go back')) {
        console.log(c.white.bold('*'.repeat(10)));
        return true;
    }

    const comicsToDownload = downloadLinks.filter((_, index) => comicIndexes.includes(index.toString()));

    if (comicsToDownload.length === 0) {
        console.log(c.red.bold('No comic(s) were selected. Please try again.'));
        return false;
    }

    const { wantsToDownload } = await prompt<{ wantsToDownload: boolean }>({
        type: 'confirm',
        name: "wantsToDownload",
        message: c.cyan(`Are you sure you want to download ${comicsToDownload.length} comic(s)?`),
        initial: ''
    });

    if (!wantsToDownload) {
        console.log(c.red.bold('Download aborted.'));
    } else {
        await DownloadModel.downloadComicBundle({
            postLinks: comicsToDownload,
            noRetry: false,
            outputDir: (await config.getConfig()).defaultOutputDir || DOWNLOADS_DIR
        });
    }

    return false;
    
}