import type { Browser } from 'patchright';
import type { binaryAnswer, DOWNLOAD_TYPES, ENV_VARS, FETCH_MODES, gwcOptions } from './data';

export type TPostLink = {
    id?: number;
    title: string;
    link: string;
}

export type TDownloadLink = {
    title: string;
    downloadLink: string|null;
}

export type TBinaryAnswer = keyof typeof binaryAnswer;

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
        noRetry,
        outputDir
    }:{
        link: TDownloadLink,
        rowIndex?: number,
        totalRows?: number,
        noRetry?: boolean,
        outputDir: string
    }) => Promise<void>
    downloadComicBundle: ({
        postLinks, 
        noRetry,
        outputDir
    }:{
        postLinks: TDownloadLink[],
        noRetry?: boolean,
        outputDir: string
    }) => Promise<void>
}

export type TGCWEnv = {
    verbose: boolean,
    noRetry: boolean,
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
    /**
     * The desired output directory.
     */
    desiredPath?: string,
}

export type TGCWEnvVars = keyof typeof ENV_VARS;

export type TGCWConfigModel = {
    configPath: string,
    init: () => Promise<TGCWConfigModel>,
    setConfig: (key: keyof TGCWConfigJSON, value: any) => Promise<any>,
    getConfig: () => Promise<TGCWConfigJSON>,
}

export type TGCWConfigJSON = {
    /**
     * Default directory to download comics to. If not set, the current working directory is used.
     */
    defaultOutputDir: string,
    downloadHistory: (TDownloadLink['title'])[]
}

export type TGCWOptionFactory = {
    short: string,
    long: string,
    argument?: string,
    description: string,
    default?: string,
}

export type TGCWArgumentFactory = {
    value: string,
    description: string,
}

export type TGCWOption = (typeof gwcOptions)[number]['long'];