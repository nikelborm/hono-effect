import { Effect, Layer, Logger, ManagedRuntime, Option } from 'effect';
import { Hono } from 'hono';
import { EnvType } from './config.js';
import { OptionalDevToolsLayer } from './devtools.js';

const app = new Hono();

export const appLayer = Layer.mergeAll(
  Logger.pretty,
  Layer.scopedDiscard(Effect.annotateLogsScoped('context', 'server')),
  OptionalDevToolsLayer
).pipe(Layer.provideMerge(EnvType.Live));

export const runtime = ManagedRuntime.make(appLayer);

app.get('/endpoint1', (c) => {
  return c.text('Hello Hono from endpoint 1!');
});

app.get('/endpoint2', (c) => {
  return c.text('Hello Hono from endpoint 1!');
});

app.use(async (c, next) => {
  const { method, path } = c.req;
  await runtime.runPromise(
    Effect.gen(function* () {
      yield* Effect.logInfo(`[Request] ${method} ${path}`);
      yield* Effect.promise(next);
      yield* Effect.logInfo(`[Response] ${method} ${path}`);
    })
  );
});

app.get('/endpoint3', async (c, next) =>
  Effect.gen(function* () {
    yield* Effect.log('inside endpoint handler');
    yield* Effect.sleep(993 /* milliseconds */);
    return yield* Effect.succeed(c.text('Hello Hono from endpoint 1!\n'));
  }).pipe(
    Effect.withSpan('endpoint3'),
    Effect.annotateLogs({
      context: 'super-server',
      newContext: 'yay',
    }),
    runtime.runPromise
  )
);

const mainprogram = Effect.gen(function* () {
  yield* Effect.log('Hello from effect');
});

await runtime.runPromise(mainprogram);
// await runtime.dispose();

export default {
  port: 3001,
  fetch: app.fetch,
};
