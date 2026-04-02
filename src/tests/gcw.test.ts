import { expect, test, describe, mock, beforeEach, spyOn } from "bun:test";

const mockConfig: any = {
    configPath: '/mock/path/config.json',
    init: mock(async function () { return mockConfig; }),
    setConfig: mock(async () => mockConfig),
    getConfig: mock(async () => ({ defaultOutputDir: '', downloadHistory: [] })),
};

const mockGcwConfigModel = mock((_?: string) => mockConfig);

mock.module('#src/models/gcwConfigModel', () => ({
    gcwConfigModel: mockGcwConfigModel,
}));

const mockApiCall = mock(async (_args: any) => {});

mock.module('#src/controllers/api/api.ts', () => ({
    api: mockApiCall,
}));

const mockBrowserCall = mock(async (_args: any) => {});

mock.module('#src/controllers/browser/browser.ts', () => ({
    browser: mockBrowserCall,
}));

import { gcw } from "#src/gcw.ts";

async function expectsProcessExit(promise: Promise<unknown>, code: number): Promise<void> {
    let error: Error | undefined;
    try { await promise; } catch (e) { error = e as Error; }
    expect(error?.message).toBe(`process.exit:${code}`);
}

const mockExitFn = mock((code?: number) => {
    throw new Error(`process.exit:${code}`);
});
process.exit = mockExitFn as never;

const mockDeps = {
    prompt: mock(async () => ({})) as any,
    GetComicsApiModel: {} as any,
    DownloadModel: {} as any,
    PatchrightModel: {} as any,
    GetComicsModel: {} as any,
};

function createProgram() {
    return gcw(mockDeps);
}


describe('gcw', () => {

    beforeEach(() => {
        mockApiCall.mockClear();
        mockBrowserCall.mockClear();
        mockGcwConfigModel.mockClear();
        mockConfig.setConfig.mockClear();
        mockConfig.getConfig.mockClear();
        mockExitFn.mockClear();
    });

    test('returns a Commander program named "gcw"', () => {
        const program = createProgram();
        expect(program.name()).toBe('gcw');
    });

    describe('no search term', () => {

        test('prints usage error and exits with code 1', async () => {
            const logSpy = spyOn(console, 'log').mockImplementation(() => {});
            const program = createProgram();
            await expectsProcessExit(program.parseAsync([], { from: 'user' }), 1);
            expect(logSpy).toHaveBeenCalled();
            logSpy.mockRestore();
        });

        test('does not call api() or browser()', async () => {
            const logSpy = spyOn(console, 'log').mockImplementation(() => {});
            const program = createProgram();
            await program.parseAsync([], { from: 'user' }).catch(() => {});
            expect(mockApiCall).not.toHaveBeenCalled();
            expect(mockBrowserCall).not.toHaveBeenCalled();
            logSpy.mockRestore();
        });

    });

    describe('--showconfig / -S', () => {

        test('-S displays config and exits with 0', async () => {
            const logSpy = spyOn(console, 'log').mockImplementation(() => {});
            const program = createProgram();
            await expectsProcessExit(program.parseAsync(['-S'], { from: 'user' }), 0);
            expect(mockConfig.getConfig).toHaveBeenCalled();
            expect(logSpy).toHaveBeenCalled();
            logSpy.mockRestore();
        });

        test('--showconfig long flag also works', async () => {
            const logSpy = spyOn(console, 'log').mockImplementation(() => {});
            const program = createProgram();
            await expectsProcessExit(program.parseAsync(['--showconfig'], { from: 'user' }), 0);
            logSpy.mockRestore();
        });

        test('does not call api()', async () => {
            const logSpy = spyOn(console, 'log').mockImplementation(() => {});
            const program = createProgram();
            await program.parseAsync(['-S'], { from: 'user' }).catch(() => {});
            expect(mockApiCall).not.toHaveBeenCalled();
            logSpy.mockRestore();
        });

    });

    describe('--defaultoutput / -O', () => {

        test('-O sets defaultOutputDir in config and exits with 0', async () => {
            const logSpy = spyOn(console, 'log').mockImplementation(() => {});
            const program = createProgram();
            await expectsProcessExit(program.parseAsync(['-O', '/my/comics'], { from: 'user' }), 0);
            expect(mockConfig.setConfig).toHaveBeenCalledWith('defaultOutputDir', '/my/comics');
            logSpy.mockRestore();
        });

        test('--defaultoutput long flag also works', async () => {
            const logSpy = spyOn(console, 'log').mockImplementation(() => {});
            const program = createProgram();
            await expectsProcessExit(program.parseAsync(['--defaultoutput', '/another/dir'], { from: 'user' }), 0);
            expect(mockConfig.setConfig).toHaveBeenCalledWith('defaultOutputDir', '/another/dir');
            logSpy.mockRestore();
        });

        test('does not call api()', async () => {
            const logSpy = spyOn(console, 'log').mockImplementation(() => {});
            const program = createProgram();
            await program.parseAsync(['-O', '/path'], { from: 'user' }).catch(() => {});
            expect(mockApiCall).not.toHaveBeenCalled();
            logSpy.mockRestore();
        });

    });

    describe('default mode (no --api or --browser flag)', () => {

        test('calls api() with the search term', async () => {
            const program = createProgram();
            await program.parseAsync(['batman'], { from: 'user' });
            expect(mockApiCall).toHaveBeenCalledTimes(1);
            expect(mockApiCall.mock.calls[0][0].search).toBe('batman');
        });

        test('does not call browser()', async () => {
            const program = createProgram();
            await program.parseAsync(['batman'], { from: 'user' });
            expect(mockBrowserCall).not.toHaveBeenCalled();
        });

    });

    describe('--api / -a', () => {

        test('--api calls api() with the search term', async () => {
            const program = createProgram();
            await program.parseAsync(['batman', '--api'], { from: 'user' });
            expect(mockApiCall).toHaveBeenCalledTimes(1);
            expect(mockApiCall.mock.calls[0][0].search).toBe('batman');
        });

        test('-a short flag also works', async () => {
            const program = createProgram();
            await program.parseAsync(['batman', '-a'], { from: 'user' });
            expect(mockApiCall).toHaveBeenCalledTimes(1);
        });

        test('passes numofPages as 10 by default', async () => {
            const program = createProgram();
            await program.parseAsync(['batman', '--api'], { from: 'user' });
            expect(mockApiCall.mock.calls[0][0].options.numofPages).toBe(10);
        });

        test('--pages limits the number of pages', async () => {
            const program = createProgram();
            await program.parseAsync(['batman', '--api', '--pages', '3'], { from: 'user' });
            expect(mockApiCall.mock.calls[0][0].options.numofPages).toBe(3);
        });

        test('-p short flag also limits pages', async () => {
            const program = createProgram();
            await program.parseAsync(['batman', '-a', '-p', '2'], { from: 'user' });
            expect(mockApiCall.mock.calls[0][0].options.numofPages).toBe(2);
        });

        test('exact is false by default', async () => {
            const program = createProgram();
            await program.parseAsync(['batman', '--api'], { from: 'user' });
            expect(mockApiCall.mock.calls[0][0].options.exact).toBe(false);
        });

        test('--exact enables exact-match search', async () => {
            const program = createProgram();
            await program.parseAsync(['batman', '--api', '--exact'], { from: 'user' });
            expect(mockApiCall.mock.calls[0][0].options.exact).toBe(true);
        });

        test('-E short flag enables exact-match search', async () => {
            const program = createProgram();
            await program.parseAsync(['batman', '-a', '-E'], { from: 'user' });
            expect(mockApiCall.mock.calls[0][0].options.exact).toBe(true);
        });

        test('desiredPath is undefined when --output is not set', async () => {
            const program = createProgram();
            await program.parseAsync(['batman', '--api'], { from: 'user' });
            expect(mockApiCall.mock.calls[0][0].options.desiredPath).toBeUndefined();
        });

        test('--output sets desiredPath', async () => {
            const program = createProgram();
            await program.parseAsync(['batman', '--api', '--output', '/downloads/comics'], { from: 'user' });
            expect(mockApiCall.mock.calls[0][0].options.desiredPath).toBe('/downloads/comics');
        });

        test('-o short flag sets desiredPath', async () => {
            const program = createProgram();
            await program.parseAsync(['batman', '-a', '-o', '/tmp/comics'], { from: 'user' });
            expect(mockApiCall.mock.calls[0][0].options.desiredPath).toBe('/tmp/comics');
        });

    });

    describe('--browser / -b', () => {

        test('--browser logs a maintenance message and exits with 1', async () => {
            const logSpy = spyOn(console, 'log').mockImplementation(() => {});
            const program = createProgram();
            await expectsProcessExit(program.parseAsync(['batman', '--browser'], { from: 'user' }), 1);
            expect(logSpy).toHaveBeenCalled();
            logSpy.mockRestore();
        });

        test('-b short flag also triggers maintenance exit', async () => {
            const logSpy = spyOn(console, 'log').mockImplementation(() => {});
            const program = createProgram();
            await expectsProcessExit(program.parseAsync(['batman', '-b'], { from: 'user' }), 1);
            logSpy.mockRestore();
        });

        test('does not call api()', async () => {
            const logSpy = spyOn(console, 'log').mockImplementation(() => {});
            const program = createProgram();
            await program.parseAsync(['batman', '--browser'], { from: 'user' }).catch(() => {});
            expect(mockApiCall).not.toHaveBeenCalled();
            logSpy.mockRestore();
        });

    });

    describe('--weeklylist / -w', () => {

        test('-w calls api() with weeklyList: true', async () => {
            const program = createProgram();
            await program.parseAsync(['-w'], { from: 'user' });
            expect(mockApiCall).toHaveBeenCalledTimes(1);
            expect(mockApiCall.mock.calls[0][0].options.weeklyList).toBe(true);
        });

        test('--weeklylist long flag also works', async () => {
            const program = createProgram();
            await program.parseAsync(['--weeklylist'], { from: 'user' });
            expect(mockApiCall).toHaveBeenCalledTimes(1);
            expect(mockApiCall.mock.calls[0][0].options.weeklyList).toBe(true);
        });

        test('-w works without a search term', async () => {
            const program = createProgram();
            await program.parseAsync(['-w'], { from: 'user' });
            expect(mockExitFn).not.toHaveBeenCalled();
        });

        test('-w <group> passes weeklyListGroup to api()', async () => {
            const program = createProgram();
            await program.parseAsync(['-w', 'dc'], { from: 'user' });
            expect(mockApiCall.mock.calls[0][0].options.weeklyListGroup).toBe('dc');
        });

        test('--weeklylist <group> long flag also passes weeklyListGroup', async () => {
            const program = createProgram();
            await program.parseAsync(['--weeklylist', 'marvel'], { from: 'user' });
            expect(mockApiCall.mock.calls[0][0].options.weeklyListGroup).toBe('marvel');
        });

        test('-w does not call browser()', async () => {
            const program = createProgram();
            await program.parseAsync(['-w'], { from: 'user' });
            expect(mockBrowserCall).not.toHaveBeenCalled();
        });

    });

    describe('--config / -c', () => {

        test('--config initializes gcwConfigModel with the specified path', async () => {
            const program = createProgram();
            await program.parseAsync(['batman', '--config', '/custom/gcw.json'], { from: 'user' });
            expect(mockGcwConfigModel).toHaveBeenCalledWith('/custom/gcw.json');
        });

        test('-c short flag also passes the config path', async () => {
            const program = createProgram();
            await program.parseAsync(['batman', '-c', '/other/config.json'], { from: 'user' });
            expect(mockGcwConfigModel).toHaveBeenCalledWith('/other/config.json');
        });

        test('gcwConfigModel is called with no args when --config is omitted', async () => {
            const program = createProgram();
            await program.parseAsync(['batman'], { from: 'user' });
            expect(mockGcwConfigModel).toHaveBeenCalledWith();
        });

    });
    
});
