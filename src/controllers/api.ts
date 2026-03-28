import { MAX_PAGE_INDEX, type TDownloadLink, type TDownloadModel, type TgcwOptions, type TGetComicsApiModel, type TPostLink } from "#src/types.ts";
import { spinner } from "#src/utils.ts";
import c from "ansi-colors";
import Enquirer from "enquirer";

/**
 * Initial search for pages that match the search term.
 * @param search The search term to be used.
 * @param GetComicsApiModel A valid instance of TGetComicsApiModel.
 * @param options Optional options. Includes "numofPages", "exact".
 * @returns 
 */
async function initialSearch(
    search: string,
    GetComicsApiModel: TGetComicsApiModel,
    options?: TgcwOptions,
){
    const stop = spinner(`Searching for: ${search}...`);
    const postLinks = await GetComicsApiModel.getPostLinks({ 
        search, 
        page: Array.from({ length: options?.numofPages ?? MAX_PAGE_INDEX }, (_, i) => i + 1),
    });
    stop();
    return (options?.exact === true)
    ? postLinks.filter((postLink) => postLink.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
    : postLinks;
}

/**
 * Searches for direct download links for the given post links.
 * @param postLinks An array of TPostLink objects.
 * @param GetComicsApiModel A valid instance of TGetComicsApiModel.
 * @param options Optional options.
 * @returns 
 */
async function searchForDownloadLinks(
    postLinks: TPostLink[],
    GetComicsApiModel: TGetComicsApiModel,
    options?: TgcwOptions,
){
    const stop2 = spinner('Searching for direct download links...');
    const downloadLinks = await GetComicsApiModel.getDownloadLinksFromPosts(postLinks);
    stop2();
    return downloadLinks;
}

/**
 * Displays a list of comics and allows the user to select which ones to download.
 * @param downloadLinks An array of TDownloadLink objects.
 * @param prompt An instance of enquirer.prompt.
 * @param DownloadModel A valid instance of TDownloadModel.
 * @returns Whether the user wants to exit the program.
 */
async function downloadComicsList(
    downloadLinks: TDownloadLink[],
    prompt: typeof Enquirer.prompt,
    DownloadModel: TDownloadModel,
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
            noRetry: false
        });
    }

    return false;
    
}

export async function api({
    search,
    prompt,
    GetComicsApiModel,
    DownloadModel,
    options
}:{
    search: string,
    prompt: typeof Enquirer.prompt,
    GetComicsApiModel: TGetComicsApiModel,
    DownloadModel: TDownloadModel,
    options?: TgcwOptions,
}){

    try {
        
        const postLinks = await initialSearch(search, GetComicsApiModel, options);
        if (postLinks.length === 0) {
            console.log(c.red.bold('No comic(s) found that match the search criteria. Please try again.'));
            process.exit(0);
        }
        console.log(c.cyan(`Found ${postLinks.length} page(s) matching the search criteria.`));
        
        const downloadLinks = await searchForDownloadLinks(postLinks, GetComicsApiModel, options);
        if (downloadLinks.length === 0) {
            console.log(c.red.bold('No downloadable comic(s) found.'));
            process.exit(0);
        }

        while (true){
            
            console.log(c.white('*'.repeat(10)));      
            const { comicIndex } = await prompt<{ comicIndex: string }>({
                type: 'select',
                name: "comicIndex",
                message: c.cyan("Choose a comic to download:"),
                choices: [
                    ...downloadLinks.map((link, index) => ({ name: index.toString(), message: c.white(`· ${link.title}`) })),
                    { name: 'all', message: c.yellowBright.bold('Download all comics') },
                    { name: 'list', message: c.yellowBright.bold('Choose a list of comics to download') },
                    { name: 'exit', message: c.redBright.bold('Exit') }, 
                ]
            });

            if (comicIndex.toString() === 'list'){

                const wantsOut = await downloadComicsList(downloadLinks, prompt, DownloadModel);
                if (wantsOut === false) break;            
                
            }else if (comicIndex.toString() === 'exit') {
                
                console.log(c.white.bold('Bye!'));
                break;

            }else if (comicIndex.toString() === 'all'){

                await DownloadModel.downloadComicBundle({
                    postLinks: downloadLinks,
                    noRetry: false
                });
                
                break;

            }else {

                const downloadLink = downloadLinks[Number(comicIndex) - 1];
                if (downloadLink){
                    await DownloadModel.downloadComic({
                        link: downloadLink,
                        rowIndex: 0,
                        totalRows: 1,
                        noRetry: false
                    });
                    break;
                }else{
                    console.log(c.red.bold('Invalid selection. Please try again.'));
                }

            }

        }

        process.exit(0);

    }catch(error){

        console.error(error);
        process.exit(1);

    }

}