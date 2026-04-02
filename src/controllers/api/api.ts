import { type TDownloadLink, type TDownloadModel, type TGCWConfigModel, type TgcwOptions, type TGetComicsApiModel, type TPostLink } from "#src/types.ts";
import c from "ansi-colors";
import Enquirer from "enquirer";
import { ellipsis } from "#src/utils.ts";
import { downloadComicsList, saveDownloadHistory } from "#src/controllers/api/download.ts";
import { initialSearch, searchForDownloadLinks, searchForWeeklyListLinks } from "#src/controllers/api/search.ts";
import path from "path";

/**
 * WP-JSON API-based download functionality.
 * @param search The search term entered by the user.
 * @param prompt An instance of enquirer.prompt.
 * @param config A valid instance of TGCWConfigModel.
 * @param GetComicsApiModel A valid instance of TGetComicsApiModel.
 * @param DownloadModel A valid instance of TDownloadModel.
 * @param options An object containing the options passed by the user.
 */
export async function api({
    search,
    prompt,
    config,
    GetComicsApiModel,
    DownloadModel,
    options
}:{
    search: string,
    prompt: typeof Enquirer.prompt,
    config: TGCWConfigModel,
    GetComicsApiModel: TGetComicsApiModel,
    DownloadModel: TDownloadModel,
    options: TgcwOptions,
}){

    try {

        const downloadPath = (options.desiredPath === undefined)
        ? (await config.getConfig()).defaultOutputDir || path.join(process.cwd())
        : options.desiredPath;

        let postLinks: TPostLink[] = [];
        let downloadLinks: TDownloadLink[] = [];

        if (options.weeklyList === true){
            
            postLinks = await searchForWeeklyListLinks(GetComicsApiModel, options.weeklyListGroup);
            if (postLinks.length === 0) {
                console.log(c.red.bold('No comic(s) found that match the search criteria. Please try again.'));
                process.exit(0);
            }
            console.log(c.cyan(`Found ${postLinks.length} element(s) matching the search criteria.`));

            downloadLinks = await GetComicsApiModel.getDownloadLinksFromPosts(postLinks);
            if (downloadLinks.length === 0) {
                console.log(c.red.bold('No downloadable comic(s) found.'));
                process.exit(0);
            }

        }else{
            
            postLinks = await initialSearch(search, GetComicsApiModel, options);
            if (postLinks.length === 0) {
                console.log(c.red.bold('No comic(s) found that match the search criteria. Please try again.'));
                process.exit(0);
            }           
            console.log(c.cyan(`Found ${postLinks.length} element(s) matching the search criteria.`));

            downloadLinks = await searchForDownloadLinks(postLinks, GetComicsApiModel, /*options*/);
            if (downloadLinks.length === 0) {
                console.log(c.red.bold('No downloadable comic(s) found.'));
                process.exit(0);
            }

        }
        
        while (true){
            
            console.log(c.white('*'.repeat(10)));      
            const { comicIndex } = await prompt<{ comicIndex: string }>({
                type: 'select',
                name: "comicIndex",
                message: c.cyan("Choose a comic to download:"),
                choices: [
                    ...downloadLinks.map((link, index) => ({ name: index.toString(), message: c.white(`· ${link.title} ${link.downloadLink ? ellipsis(link.downloadLink, 30) : ''}`) })),
                    { name: 'all', message: c.yellowBright.bold('Download all comics') },
                    { name: 'list', message: c.yellowBright.bold('Choose a list of comics to download') },
                    { name: 'exit', message: c.redBright.bold('Exit') }, 
                ]
            });

            if (comicIndex.toString() === 'exit') {
                console.log(c.white.bold('Bye!'));
                break;
            }

            if (comicIndex.toString() === 'list'){
                const wantsOut = await downloadComicsList(
                    downloadLinks, 
                    prompt, 
                    DownloadModel, 
                    downloadPath
                );
                if (wantsOut === false) break;
            }            
                
            if (comicIndex.toString() === 'all'){
                await DownloadModel.downloadComicBundle({
                    postLinks: downloadLinks,
                    noRetry: false,
                    outputDir: downloadPath
                });
                break;
            }

            const downloadLink = downloadLinks[Number(comicIndex)];
            if (downloadLink){               
                await DownloadModel.downloadComic({
                    link: downloadLink,
                    rowIndex: 0,
                    totalRows: 1,
                    noRetry: false,
                    outputDir: downloadPath
                });
                await saveDownloadHistory(
                    [downloadLink], 
                    config
                );
                break;
            }
                
            console.log(c.red.bold('Invalid selection. Please try again.'));
            
        }

        process.exit(0);

    }catch(error){

        console.error(error);
        process.exit(1);

    }

}