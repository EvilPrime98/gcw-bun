import { type TDownloadType, type TGCWConfigModel, type TGCWEnv } from '#src/types';
import { type TPostLink } from '#src/types';
import { type TGetComicsModel, type TPatchrightModel, type TDownloadModel } from '#src/types';
import Enquirer from 'enquirer';
import c from 'ansi-colors';
import { spinner } from '#src/utils';
import { DEFAULT_ENV, DOWNLOAD_TYPES, DOWNLOADS_DIR, MAX_PAGE_INDEX } from '#src/data.ts';

const BASE_URL = process.env.BASE_URL || '';

export async function browser({
    search,
    prompt,
    config,
    getComicsModel,
    patchrightModel,
    downloadModel,
    env = DEFAULT_ENV,
}: {
    search: string,
    prompt: typeof Enquirer.prompt,
    config: TGCWConfigModel,
    getComicsModel: TGetComicsModel,
    patchrightModel: TPatchrightModel,
    downloadModel: TDownloadModel,
    env?: TGCWEnv,
}){

    const browser = await patchrightModel.createBrowser();

    try {

        const stop1 = spinner(`Searching for: ${search}...`);
        const pageURLs = Array.from({ length: MAX_PAGE_INDEX }, (_, i) =>
            `${BASE_URL}/page/${i + 1}/?s=${encodeURIComponent(search)}`
        );
        const pageResults = await Promise.all(pageURLs.map(url => getComicsModel.getPostLinksFromPage(browser, url)));
        const postLinks: TPostLink[] = [];
        for (const result of pageResults) {
            if (result.length === 0) break;
            postLinks.push(...result);
        }
        stop1();
        console.log(c.cyan(`Found ${postLinks.length} page(s) matching the search criteria.`));
        
        const stop2 = spinner('Searching for direct download links...');
        const downloadLinks = (await getComicsModel.getDownloadLinkFromPages(browser, postLinks))
        .filter(Boolean)
        .filter(link => link.downloadLink !== null);
        stop2();
        if (downloadLinks.length === 0) {
            console.log(c.red.bold('No downloadable comic(s) found.'));
            process.exit(0);
        }
        console.log(c.white('*'.repeat(10)));
        downloadLinks.forEach((link, index) => {
            console.log(
                c.cyan(`${index+1}: `) 
                + c.white(link.title)
            );
        });

        console.log(c.white('*'.repeat(10)));
        const { downloadType } = await prompt<{ downloadType: TDownloadType }>({
            type: "select",
            name: "downloadType",
            message: c.cyan("How do you want to download?"),
            choices: [
                { name: DOWNLOAD_TYPES.single, message: c.white("Choose comics (Recommended)") },
                { name: DOWNLOAD_TYPES.bundle, message: c.white("I want them all!") },
            ],
        });

        if (downloadType === DOWNLOAD_TYPES.bundle) {

            await downloadModel.downloadComicBundle({
                postLinks: downloadLinks,
                noRetry: env.noRetry,
                outputDir: (await config.getConfig()).defaultOutputDir || DOWNLOADS_DIR
            });

        } else if (downloadType === DOWNLOAD_TYPES.single) {

            let canDownload = false;

            while (!canDownload) {

                console.log(c.white('*'.repeat(10)));
                const { whichComics } = await prompt<{ whichComics: string }>({
                    type: "input",
                    name: "whichComics",
                    message: c.cyan("Which comic do you want to download? (write them separated by commas)"),
                });

                const comics = whichComics
                .split(',')
                .map(Number)
                .map(i => downloadLinks[i - 1] ?? null)
                .filter(Boolean);

                if (comics.length > 0) {
                    
                    canDownload = true;
                    
                    await downloadModel.downloadComicBundle({
                        postLinks: comics,
                        noRetry: env.noRetry,
                        outputDir: (await config.getConfig()).defaultOutputDir || DOWNLOADS_DIR
                    });

                } else {

                    console.log(c.red.bold(`Comic(s) not in the list. Please try again.`));

                }

            }

        }

    } catch (error) {

        console.error(error);
        return [];

    } finally {

        await browser.close();

    }
}