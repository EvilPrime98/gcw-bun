import type { Browser } from "patchright";
import type { TDownloadLink, TGetComicsModel, TPostLink } from "#src/types";
import pLimit from "p-limit";

export class GetComicsModel implements TGetComicsModel {
    
    getDownloadLinkFromPage = async (
        browser: Browser,
        targetURL: string
    ): Promise<string | null> => {
        const page = await browser.newPage();
        await page.goto(targetURL, { waitUntil: 'domcontentloaded' });
        const link = await page.evaluate(() => {
            const $content = document.querySelector('.page-container.wrapper > .page-contents > .post-body > .post-contents');
            //@ts-expect-error: browser context
            const $downloadLink = $content.querySelector('a[title="DOWNLOAD NOW"]');
            //@ts-expect-error: browser context
            return $downloadLink?.href;
        }) as string | undefined;
        await page.close();
        return !link ? null : link;
    }

    getPostLinksFromPage = async (
        browser: Browser,
        targetURL: string
    ): Promise<TPostLink[]> => {
        const page = await browser.newPage();
        await page.goto(targetURL, { waitUntil: 'domcontentloaded' });
        const links = await page.evaluate(() => {
            const $posts = Array.from(document.querySelectorAll('.post-list-posts > article'));
            return $posts.map(($post) => {
                return {
                    title: $post.querySelector('.post-title > a')?.textContent,
                    //@ts-expect-error: browser context
                    link: $post.querySelector('.post-title > a')?.href
                }
            });
        }) as TPostLink[];
        await page.close();
        return links;
    }

    getDownloadLinkFromPages = async (
        browser: Browser,
        postLinks: TPostLink[],
        limit: number = 5
    ): Promise<TDownloadLink[]> => {
        const limitInstance = pLimit(limit);
        return await Promise.all(
            postLinks.map((postLink) =>
                limitInstance(async () => {
                    try {
                        const link = await this.getDownloadLinkFromPage(browser, postLink.link);
                        return { title: postLink.title, downloadLink: link } satisfies TDownloadLink;
                    } catch (err) {
                        return { title: postLink.title, downloadLink: null } satisfies TDownloadLink;
                    }
                })
            )
        ) as TDownloadLink[];
    }

}
