import { Effect, Layer, Option } from 'effect';
import { EnvType } from './config.js';

export const OptionalDevToolsLayer = Layer.unwrapEffect(
  EnvType.use(
    Effect.fn(function* (env) {
      if (env !== 'development') return Layer.empty;

      const DevTools = yield* Effect.tryPromise(
        // @ts-ignore
        () => import('@effect/experimental/DevTools')
      ).pipe(Effect.option);

      if (Option.isSome(DevTools))
        return DevTools.value.layer('ws://localhost:34437');

      yield* Effect.logWarning(
        'Failed to dynamically import DevTools from `@effect/experimental` in development mode. Is it installed?'
      );

      return Layer.empty;
    })
  )
);
