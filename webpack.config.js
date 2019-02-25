const path = require('path');
const UnminifiedPlugin = require("unminified-webpack-plugin")
module.exports = {
    entry: ['babel-polyfill','./src/index.js'],
    output: {
        path: path.resolve(__dirname, 'example'),
        filename: 'rx.min.js'
    },
    module: {
        rules: [
            {
                test: /.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                query: {
                    presets: ['@babel/preset-env']
                }
            }
        ]
    },
    plugins: [
        new UnminifiedPlugin({
            postfix: ''
        })
    ]
};