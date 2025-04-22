# Logger Utility

This logger utility helps control console output based on the environment, ensuring that debug logs don't appear in production.

## Usage

### Import the logger

```typescript
import logger from '@/lib/logger';
```

### Use logger methods instead of console methods

Instead of using `console.log`, `console.error`, etc., use the corresponding logger methods:

```typescript
// Instead of:
console.log('Some debug info', data);

// Use:
logger.log('Some debug info', data);
```

### Available methods

- `logger.log()` - For general logging (only shown in development)
- `logger.error()` - For errors (shown in all environments)
- `logger.warn()` - For warnings (only shown in development)
- `logger.info()` - For information messages (only shown in development)
- `logger.debug()` - For debug messages (only shown in development)
- `logger.group()` - For grouping logs (only shown in development)
- `logger.groupEnd()` - For ending groups (only shown in development)
- `logger.table()` - For tabular data (only shown in development)

## Environment-based behavior

- In development (`NODE_ENV === 'development'`): All logs are shown
- In production: Only errors are shown, other logs are suppressed

## Automatic replacement

You can use the script at `scripts/replace-console-logs.js` to automatically replace all `console.*` calls with their `logger.*` equivalents:

```bash
node scripts/replace-console-logs.js
```

## ESLint Integration

The project includes an ESLint rule to warn about direct `console.log` usage:

```json
"no-console": ["warn", { "allow": ["warn", "error"] }]
```

This will highlight any remaining `console.log` calls in your editor and during builds.

## Benefits

- Cleaner production code without debug logs
- Consistent logging approach across the codebase
- Easy to enable/disable specific log types
- No need to manually remove console logs before deployment
