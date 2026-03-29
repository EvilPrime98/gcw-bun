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
        description: 'Use the GC wp-json API to fetch and download comics.' 
    },
    
    { 
        short: 'b', 
        long: 'browser', 
        description: 'Use patched Chrome to fetch and download comics.' 
    },
    
    { 
        short: 'p', 
        long: 'pages',
        argument: '<numberOfPages>',
        description: 'Limit the number of pages to fetch from.', 
        default: MAX_PAGE_INDEX.toString() 
    },
    
    { 
        short: 'E', 
        long: 'exact', 
        description: 'Search for exact match.' 
    },

    { 
        short: 'o', 
        long: 'output',
        argument: '<outputDir>',
        description: 'Set the output directory for downloaded comics.' 
    },

] as const satisfies TGCWOptionFactory[];

export const gcwArguments: TGCWArgumentFactory[] = [
    { value: '[search]', description: 'Search term to be used.' },
]