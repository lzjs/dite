import type { IServicePluginAPI, PluginAPI } from '@dite/core';

export type IApi = PluginAPI &
  IServicePluginAPI & {
    // addApiMiddlewares: IAdd<null, IApiMiddleware>;
    // addBeforeBabelPlugins: IAdd<null, any>;
    // addBeforeBabelPresets: IAdd<null, any>;
    // addBeforeMiddlewares: IAdd<null, RequestHandler>;
    // addEntryCode: IAdd<null, string>;
    // addEntryCodeAhead: IAdd<null, string>;
    // addEntryImports: IAdd<null, IEntryImport>;
    // addEntryImportsAhead: IAdd<null, IEntryImport>;
    // addExtraBabelPlugins: IAdd<null, any>;
    // addExtraBabelPresets: IAdd<null, any>;
    // addHTMLHeadScripts: IAdd<null, IScript>;
    // addHTMLLinks: IAdd<null, ILink>;
    // addHTMLMetas: IAdd<null, IMeta>;
    // addHTMLScripts: IAdd<null, IScript>;
    // addHTMLStyles: IAdd<null, IStyle>;
    // addLayouts: IAdd<null, { file: string; id: string }>;
    // addMiddlewares: IAdd<null, RequestHandler>;
    // addPolyfillImports: IAdd<null, { source: string; specifier?: string }>;
    // addRuntimePlugin: IAdd<null, string>;
    // addRuntimePluginKey: IAdd<null, string>;
    // addTmpGenerateWatcherPaths: IAdd<null, string>;
    // chainWebpack: {
    //   (fn: {
    //     (
    //       memo: WebpackChain,
    //       args: {
    //         env: Env;
    //         webpack: typeof webpack;
    //       },
    //     ): void;
    //   }): void;
    // };
    // modifyHTML: IModify<CheerioAPI, { path: string }>;
    // modifyHTMLFavicon: IModify<string[], {}>;
    // modifyRendererPath: IModify<string, {}>;
    // modifyRoutes: IModify<Record<string, IRoute>, {}>;
    // modifyServerRendererPath: IModify<string, {}>;
    // modifyViteConfig: IModify<
    //   ViteInlineConfig,
    //   {
    //     env: Env;
    //   }
    //   >;
    // modifyWebpackConfig: IModify<
    //   webpack.Configuration,
    //   {
    //     env: Env;
    //     webpack: typeof webpack;
    //   }
    //   >;
    // onBeforeCompiler: IEvent<{}>;
    // onBuildComplete: IEvent<{
    //   err?: Error;
    //   isFirstCompile: boolean;
    //   stats: webpack.Stats;
    //   time: number;
    // }>;
    // onBuildHtmlComplete: IEvent<{}>;
    // onCheckCode: IEvent<{
    //   cjsExports: string[];
    //   code: string;
    //   CodeFrameError: typeof CodeFrameError;
    //   exports: any[];
    //   file: string;
    //   imports: {
    //     default: string;
    //     kind: ImportDeclaration['importKind'];
    //     loc: any;
    //     namespace: string;
    //     source: string;
    //     specifiers: Record<
    //       string,
    //       { kind: ImportDeclaration['importKind']; name: string }
    //       >;
    //   }[];
    //   isFromTmp: boolean;
    // }>;
    // onCheckConfig: IEvent<{
    //   config: Record<string, any>;
    //   userConfig: Record<string, any>;
    // }>;
    // onCheckPkgJSON: IEvent<{
    //   current: Record<string, any>;
    //   origin?: Record<string, any>;
    // }>;
    // onDevCompileDone: IEvent<{
    //   isFirstCompile: boolean;
    //   stats: webpack.Stats;
    //   time: number;
    // }>;
    // onGenerateFiles: IEvent<{
    //   files?: { event: string; path: string } | null;
    //   isFirstTime?: boolean;
    // }>;
    // onPatchRoute: IEvent<{
    //   route: IRoute;
    // }>;
    // onPkgJSONChanged: IEvent<{
    //   current: Record<string, any>;
    //   origin: Record<string, any>;
    // }>;
    restartServer: () => void;
    writeTmpFile: (opts: {
      content?: string;
      context?: Record<string, any>;
      format?: 'cjs' | 'esm';
      noPluginDir?: boolean;
      path: string;
      tpl?: string;
      tplPath?: string;
    }) => void;
  };

export enum EnableBy {
  register = 'register',
  config = 'config',
}
