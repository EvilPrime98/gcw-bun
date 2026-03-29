#!/usr/bin/env tsx
import Enquirer from "enquirer";
import { gcw } from "#src/gcw.ts";
import { DownloadModel} from '#src/models/downloadModel.ts';
import { GetComicsModel } from '#models/getComicsModel';
import { PatchrightModel } from "#models/patchrightModel"; 
import { GetComicsApiModel } from "#models/getComicsApiModel";
import { gcwConfigModel } from "#models/gcwConfigModel";
import { envCheck } from "./utils";

(async function (){
    
    if (envCheck() === false) {
        process.exit(1);
    }

    const config = await gcwConfigModel().init();
    const { prompt } = Enquirer;
    const args = process.argv.slice(2);
    
    gcw({ 
        prompt,
        config,
        GetComicsApiModel: new GetComicsApiModel(),
        DownloadModel: new DownloadModel(),
        PatchrightModel: new PatchrightModel(),
        GetComicsModel: new GetComicsModel(),
    }).parse(
        args,
        { from: 'user' }
    );

})();