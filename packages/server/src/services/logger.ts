import { createLogger } from '@dite/logger';
import _ from '@dite/utils/compiled/lodash';
import { Injectable, LoggerService, LogLevel, Optional } from '@nestjs/common';
import { ConsoleLoggerOptions } from '@nestjs/common/services/console-logger.service';
import { isLogLevelEnabled } from '@nestjs/common/services/utils';
import { clc, yellow } from '../utils/cli-color.util';

export interface LoggerOptions {
  /**
   * Enabled log levels.
   */
  logLevels?: LogLevel[];
  /**
   * If enabled, will print timestamp (time difference) between current and previous log message.
   */
  timestamp?: boolean;
}

const DEFAULT_LOG_LEVELS: LogLevel[] = [
  'log',
  'error',
  'warn',
  'debug',
  'verbose',
];

const isDev = process.env.NODE_ENV !== 'production';

const DISABLED_CONTEXTS = ['NestFactory', 'InstanceLoader'];

@Injectable()
export class Logger implements LoggerService {
  private readonly logger?: ReturnType<typeof createLogger>;
  private static lastTimestampAt: number = Date.now();
  private readonly originalContext?: string;

  constructor();
  constructor(context: string);
  constructor(context: string, options: ConsoleLoggerOptions);
  constructor(
    @Optional()
    protected context?: string,
    @Optional()
    protected options: ConsoleLoggerOptions = {},
  ) {
    if (!options.logLevels) {
      options.logLevels = DEFAULT_LOG_LEVELS;
    }
    if (context) {
      this.originalContext = context;
    }
    if (!context || !DISABLED_CONTEXTS.includes(context)) {
      this.logger = Logger.getLogger();
    }
  }

  static globalLogger: ReturnType<typeof createLogger>;

  static getLogger(): ReturnType<typeof createLogger> {
    if (Logger.globalLogger) {
      Logger.globalLogger = createLogger();
    }
    return Logger.globalLogger;
  }

  /**
   * Write a 'log' level log, if the configured level allows for it.
   * Prints to `stdout` with newline.
   */
  log(message: any, context?: string): void;
  log(message: any, ...optionalParams: [...any, string?]): void;
  log(message: any, ...optionalParams: any[]) {
    if (!this.isLevelEnabled('log')) {
      return;
    }
    const { messages, context } = this.getContextAndMessagesToPrint([
      message,
      ...optionalParams,
    ]);
    this.printMessages(messages, context, 'log');
  }

  /**
   * Write an 'error' level log, if the configured level allows for it.
   * Prints to `stderr` with newline.
   */
  error(message: any, stack?: string, context?: string): void;
  error(message: any, ...optionalParams: [...any, string?, string?]): void;
  error(message: any, ...optionalParams: any[]) {
    if (!this.isLevelEnabled('error')) {
      return;
    }
    const { messages, context, stack } =
      this.getContextAndStackAndMessagesToPrint([message, ...optionalParams]);

    this.printMessages(messages, context, 'error', 'stderr');
    if (stack) {
      this.printStackTrace(stack);
    }
  }

  /**
   * Write a 'warn' level log, if the configured level allows for it.
   * Prints to `stdout` with newline.
   */
  warn(message: any, context?: string): void;
  warn(message: any, ...optionalParams: [...any, string?]): void;
  warn(message: any, ...optionalParams: any[]) {
    if (!this.isLevelEnabled('warn')) {
      return;
    }
    const { messages, context } = this.getContextAndMessagesToPrint([
      message,
      ...optionalParams,
    ]);
    this.printMessages(messages, context, 'warn');
  }

  /**
   * Write a 'debug' level log, if the configured level allows for it.
   * Prints to `stdout` with newline.
   */
  debug(message: any, context?: string): void;
  debug(message: any, ...optionalParams: [...any, string?]): void;
  debug(message: any, ...optionalParams: any[]) {
    if (!this.isLevelEnabled('debug')) {
      return;
    }
    const { messages, context } = this.getContextAndMessagesToPrint([
      message,
      ...optionalParams,
    ]);
    this.printMessages(messages, context, 'debug');
  }

  /**
   * Write a 'verbose' level log, if the configured level allows for it.
   * Prints to `stdout` with newline.
   */
  verbose(message: any, context?: string): void;
  verbose(message: any, ...optionalParams: [...any, string?]): void;
  verbose(message: any, ...optionalParams: any[]) {
    if (!this.isLevelEnabled('verbose')) {
      return;
    }
    const { messages, context } = this.getContextAndMessagesToPrint([
      message,
      ...optionalParams,
    ]);
    this.printMessages(messages, context, 'verbose');
  }

  /**
   * Set log levels
   * @param levels log levels
   */
  setLogLevels(levels: LogLevel[]) {
    if (!this.options) {
      this.options = {};
    }
    this.options.logLevels = levels;
  }

  /**
   * Set logger context
   * @param context context
   */
  setContext(context: string) {
    this.context = context;
  }

  /**
   * Resets the logger context to the value that was passed in the constructor.
   */
  resetContext() {
    this.context = this.originalContext;
  }

  isLevelEnabled(level: LogLevel): boolean {
    const logLevels = this.options?.logLevels;
    return isLogLevelEnabled(level, logLevels);
  }

  protected getTimestamp(): string {
    const localeStringOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      day: '2-digit',
      month: '2-digit',
    };
    return new Date(Date.now()).toLocaleString('zh-CN', localeStringOptions);
  }

  protected printMessages(
    messages: unknown[],
    context = '',
    logLevel: LogLevel = 'log',
    writeStreamType?: 'stdout' | 'stderr',
  ) {
    messages.forEach((message) => {
      const pidMessage = this.formatPid(process.pid);
      const timestampDiff = this.updateAndGetTimestampDiff();
      this.logger?.info({
        logLevel,
        message,
        provider: context || '',
      });
      if (isDev) {
        const formattedLogLevel = logLevel.toUpperCase(); //.padStart(7, ' ')
        const contextMessage = context ? yellow(`[${context}] `) : '';
        const formattedMessage = this.formatMessage(
          logLevel,
          message,
          pidMessage,
          formattedLogLevel,
          contextMessage,
          timestampDiff,
        );
        process[writeStreamType ?? 'stdout'].write(formattedMessage);
      }
    });
  }

  protected formatPid(pid: number) {
    return `[Nest] ${pid}  - `;
  }

  protected formatMessage(
    logLevel: LogLevel,
    message: unknown,
    pidMessage: string,
    formattedLogLevel: string,
    contextMessage: string,
    timestampDiff: string,
  ) {
    const output = this.stringifyMessage(message, logLevel);
    pidMessage = this.colorize(pidMessage, logLevel);
    formattedLogLevel = this.colorize(formattedLogLevel, logLevel);
    return `[${this.getTimestamp()}] ${formattedLogLevel} ${contextMessage}${output}${timestampDiff}\n`;
  }

  protected stringifyMessage(message: unknown, logLevel: LogLevel) {
    return _.isPlainObject(message)
      ? `${this.colorize('Object:', logLevel)}\n${JSON.stringify(
          message,
          (key, value) =>
            typeof value === 'bigint' ? value.toString() : value,
          2,
        )}\n`
      : this.colorize(message as string, logLevel);
  }

  protected colorize(message: string, logLevel: LogLevel) {
    const color = Logger.getColorByLogLevel(logLevel);
    return color(message);
  }

  protected printStackTrace(stack: string) {
    if (!stack) {
      return;
    }
    process.stderr.write(`${stack}\n`);
  }

  private updateAndGetTimestampDiff(): string {
    const includeTimestamp = Logger.lastTimestampAt && this.options?.timestamp;
    const result = includeTimestamp
      ? yellow(` +${Date.now() - Logger.lastTimestampAt}ms`)
      : '';
    Logger.lastTimestampAt = Date.now();
    return result;
  }

  private getContextAndMessagesToPrint(args: unknown[]) {
    if (args?.length <= 1) {
      return { messages: args, context: this.context };
    }
    const lastElement = args[args.length - 1];
    const isContext = _.isString(lastElement);
    if (!isContext) {
      return { messages: args, context: this.context };
    }
    return {
      context: lastElement as string,
      messages: args.slice(0, args.length - 1),
    };
  }

  private getContextAndStackAndMessagesToPrint(args: unknown[]) {
    const { messages, context } = this.getContextAndMessagesToPrint(args);
    if (messages?.length <= 1) {
      return { messages, context };
    }
    const lastElement = messages[messages.length - 1];
    const isStack = _.isString(lastElement);
    if (!isStack) {
      return { messages, context };
    }
    return {
      stack: lastElement as string,
      messages: messages.slice(0, messages.length - 1),
      context,
    };
  }

  private static getColorByLogLevel(level: LogLevel) {
    switch (level) {
      case 'debug':
        return clc.magentaBright;
      case 'warn':
        return clc.yellow;
      case 'error':
        return clc.red;
      case 'verbose':
        return clc.cyanBright;
      default:
        return clc.green;
    }
  }

  // info(message: any, context?: string) {
  //   this.logger.log('info', {
  //     context,
  //     message: _.isPlainObject(message) ? JSON.stringify(message) : message,
  //   });
  // }
  //
  // log(message: any, context?: string) {
  //   this.logger.log('info', {
  //     context,
  //     message: _.isPlainObject(message) ? JSON.stringify(message) : message,
  //   });
  // }
  //
  // debug(message: any, context?: string) {
  //   this.logger.log('debug', {
  //     context,
  //     message: _.isPlainObject(message) ? JSON.stringify(message) : message,
  //   });
  // }
  //
  // error(message: any, trace?: string, context?: string) {
  //   this.logger.log('error', {
  //     context,
  //     message: _.isPlainObject(message) ? JSON.stringify(message) : message,
  //     trace,
  //   });
  // }
  //
  // warn(message: any, context?: string) {
  //   this.logger.log('warn', {
  //     context,
  //     message: _.isPlainObject(message) ? JSON.stringify(message) : message,
  //   });
  // }
  //
  // verbose(message: any, context?: string) {
  //   this.logger.log('verbose', {
  //     context,
  //     message: typeof message === 'object' ? JSON.stringify(message) : message,
  //   });
  // }
}
