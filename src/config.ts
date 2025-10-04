import { Config, Effect, Layer } from 'effect';

const EnvTypeWideLiteralConfig = Config.literal(
  'dev',
  'prod',
  'development',
  'production',
  'DEV',
  'PROD',
  'DEVELOPMENT',
  'PRODUCTION'
);

const EnvTypeConfig = EnvTypeWideLiteralConfig('NODE_ENV').pipe(
  Config.orElse(() => EnvTypeWideLiteralConfig('ENV')),
  Config.map((v) =>
    v.toLowerCase().startsWith('dev') ? 'development' : 'production'
  )
);

export class EnvType extends Effect.Tag('@vt/EnvType')<
  EnvType,
  'development' | 'production'
>() {
  static Live = Layer.effect(this, Effect.orDie(EnvTypeConfig));
}
