import storage from "../storage/storage";

const canSaveToMemory = async () => {
    const testKey = 'extensionMemoryTest';
    const testValue = Date.now();

    try {
        // Try to save to localStorage
        await storage.set(testKey, testValue);

        // Try to read it back
        const retrieved = await storage.get(testKey);

        // Return true if we successfully saved and retrieved
        return retrieved === testValue;
    } catch (error) {
        return false;
    }
}

export default canSaveToMemory;