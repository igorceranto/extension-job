const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        main: './src/main.js',
        background: './src/background.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
    },
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { 
                    from: 'persist.css',
                    to: 'persist.css'
                },
                {
                    from: 'manifest.json',
                    to: 'manifest.json'
                },
                {
                    from: 'popup.html',
                    to: 'popup.html'
                },
                {
                    from: 'icons',
                    to: 'icons'
                }
            ]
        })
    ]
}; 