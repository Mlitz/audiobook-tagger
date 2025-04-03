module.exports = {
    presets: [
        ['@babel/preset-env', {
            targets: {
                node: 'current',
                electron: '25.0.0'
            }
        }],
        '@babel/preset-react'
    ],
    plugins: []
};