import { IConfig } from '@dite/core';
import { lodash, logger } from '@dite/utils';
import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ServeStaticOptions } from '@nestjs/platform-express/interfaces/serve-static-options.interface';
import compression from 'compression';
import type { Request, Response } from 'express';
import path from 'path';
import { RequestLoggingInterceptor } from './common/interceptors/logging.interceptor';
import {
  API_DIR,
  CONFIG_FILE,
  getCustomApp,
  NEST_APP_ENTRY_NAME,
} from './helpers';
import { getIp, printMemoryUsage } from './utils';
import expressListRoutes from './utils/route-list';

function isExpress(val: unknown): val is NestExpressApplication {
  return true;
}

type FunctionLike = (...args: any[]) => any;

export class DiteApp<T extends INestApplication = INestApplication> {
  private readonly app: T;
  private initialized = false;
  private config: IConfig;
  private routes: Record<string, Record<string, boolean>> = {};

  protected middleware(req: Request, res: Response, next: FunctionLike): void {
    next();
  }

  constructor(app: T, config: IConfig) {
    this.app = app;
    this.app.use(this.middleware.bind(this));
    this.config = config;
  }

  public static async create<T extends INestApplication = INestApplication>(
    app: T,
    config: IConfig,
  ) {
    return new DiteApp(app, config);
  }

  public async close(): Promise<void> {
    await this.app.close();
  }

  public async restart(): Promise<void> {
    await this.app.close();
    await this.start();
  }

  protected async watch(): Promise<void> {
    process.on('message', (data: any) => {
      const { type, payload } = data || {};
      if (type === 'RELOAD_FILE') {
        this.restart();
      }
    });
  }

  public async start(cb?: () => void): Promise<void> {
    await this.init();
    return await this.app.listen(this.config.port, () => {
      // console.clear()
      printMemoryUsage();
      const lanIp = getIp();
      const protocol = this.config.ssl ? 'https' : 'http';
      logger.info(
        `Start Server at  ${protocol}://127.0.0.1:${this.config.port}`,
      );
      logger.info(`Start on LAN ${protocol}://${lanIp}:${this.config.port}`);
      cb?.();
    });
  }

  public enableRequestLog(enabled: boolean) {
    if (enabled) {
      this.app.useGlobalInterceptors(new RequestLoggingInterceptor());
    }
  }

  public async init(): Promise<this> {
    if (!this.initialized) {
      const { app } = this;
      if (isExpress(app)) {
        app.use(compression());
        const staticPath = path.join(process.cwd(), './public');
        app.useStaticAssets(staticPath, { maxAge: 3600 });
        app.set('x-powered-by', false);
        await app.init();
        const server = app.getHttpServer();
        const router = server._events.request._router;
        this.routes = expressListRoutes(router);
      } else {
        await app.init();
      }
      await this.watch();
      this.initialized = true;
    }
    return this;
  }

  useStaticAssets(options: ServeStaticOptions): this;
  useStaticAssets(path: string, options?: ServeStaticOptions): this;
  public useStaticAssets(path: any, ...args: any[]): this {
    if (isExpress(this.app)) {
      this.app.useStaticAssets(path, ...args);
    }
    return this;
  }
}

export type CustomFactory = (modules: any[]) => Promise<INestApplication>;

export const defineCustom = (factory: CustomFactory): CustomFactory => factory;

export interface DiteApplicationOptions {
  port?: number;
  pwd: string;
}

export async function createServer<
  T extends INestApplication = INestApplication,
>(options: DiteApplicationOptions): Promise<DiteApp<T>> {
  let app: T;
  const custom = await getCustomApp(options.pwd);
  const config = require(path.join(options.pwd, CONFIG_FILE));
  const modules: any[] = [];
  if (!custom) {
    throw new Error(
      `Expect a nest app entry at '/${API_DIR}/${NEST_APP_ENTRY_NAME}.ts'.`,
    );
  }
  if (lodash.isFunction(custom)) {
    app = (await custom(modules)) as T;
  } else {
    app = custom as T;
  }
  const server = await DiteApp.create(app, config);
  app.flushLogs();
  return server;
}
