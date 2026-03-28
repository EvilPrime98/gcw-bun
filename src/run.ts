#!/usr/bin/env tsx
import { config } from 'dotenv';
import Enquirer from "enquirer";
import { gcw } from "#src/gcw.ts";
import { DownloadModel} from '#src/models/downloadModel.ts';
import { GetComicsModel } from '#models/getComicsModel';
import { PatchrightModel } from "#models/patchrightModel"; 
import { GetComicsApiModel } from "#models/getComicsApiModel";
import { ENV_VARS } from './types';
import c from 'ansi-colors';

(async function (){

    config({ quiet: true, override: true });

    const missingVars = Object.keys(ENV_VARS).filter(key => !(key in process.env));
    if (missingVars.length > 0) {
        console.log(c.red.bold('gcw: Please set the following environment variables:'));
        missingVars.forEach(key => {
            console.log(c.red.bold(`gcw: MISSING - ${key} (${ENV_VARS[key]})`));
        });
        process.exit(1);
    }
    
    const { prompt } = Enquirer;
    const args = process.argv.slice(2);

    gcw({ 
        prompt,
        GetComicsApiModel: new GetComicsApiModel(),
        DownloadModel: new DownloadModel(),
        PatchrightModel: new PatchrightModel(),
        GetComicsModel: new GetComicsModel(),
    }).parse(
        args,
        { from: 'user' }
    );

})();