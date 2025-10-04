import { Effect, Layer, Logger, ManagedRuntime, Option } from 'effect';
import { Hono } from 'hono';
import { EnvType } from './config.js';
import { OptionalDevToolsLayer } from './devtools.js';

const app = new Hono();

export const appLayer = Layer.mergeAll(OptionalDevToolsLayer).pipe(
  Layer.provideMerge(EnvType.Live),
  Layer.provideMerge(Logger.pretty),
  Layer.provideMerge(
    Layer.scopedDiscard(Effect.annotateLogsScoped('context', 'server'))
  )
);

export const runtime = ManagedRuntime.make(appLayer);

app.get('/endpoint1', (c) => {
  return c.text('Hello Hono from endpoint 1!');
});

app.get('/endpoint2', (c) => {
  return c.text('Hello Hono from endpoint 2!');
});

app.get('/endpoint3', async (c, next) =>
  Effect.gen(function* () {
    yield* Effect.log('inside endpoint handler');
    yield* Effect.log('inside endpoint handler2');

    return yield* Effect.succeed(c.text('Hello Hono from endpoint 3!\n'));
  }).pipe(
    withRequestIdLogAnnotation(c),
    Effect.withSpan('endpoint3'),
    runtime.runPromise
  )
);

const withRequestIdLogAnnotation =
  (c: any) =>
  <A, E, R>(self: Effect.Effect<A, E, R>) =>
    Effect.gen(function* () {
      const { method, path } = c.req;
      yield* Effect.annotateLogsScoped('requestId', Math.random().toString());
      yield* Effect.logInfo(`[Request] ${method} ${path}`);
      const result = yield* self;
      yield* Effect.logInfo(`[Response] ${method} ${path}`);
      return result;
    }).pipe(Effect.scoped);

const mainprogram = Effect.gen(function* () {
  yield* Effect.log('Hello from effect');
});

await runtime.runPromise(mainprogram);
// await runtime.dispose();

export default {
  port: 3001,
  fetch: app.fetch,
};
