import { Command } from "commander";
import { api } from '#controllers/api';
import { browser } from '#controllers/browser';
import Enquirer from "enquirer";
import { MAX_PAGE_INDEX, type TDownloadModel, type TGetComicsApiModel, type TGetComicsModel, type TPatchrightModel } from "#src/types.ts";
import c from "ansi-colors";

export function gcw({
    prompt,
    GetComicsApiModel,
    DownloadModel,
    PatchrightModel,
    GetComicsModel,
}: {
    prompt: typeof Enquirer.prompt,
    GetComicsApiModel: TGetComicsApiModel,
    DownloadModel: TDownloadModel,
    PatchrightModel: TPatchrightModel,
    GetComicsModel: TGetComicsModel,
}) {

    const program = new Command('gcw');

    function noSearchOutput() {
        console.log(c.red.bold('gcw: Please provide a search term.'));
        console.log(c.red.bold('gcw: Usage: gcw "<search term>"'));
        process.exit(1);
    }

    program
    .option('-a, --api', 'Use the GC wp-json API to fetch and download comics.')
    .option('-b, --browser', 'Use patched Chrome to fetch and download comics.')
    .option('-p, --pages <numberofpages>', 'Limit the number of pages to fetch from. Default is 10.', MAX_PAGE_INDEX.toString())
    .option('-E, --exact', 'Search for exact match.')
    .argument('[search]', 'Search term to be used.')
    .action((
        search: string, 
        options: { 
            api?: boolean; 
            browser?: boolean;
            pages?: number;
            exact?: boolean;
        }
    ) => {
        
        if (!search) {
            noSearchOutput();
            return;
        }

        if (options.api) {
            
            api({
                search,
                prompt,
                GetComicsApiModel,
                DownloadModel,
                options: {
                    numofPages: options.pages,
                    exact: options.exact,
                }
            });

        } else if (options.browser) {

            console.log(c.red.bold('gcw: This feature is under manteinance and will be available soon.'));
            process.exit(1);
            
            browser({
                search,
                prompt,
                getComicsModel: GetComicsModel,
                patchrightModel: PatchrightModel,
                downloadModel: DownloadModel,
            });

        } else {
        
            console.log(c.yellow('gcw: Please specify --api or --browser.'));
            process.exit(1);

        }

    });

    return program;

}