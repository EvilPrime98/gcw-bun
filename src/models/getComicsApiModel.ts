import pLimit from 'p-limit';
import type { TDownloadLink, TGetComicsApiModel, TPostLink, WPPost } from '#src/types';
import he from 'he';

const API_URL = process.env.API_URL || '';

export class GetComicsApiModel implements TGetComicsApiModel {

    private parseDownloadLink = (html: string): string | null => {
        const primaryMatch =
            html.match(/<a[^>]+href="([^"]+)"[^>]*title="DOWNLOAD NOW"[^>]*>/i) ??
            html.match(/<a[^>]+title="DOWNLOAD NOW"[^>]*href="([^"]+)"[^>]*>/i);
        if (primaryMatch?.[1]) return primaryMatch[1];
        const fallbackMatch = html.match(/href="(https?:\/\/getcomics\.org\/dlds\/[^"]+)"/i);
        return fallbackMatch?.[1] ?? null;
    }

    private normalizeTitle = (title: string): string => {
        return he.decode(he.decode(title)).trim();
    }

    getPostLinks = async (params: {
        search: string;
        page?: number | number[];
        perPage?: number;
    }): Promise<TPostLink[]> => {
        
        const searchParams = new URLSearchParams({
            search: params.search,
            _fields: 'id,title,link',
            ...(params.perPage ? { per_page: params.perPage.toString() } : {}),
        });

        if (params.page === undefined || typeof params.page === 'number') {
            
            searchParams.set('page', params.page === undefined ? '1' : params.page.toString());
            
            const res = await fetch(`${API_URL}/posts?${searchParams}`, { method: 'GET' });
            
            if (!res.ok) return [];
            
            const posts: WPPost[] = await res.json();
            
            return posts.map(post => ({
                id: post.id,
                title: this.normalizeTitle(post.title.rendered),
                link: post.link,
            }));

        }else if (Array.isArray(params.page)) {

            const postLinks = (await Promise.all(
                
                params.page.map(async page => {
                    const res = await fetch(`${API_URL}/posts?${searchParams}&page=${page}`, { method: 'GET' });
                    if (!res.ok) return [];
                    const posts: WPPost[] = await res.json();
                    return posts.map(post => ({
                        id: post.id,
                        title: this.normalizeTitle(post.title.rendered),
                        link: post.link,
                    }));
                })

            )).flat();

            return postLinks;

        }

        return [];

    }

    getDownloadLinkFromPost = async (
        postId: number
    ): Promise<string | null> => {
        const res = await fetch(`${API_URL}/posts/${postId}?_fields=content`);
        if (!res.ok) return null;
        const post: Pick<WPPost, 'content'> = await res.json();
        return this.parseDownloadLink(post.content.rendered);
    }

    getDownloadLinksFromPosts = async (
        postLinks: TPostLink[],
        limit: number = 5
    ): Promise<TDownloadLink[]> => {
        const limitInstance = pLimit(limit);
        return Promise.all(
            postLinks.map(postLink =>
                limitInstance(async () => {
                    try {
                        const downloadLink = postLink.id
                            ? await this.getDownloadLinkFromPost(postLink.id)
                            : null;
                        return { title: postLink.title, downloadLink } satisfies TDownloadLink;
                    } catch {
                        return { title: postLink.title, downloadLink: null } satisfies TDownloadLink;
                    }
                })
            )
        );
    }

}
