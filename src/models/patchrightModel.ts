import type { TPatchrightModel } from '#src/types.ts';
import { chromium } from 'patchright';

export class PatchrightModel implements TPatchrightModel {

    createBrowser = async () => {
        return chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-features=VizDisplayCompositor'
            ]
        });
    }
    
}