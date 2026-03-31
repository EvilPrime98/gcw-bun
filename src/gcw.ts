import { Command } from "commander";
import { api } from '#src/controllers/api/api.ts';
import { browser } from '#src/controllers/browser/browser.ts';
import Enquirer from "enquirer";
import { type TDownloadModel, type TGCWConfigModel, type TGCWOption, type TGetComicsApiModel, type TGetComicsModel, type TPatchrightModel } from "#src/types.ts";
import c from "ansi-colors";
import { gwcOptions, gcwArguments } from "#src/data.ts";

export function gcw({
    prompt,
    config,
    GetComicsApiModel,
    DownloadModel,
    PatchrightModel,
    GetComicsModel,
}: {
    prompt: typeof Enquirer.prompt,
    config: TGCWConfigModel,
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

        if (options.defaultoutput) {
            const outputDir = options.defaultoutput;
            console.log(c.cyan(`gcw: Set default output directory to ${outputDir}.`));
            await config.setConfig('defaultOutputDir', outputDir);
            process.exit(0);
        }

        if (options.showconfig) {
            console.log(c.cyan(`gcw: You can edit the configuration file manually in ${config.configPath}`));
            console.log(c.cyan(`\n${JSON.stringify(await config.getConfig(), null, 4)}`));
            process.exit(0);
        }

        if (!search) {
            noSearchOutput();
            return;
        }
        
        if (options.api === true) {
            
            api({
                search,
                prompt,
                config,
                GetComicsApiModel,
                DownloadModel,
                options: {
                    numofPages: Number(options.pages),
                    exact: Boolean(options.exact),
                    desiredPath: String(options.output),
                }
            });

        } else if (options.browser) {

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

        } else {
            console.log(c.yellow('gcw: Please specify --api or --browser.'));
            process.exit(1);
        }

    });

    return program;

}