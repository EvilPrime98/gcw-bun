import { ENV_VARS, SPINNER_FRAMES, type TGCWEnvVars } from '#src/types';
import c from "ansi-colors";

/**
 * Returns a string with a maximum length, adding an ellipsis if the string is longer.
 * @param str String to be truncated
 * @param maxLength Maximum length of the string
 * @returns 
 */
export function ellipsis(
    str: string, 
    maxLength: number
) {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + '...';
}

/**
 * Normalizes a search input.
 * @param str Search input to be normalized
 * @returns 
 */
export function normalizeInput(
    str: string
){
    return str
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Displays a spinner with a label. Useful for long-running processes.
 * @param label Message to be displayed next to the spinner
 * @returns A function to stop the spinner
 */
export function spinner(
    label: string
): () => void {
    let i = 0;
    process.stdout.write("\x1b[?25l");
    const id = setInterval(() => {
        process.stdout.write(
            `\r${c.cyan(SPINNER_FRAMES[i++ % SPINNER_FRAMES.length]!)}  ${c.dim(label)}`
        );
    }, 80);
    return () => {
        clearInterval(id);
        process.stdout.write("\r\x1b[2K");
        process.stdout.write("\x1b[?25h");
    };
}

/**
 * Checks if all required environment variables are set.
 * @returns Whether all required environment variables are set.
 */
export function envCheck(): boolean {
    const envValues: Record<TGCWEnvVars, string | undefined> = {
        API_URL: process.env.API_URL,
        BASE_URL: process.env.BASE_URL,
    };
    const missingVars = Object.keys(envValues).filter(key => !envValues[key]);
    if (missingVars.length > 0) {
        console.log(c.red.bold('gcw: Please set the following environment variables:'));
        missingVars.forEach(key => {
            console.log(c.red.bold(`gcw: MISSING - ${key} (${ENV_VARS[key]})`));
        });
        return false;
    }
    return true;
}