import type { TGCWArgumentFactory, TGCWOptionFactory } from "#src/types.ts";
import path from "path";

export const binaryAnswer = {
    'yes': 'yes',
    'no': 'no'
}

export const DOWNLOAD_TYPES = {
    single: 'single',
    bundle: 'bundle',
}

export const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export const DOWNLOADS_DIR = path.join(process.cwd());

export const CUSTOM_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export const REQUEST_DELAY = 3 * 1000;

export const MAX_PAGE_INDEX = 10;

export const DEFAULT_ENV = {
    verbose: false,
    noRetry: true,
}

export const FETCH_MODES = {
    api: 'api',
    browser: 'browser',
}

export const ENV_VARS: Record<string, string> = {
    API_URL: 'API_URL',
    BASE_URL: 'BASE_URL',
}

export const gwcOptions = [
    
    { 
        short: 'a', 
        long: 'api', 
        description: 'use the GC wp-json API to fetch and download comics.' 
    },
    
    { 
        short: 'b', 
        long: 'browser', 
        description: 'use patched Chrome to fetch and download comics.' 
    },
    
    { 
        short: 'p', 
        long: 'pages',
        argument: '<numberOfPages>',
        description: 'limit the number of pages to fetch from. Every page contains a maximum of 10 element(s).',
        default: MAX_PAGE_INDEX.toString() 
    },
    
    { 
        short: 'E', 
        long: 'exact', 
        description: 'search for exact match.' 
    },

    { 
        short: 'o', 
        long: 'output',
        argument: '<outputDir>',
        description: `set the output directory for downloaded comics. If not set, the current working directory is used.`
    },

    {
        short: 'C',
        long: 'showconfig',
        description: `display the current configuration`
    }

] as const satisfies TGCWOptionFactory[];

export const gcwArguments: TGCWArgumentFactory[] = [
    { value: '[search]', description: 'Search term to be used.' },
]