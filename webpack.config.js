/*
 * @Author: aiun
 * @Date: 2021-04-09 16:55:17
 * @LastEditors: aiun
 * @LastEditTime: 2021-04-22 11:22:33
 * @Description: file content
 */
const MiniCssExtractPlugin = require('mini-css-extract-plugin');//引入css单独打包插件
const HtmlWebpackPlugin = require('html-webpack-plugin');//引入html资源打包插件
const webpack = require('webpack'); //访问内置的插件
const path = require('path');//获取路径
const { resourceUsage } = require('process');
const { resolve } = require('path');

//获取html-webpack-plugin参数的方法
var getHtmlConfig = function(name) {
    return {
        //模板原文件
        template: './src/view/' + name + '.html',
        //打包后的文件
        filename: 'view/' + name + '.html',
        inject: true,
        hash: true,
        chunks: ['common', name] //需要打包的模块
    };
}
//webpack的config
var config = {
    //开发环境
    mode: 'development',
    //打包入口文件
    //多页面应用程序
    entry: {
        common: './src/page/common/index.js',
        index: './src/page/index/index.js',
        login: './src/page/login/index.js'
    },
    //输出路径
    //多个入口输出
    output: {
        //--dirname nodejs的变量，代表当前文件的目录的绝对路径
        path: path.resolve(__dirname, 'dist'),
        filename: 'js/[name].js',
        //提取的文件名
        chunkFilename: 'js/[name]_chunk.js'
    },
    plugins: [
        new MiniCssExtractPlugin({
            //对输出的文件进行重命名
            filename: 'css/[name].css'
        }),
        //打包html资源
        new HtmlWebpackPlugin(getHtmlConfig('index')),
        new HtmlWebpackPlugin(getHtmlConfig('login')),
    ],
    //loader配置
    //不同的文件配置不同的loader处理
    module: {
        rules: [
            //test：匹配哪些文件，use：使用哪些loader进行处理  
            { test: /\.css$/, 
                //创建style标签，将js中的样式资源插入到行，添加到head中生效
                //将css文件变成commonjs模块加载js中，里面内容是样式字符串
                //use数组的执行顺序：从右到左
                //MiniCssExtractPlugin.loader取代'style-loader'，将css单独文件
                use: [MiniCssExtractPlugin.loader, 'css-loader']
            },
            { test: /\.less$/,
                //将less编译成css文件 
                use: ['style-loader', 'css-loader', 'less-loader']
            },
            //处理图片资源
            { test: /\.(gif|png|jpg)$/,
                loader: 'url-loader',
                options: {
                    //图片小于100b，就会被base64处理
                    //优点：减少请求数量（减轻服务器压力）
                    //缺点：图片体积会更大（文件请求速度更慢）
                    limit: 100,
                    //问题：因为url-loader默认使用es6模块化解析，html-loader引入图片是commonjs
                    //解析时会出现问题：[object Module]
                    //关闭url-loader的es6模块化解析，使用commonjs
                    esModule: false,
                    name: '[hash:10].[ext]',
                    //把打包的图片资源输出到image下
                    outputPath: 'resource'
                }
            },
            //处理其他资源(woff|svg|eot|ttf)字体
            {
                exclude: /\.(html|js|less|css|gif|png|jpg)$/,
                loader: 'file-loader',
                options: {
                    name: '[hash:10].[ext]',
                    outputPath: 'media'
                }
            },
            //处理html的img图片（负责引入img，从而能被url-loader进行处理）
            //还可以抽取html的公共模块
            { test: /\.html$/,
                loader: 'html-withimg-loader'
            }
        ]
    },
    //引入全局变量 
    externals: {
        'jquery': 'window.jQuery'
    },
    //提取公共模块
    optimization: {
        splitChunks: {
            //指定哪些类型的chunk参与拆分，
            //all 代表所有模块，async代表只管异步加载的, initial代表初始化时就能获取的模块。
            chunks: 'async',
            //提取出的chunk的最小大小
            //如果提取出来最后生成文件大小比minSize要小，那它仍然不会被提取出来。
            minSize: 20,
            //cacheGroups是splitChunks配置的核心，对代码的拆分规则全在cacheGroups缓存组里配置。
            cacheGroups: {
                //拆分第三方库（通过npm|yarn安装的库）
                defaultVendors: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendor',
                    chunks: 'initial',
                    priority: -10
                },
                default: {
                    name: 'common',
                    //模块被引用2次以上的才抽离
                    minChunks: 2,
                    //优先级
                    priority: -20
                },
                //module.js文件被引用2次以上就抽取放到common里面
                common: {
                    test: /\\module.js/,
                    minChunks: 2,
                    priority: -30
                }
            }
        }
    },
    //开发服务器devServer，用来自动化（自动编译、自动打开浏览器、自动刷新浏览器等）
    //特点：只会在内存中编译打包，不会输出
    //启动指令：npx webpack serve
    devServer: {
        //运行的目录（构建后的）
        contentBase: path.resolve(__dirname, 'dist'),
        //启动gzip压缩
        compress: true,
        port: 9000,
        //自动打开浏览器
        open: true
    }
};
module.exports = config;