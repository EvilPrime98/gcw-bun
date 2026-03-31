import { Command } from "commander";
import { api } from '#src/controllers/api/api.ts';
import { browser } from '#src/controllers/browser/browser.ts';
import Enquirer from "enquirer";
import { type TDownloadModel, type TGCWOption, type TGetComicsApiModel, type TGetComicsModel, type TPatchrightModel } from "#src/types.ts";
import c from "ansi-colors";
import { gwcOptions, gcwArguments } from "#src/data.ts";
import { gcwConfigModel } from "./models/gcwConfigModel";

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

    gwcOptions.forEach((option) => {
        program.option(
            `-${option.short}, --${option.long} ${'argument' in option ? `${option.argument}` : ''}`,
            option.description,
            'default' in option ? option.default : undefined
        );
    });

    gcwArguments.forEach((argument) => {
        program.argument(argument.value, argument.description);
    });

    program.action(async (
        search: string,
        options: Record<TGCWOption, string | boolean>
    ) => {

        const config = (options.config)
        ? await gcwConfigModel(options.config.toString()).init()
        : await gcwConfigModel().init();

        if (options.defaultoutput) {
            const outputDir = options.defaultoutput;
            console.log(c.cyan(`gcw: Default output directory set to ${outputDir}.`));
            await config.setConfig('defaultOutputDir', outputDir);
            process.exit(0);
        }

        if (options.showconfig === true) {
            console.log(c.cyan(`gcw: You can edit the configuration file manually in ${config.configPath}`));
            console.log(c.cyan(`\n${JSON.stringify(await config.getConfig(), null, 4)}`));
            process.exit(0);
        }

        if (!search) {
            noSearchOutput();
            return;
        }
        
        if ((!options.browser && !options.api) || options.api === true) {
            
            api({
                search,
                prompt,
                config,
                GetComicsApiModel,
                DownloadModel,
                options: {
                    numofPages: Number(options.pages),
                    exact: Boolean(options.exact),
                    desiredPath: options.output ? String(options.output) : undefined,
                }
            });

        } else if (options.browser === true) {

            console.log(c.red.bold('gcw: This feature is under manteinance and will be available soon.'));
            process.exit(1);
            
            browser({
                search,
                prompt,
                config,
                getComicsModel: GetComicsModel,
                patchrightModel: PatchrightModel,
                downloadModel: DownloadModel,
            });

        }

    });

    return program;

}