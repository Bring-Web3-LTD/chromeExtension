import { reverseStr } from "../reverseStr";
import getRelevantDomain from "./getRelevantDomain";

// Registrable-domain quiet record for a url, as '*.<registrable-domain>'. Uses the
// server-sent TLD gate regex (relevantDomains type 'l') through the native matcher:
// searchRegexArray reverses the host, so the 'l' regex captures the reversed registrable
// domain (reversed suffix + the label before it) — we just un-reverse it. Returns null
// when the TLD isn't one we serve retailers on — the caller then skips stand-down.
const getStandDownRecord = async (url: string): Promise<string | null> => {
    const { matched, match } = await getRelevantDomain(url, 'l');
    if (!matched) return null;

    const registrableRev = Array.isArray(match) ? match[match.length - 1] : match; // capture group 1
    if (!registrableRev) return null;

    return `*.${reverseStr(registrableRev)}`;
};

export default getStandDownRecord;
