const { resolve } = require('path');
const webpack = require("webpack");
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: [ './src/index.tsx' ],
    output: {
        filename: 'js/app.js',
        path: resolve(__dirname, 'public'),
    },
    devtool: 'eval-cheap-source-map',
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".json"],
        fallback: {
            fs: false,
            path: false,
            crypto: false
        },
    },
    devServer: {
        port: '8080',
        hot: true,
        static: './public',
    },
    module: {
        rules: [
            {
                test: /\.[jt]sx?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: require.resolve('babel-loader'),
                        options: {
                            plugins: [require.resolve('react-refresh/babel')],
                        },
                    },
                ],
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ]
    },
    plugins: [
        new SpeedMeasurePlugin(),
        new ForkTsCheckerWebpackPlugin({ typescript: { configFile: 'tsconfig.json' } }),
        new ReactRefreshWebpackPlugin(),

    ],
    optimization: {
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
    },
};