import { join } from "path";
import os from "os";
import type { TGCWConfigJSON, TGCWConfigModel } from "#src/types.ts";

export function gcwConfigModel(
    desiredConfigPath?: string
): TGCWConfigModel {

    const configPath = desiredConfigPath || join(os.homedir(), ".config", "gcw", "config.json");

    const buildConfigContent = (): TGCWConfigJSON => {
        return {
            defaultOutputDir: '',
            downloadHistory: []
        };
    }

    const config = {

        configPath,
        
        init: async () => {
            if (!(await Bun.file(configPath).exists())) {
                console.log('gcw: Config file not found. Creating...');
                await Bun.write(configPath, JSON.stringify(buildConfigContent(), null, 4));
            }
            return config;
        },
        
        setConfig: async (
           key: keyof TGCWConfigJSON,
           value: TGCWConfigJSON[keyof TGCWConfigJSON]
        ): Promise<any> => {
            const currConfig: TGCWConfigJSON = await Bun.file(configPath).json();
            //@ts-expect-error
            currConfig[key] = value;
            await Bun.write(configPath, JSON.stringify(currConfig, null, 4));
            return config;
        },

        getConfig: async (): Promise<TGCWConfigJSON> => {
            return await Bun.file(configPath).json();
        }

    };

    return config;

}
