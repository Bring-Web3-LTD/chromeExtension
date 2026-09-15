// RFC 4122 UUID check (v1-v8). Replaces `validate` from the uuid package.
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const isUuid = (value: unknown): value is string =>
    typeof value === 'string' && UUID_REGEX.test(value)

export default isUuid
