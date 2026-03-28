import type { TDownloadLink, TDownloadModel } from '#src/types';
import { DOWNLOADS_DIR, CUSTOM_USER_AGENT, REQUEST_DELAY } from '#src/types';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import c from "ansi-colors";
import { spinner } from '#src/utils.ts';

let stdoutLock = Promise.resolve();

export class DownloadModel implements TDownloadModel {

    downloadComic = async ({
        link,
        rowIndex = 0,
        totalRows = 1,
        noRetry = false
    }: {
        link: TDownloadLink,
        rowIndex?: number,
        totalRows?: number,
        noRetry?: boolean
    }) => {

        if (!link.downloadLink) return;

        const stop1 = spinner(`Preparing to download ${link.title}...`);
        const isParallel = totalRows > 1;

        if (!isParallel) {
            console.log(c.white('*'.repeat(10)));
            console.log(c.cyan(`Downloading ${link.title}...`));
            process.stdout.write('\n');
        }

        const writeProgress = (text: string) => {
            stdoutLock = stdoutLock.then(() => new Promise<void>(resolve => {
                const linesUp = totalRows - 1 - rowIndex;
                const up = linesUp > 0 ? `\x1b[${linesUp}A` : '';
                const down = linesUp > 0 ? `\x1b[${linesUp}B` : '';
                process.stdout.write(`${up}\x1b[2K\r${text}${down}`, () => resolve());
            }));
        };

        try {

            if (isParallel) {
                stop1();
                process.stdout.write('\n');
            }
            let response: Response;
            while (true) {
                response = await fetch(link.downloadLink, {
                    method: 'GET',
                    headers: {
                        'User-Agent': CUSTOM_USER_AGENT,
                        'content-type': 'application/octet-stream'
                    }
                });
                if (response.ok) break;
                if (noRetry === true) throw new Error(`HTTP ${response.status}`);
                writeProgress(c.yellow(`↻ ${link.title.slice(0, 20).padEnd(20)} → HTTP ${response.status}, retrying in ${REQUEST_DELAY / 1000}s...`));
                await new Promise(r => setTimeout(r, REQUEST_DELAY));
            }
            if (!isParallel) {
                stop1();
                process.stdout.write('\n');
            }

            const filename = decodeURIComponent(response.url.split('/').pop()!);
            const dest = join(DOWNLOADS_DIR, filename);
            const total = Number(response.headers.get('content-length') ?? 0);
            const totalMB = (total / 1024 / 1024).toFixed(1);

            await mkdir(DOWNLOADS_DIR, { recursive: true });

            const reader = response.body!.getReader();
            const fileStream = createWriteStream(dest);
            let received = 0;

            await new Promise<void>((resolve, reject) => {
                fileStream.on('error', reject);
                const pump = async () => {
                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) { fileStream.end(); break; }
                            received += value.length;
                            const receivedMB = (received / 1024 / 1024).toFixed(1);
                            const percent = total ? Math.floor((received / total) * 100) : 0;
                            const BAR_WIDTH = 30;
                            const filled = Math.floor((percent / 100) * BAR_WIDTH);
                            const bar = '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled);
                            const label = isParallel
                            ? `${c.cyan(link.title.slice(0, 20).padEnd(20))} [${bar}] ${receivedMB}/${totalMB} MB (${percent}%)`
                            : `[${bar}] ${receivedMB}/${totalMB} MB (${percent}%)`;
                            writeProgress(label);
                            if (!fileStream.write(value)) {
                                await new Promise(r => fileStream.once('drain', r));
                            }
                        }
                        fileStream.once('finish', resolve);
                    } catch (err) { reject(err); }
                };
                pump();
            });

            writeProgress(c.green(`✓ ${link.title.slice(0, 20).padEnd(20)} → ${filename}`));
            if (!isParallel) process.stdout.write('\n');

        } catch (error) {

            if (!isParallel) stop1();
            writeProgress(c.red(`✗ ${link.title.slice(0, 20).padEnd(20)} → Failed to download. Skipping...`));
            if (!isParallel) process.stdout.write('\n');

        }

    }

    downloadComicBundle = async ({
        postLinks,
        noRetry = false
    }: {
        postLinks: TDownloadLink[],
        noRetry?: boolean
    }) => {

        for (let i = 0; i < postLinks.length; i++) process.stdout.write('\n');
        await Promise.all(postLinks.map((comic, i) =>
            this.downloadComic({
                link: comic,
                rowIndex: i,
                totalRows: postLinks.length,
                noRetry
            })
        ));

        process.stdout.write('\n'.repeat(postLinks.length + 1));
    }

}
