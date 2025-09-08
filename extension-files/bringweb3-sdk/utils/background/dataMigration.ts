import storage from "../storage/storage"
import { v4 as uuidv4, validate } from "uuid";

const CURRENT_MIGRATION_VERSION = 2;

const migrateObject = async (key: string, now: number) => {
    const obj = await storage.get(key);
    if (obj && typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'number' && value > now) {
                obj[key] = [now, value]; // Extend quiet domain to 30 days
            } else {
                delete obj[key]; // Remove expired quiet domains
            }
        }
        await storage.set(key, obj);
    }
}

const runMigration = async () => {
    try {
        const now = Date.now();

        // OPT-OUT MIGRATION
        const optOut = await storage.get('optOut');
        if (optOut && typeof optOut === 'number' && optOut > now) {
            await storage.set('optOut', [now, optOut]); // Extend opt-out to 30 days
        } else {
            await storage.remove('optOut'); // Remove opt-out if it was expired
        }
        // OPT-OUT DOMAINS MIGRATION
        await migrateObject('optOutDomains', now);

        // QUIET DOMAINS MIGRATION
        await migrateObject('quietDomains', now);
        return true;
    } catch (error) {
        return false;
    }
}

const runMigrationTwo = async () => {
    try {
        const quietDomains = await storage.get('quietDomains');
        if (quietDomains && typeof quietDomains === 'object') {
            for (const [key, value] of Object.entries(quietDomains)) {
                if (Array.isArray(value)) {
                    quietDomains[key] = {
                        time: value,
                        phase: 'quiet'
                    };
                }
            }
            await storage.set('quietDomains', quietDomains);
        }

        let id = await storage.get('id');
        if (!validate(id || '')) {
            id = uuidv4();
            await storage.set('id', id);
        }

        return true
    } catch (error) {
        return false;
    }
}

export const checkAndRunMigration = async () => {
    const migrationVersion = await storage.get('migrationVersion') || 0;

    if (migrationVersion < 1) {
        const isSucceed = await runMigration();
        if (isSucceed) await storage.set('migrationVersion', 1);
    }

    if (migrationVersion < CURRENT_MIGRATION_VERSION) {
        const isSucceed = await runMigrationTwo();
        if (isSucceed) await storage.set('migrationVersion', CURRENT_MIGRATION_VERSION);
    }
}