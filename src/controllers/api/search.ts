import { MAX_PAGE_INDEX } from "#src/data.ts";
import type { TgcwOptions, TGetComicsApiModel, TPostLink } from "#src/types.ts";
import { spinner } from "#src/utils.ts";

/**
 * Initial search for pages that match the search term.
 * @param search The search term to be used.
 * @param GetComicsApiModel A valid instance of TGetComicsApiModel.
 * @param options Optional options. Includes "numofPages", "exact".
 * @returns 
 */
export async function initialSearch(
    search: string,
    GetComicsApiModel: TGetComicsApiModel,
    options?: TgcwOptions,
){
    const stop = spinner(`Searching for: ${search}...`);
    const postLinks = await GetComicsApiModel.getPostLinks({ 
        search, 
        page: Array.from({ length: options?.numofPages ?? MAX_PAGE_INDEX }, (_, i) => i + 1),
    });
    stop();
    return (options?.exact === true)
    ? postLinks.filter((postLink) => postLink.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
    : postLinks;
}

/**
 * Searches for direct download links for the given post links.
 * @param postLinks An array of TPostLink objects.
 * @param GetComicsApiModel A valid instance of TGetComicsApiModel.
 * @param options Optional options.
 * @returns 
 */
export async function searchForDownloadLinks(
    postLinks: TPostLink[],
    GetComicsApiModel: TGetComicsApiModel,
    //options?: TgcwOptions,
){
    const stop2 = spinner('Searching for direct download links...');
    const downloadLinks = await GetComicsApiModel.getDownloadLinksFromPosts(postLinks);
    stop2();
    return downloadLinks;
}

/**
 * Searches for the weekly list of comics.
 * @param GetComicsApiModel A valid instance of TGetComicsApiModel.
 * @returns 
 */
export async function searchForWeeklyListLinks(
    GetComicsApiModel: TGetComicsApiModel,
    group?: string,
){
    const stop = spinner(`Searching for weekly list...`);
    const postLinks = await GetComicsApiModel.getWeeklyListPosts(group);
    stop();
    return postLinks;
}