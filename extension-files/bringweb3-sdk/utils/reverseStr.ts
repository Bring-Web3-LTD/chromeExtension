/**
 * Reverse the characters of a string.
 *
 * @param str - The string to reverse.
 * @returns The reversed string.
 */
export const reverseStr = (str: string): string => {
    return str.split('').reverse().join('');
}
