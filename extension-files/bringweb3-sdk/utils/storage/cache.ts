interface CacheEntry {
    value: any;
}

class StorageCache {
    private cache = new Map<string, CacheEntry>();

    get(key: string): any | null {
        const entry = this.cache.get(key);
        if (!entry) return null;
        return entry.value;
    }

    set(key: string, value: any): void {
        this.cache.set(key, { value });
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

export default StorageCache;