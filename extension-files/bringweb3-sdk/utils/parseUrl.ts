const urlRemoveOptions = ['http://', 'https://', 'www.', 'www1.', 'www2.']

const parseUrl = (url: string) => {
    if (!url) return '';

    for (const key of urlRemoveOptions) {
        if (url.startsWith(key)) {
            url = url.replace(key, '')
        }
    }
    return url;
}

export default parseUrl;