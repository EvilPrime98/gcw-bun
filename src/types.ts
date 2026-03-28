import type { Browser } from 'patchright';
import path from 'path';

export const DOWNLOADS_DIR = path.join(process.cwd());

export const CUSTOM_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export const REQUEST_DELAY = 3 * 1000;

export const MAX_PAGE_INDEX = 10;

export type TPostLink = {
    id?: number;
    title: string;
    link: string;
}

export type TDownloadLink = {
    title: string;
    downloadLink: string|null;
}

export const binaryAnswer = {
    'yes': 'yes',
    'no': 'no'
}

export type TBinaryAnswer = keyof typeof binaryAnswer;

export const DOWNLOAD_TYPES = {
    single: 'single',
    bundle: 'bundle',
}

export const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export type TDownloadType = keyof typeof DOWNLOAD_TYPES;

export type TGetComicsModel = {
    getDownloadLinkFromPage: (browser: Browser, targetURL: string) => Promise<string | null>,
    getPostLinksFromPage: (browser: Browser, targetURL: string) => Promise<TPostLink[]>,
    getDownloadLinkFromPages: (browser: Browser, postLinks: TPostLink[], limit?: number) => Promise<TDownloadLink[]>,
}

export type TGetComicsApiModel = {
    getPostLinks: (params: { search: string; page?: number|number[]; perPage?: number }) => Promise<TPostLink[]>,
    getDownloadLinkFromPost: (postId: number) => Promise<string | null>,
    getDownloadLinksFromPosts: (postLinks: TPostLink[], limit?: number) => Promise<TDownloadLink[]>,
}

export type TPatchrightModel = {
    createBrowser: () => Promise<Browser>
}

export type TDownloadModel = {
    downloadComic: ({
        link, 
        rowIndex, 
        totalRows,
        noRetry
    }:{
        link: TDownloadLink,
        rowIndex?: number,
        totalRows?: number,
        noRetry?: boolean
    }) => Promise<void>
    downloadComicBundle: ({
        postLinks, 
        noRetry
    }:{
        postLinks: TDownloadLink[],
        noRetry?: boolean
    }) => Promise<void>
}

export type TGCWEnv = {
    verbose: boolean,
    noRetry: boolean,
}

export const DEFAULT_ENV = {
    verbose: false,
    noRetry: true,
}

export const FETCH_MODES = {
    api: 'api',
    browser: 'browser',
}

export type TFetchMode = keyof typeof FETCH_MODES;

export type WPPost = {
    id: number;
    title: { rendered: string };
    link: string;
    content: { rendered: string };
};

export type TgcwOptions = {
    /**
     * The number of pages to fetch from. Default is 10.
     */
    numofPages?: number,
    /**
     * If enabled, only pages that match the search term exactly are returned. Default is false.
     */
    exact?: boolean,
}

export const ENV_VARS: Record<string, string> = {
    API_URL: 'API_URL',
    BASE_URL: 'BASE_URL',
}

export type TGCWEnvVars = keyof typeof ENV_VARS;